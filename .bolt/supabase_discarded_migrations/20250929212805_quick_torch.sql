/*
  # Automated Accounting State Management

  1. New Database Fields
    - Add `fecha_compromiso_pago` to `evt_ingresos` table
    - Add `pagado` boolean field to `evt_ingresos` table

  2. New Event States
    - Add 'Cerrado', 'Pagos Pendiente', 'Pagados', 'Pagos Vencidos' states

  3. Automated Functions
    - Function to calculate accounting state based on income status
    - Trigger to execute state calculation on income changes

  4. Business Logic
    - Only process events in 'Cerrado' state
    - Check all incomes for billing and payment status
    - Update event state based on payment deadlines
*/

-- Add new fields to evt_ingresos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_ingresos' AND column_name = 'pagado'
  ) THEN
    ALTER TABLE evt_ingresos ADD COLUMN pagado boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evt_ingresos' AND column_name = 'fecha_compromiso_pago'
  ) THEN
    ALTER TABLE evt_ingresos ADD COLUMN fecha_compromiso_pago date;
  END IF;
END $$;

-- Insert new event states if they don't exist
INSERT INTO evt_estados (nombre, descripcion, color, orden, workflow_step) VALUES
('Cerrado', 'Evento completado, pendiente de facturación', '#6B7280', 8, 8),
('Pagos Pendiente', 'Evento facturado, pagos pendientes dentro de plazo', '#F59E0B', 9, 9),
('Pagados', 'Evento completamente pagado', '#10B981', 10, 10),
('Pagos Vencidos', 'Evento con pagos vencidos', '#EF4444', 11, 11)
ON CONFLICT (nombre) DO NOTHING;

-- Function to calculate accounting state for an event
CREATE OR REPLACE FUNCTION calculate_event_accounting_state(event_id_param integer)
RETURNS void AS $$
DECLARE
    current_state_name text;
    total_ingresos integer;
    ingresos_facturados integer;
    ingresos_pagados integer;
    ingresos_vencidos integer;
    new_state_id integer;
    new_state_name text;
BEGIN
    -- Get current event state
    SELECT es.nombre INTO current_state_name
    FROM evt_eventos e
    JOIN evt_estados es ON e.estado_id = es.id
    WHERE e.id = event_id_param;

    -- Only process events in 'Cerrado' state
    IF current_state_name != 'Cerrado' THEN
        RETURN;
    END IF;

    -- Count total incomes for this event
    SELECT COUNT(*) INTO total_ingresos
    FROM evt_ingresos
    WHERE evento_id = event_id_param;

    -- If no incomes, keep as 'Cerrado'
    IF total_ingresos = 0 THEN
        RETURN;
    END IF;

    -- Count facturated incomes
    SELECT COUNT(*) INTO ingresos_facturados
    FROM evt_ingresos
    WHERE evento_id = event_id_param AND facturado = true;

    -- If not all incomes are invoiced, keep as 'Cerrado'
    IF ingresos_facturados < total_ingresos THEN
        RETURN;
    END IF;

    -- Count paid incomes
    SELECT COUNT(*) INTO ingresos_pagados
    FROM evt_ingresos
    WHERE evento_id = event_id_param AND facturado = true AND pagado = true;

    -- Count overdue incomes (not paid and past due date)
    SELECT COUNT(*) INTO ingresos_vencidos
    FROM evt_ingresos
    WHERE evento_id = event_id_param 
      AND facturado = true 
      AND pagado = false 
      AND fecha_compromiso_pago IS NOT NULL 
      AND fecha_compromiso_pago < CURRENT_DATE;

    -- Determine new state based on payment status
    IF ingresos_pagados = total_ingresos THEN
        -- All incomes are paid
        new_state_name := 'Pagados';
    ELSIF ingresos_vencidos > 0 THEN
        -- Some payments are overdue
        new_state_name := 'Pagos Vencidos';
    ELSE
        -- Payments are pending but not overdue
        new_state_name := 'Pagos Pendiente';
    END IF;

    -- Get the new state ID
    SELECT id INTO new_state_id
    FROM evt_estados
    WHERE nombre = new_state_name;

    -- Update event state if a valid state was found
    IF new_state_id IS NOT NULL THEN
        UPDATE evt_eventos
        SET estado_id = new_state_id,
            updated_at = now(),
            updated_by = NULL -- System update
        WHERE id = event_id_param;

        -- Log the state change
        INSERT INTO core_audit_log (
            company_id,
            user_id,
            timestamp,
            action,
            module,
            entity_type,
            entity_id,
            old_value,
            new_value,
            success
        )
        SELECT 
            e.company_id,
            NULL, -- System action
            now(),
            'automated_state_change',
            'eventos',
            'evt_eventos',
            event_id_param::text,
            jsonb_build_object('estado_anterior', current_state_name),
            jsonb_build_object(
                'estado_nuevo', new_state_name,
                'total_ingresos', total_ingresos,
                'ingresos_facturados', ingresos_facturados,
                'ingresos_pagados', ingresos_pagados,
                'ingresos_vencidos', ingresos_vencidos
            ),
            true
        FROM evt_eventos e
        WHERE e.id = event_id_param;

        RAISE NOTICE 'Event % state changed from % to %', event_id_param, current_state_name, new_state_name;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        INSERT INTO core_audit_log (
            company_id,
            user_id,
            timestamp,
            action,
            module,
            entity_type,
            entity_id,
            error_message,
            success
        ) VALUES (
            NULL,
            NULL,
            now(),
            'automated_state_change_error',
            'eventos',
            'evt_eventos',
            event_id_param::text,
            SQLERRM,
            false
        );
        
        RAISE WARNING 'Error calculating accounting state for event %: %', event_id_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to execute accounting state calculation
CREATE OR REPLACE FUNCTION trigger_calculate_accounting_state()
RETURNS trigger AS $$
BEGIN
    -- Determine which event to process
    DECLARE
        target_event_id integer;
    BEGIN
        IF TG_OP = 'DELETE' THEN
            target_event_id := OLD.evento_id;
        ELSE
            target_event_id := NEW.evento_id;
        END IF;

        -- Execute the calculation asynchronously to avoid blocking the transaction
        PERFORM calculate_event_accounting_state(target_event_id);
        
        -- Return appropriate record
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on evt_ingresos table
DROP TRIGGER IF EXISTS trg_calculate_accounting_state ON evt_ingresos;
CREATE TRIGGER trg_calculate_accounting_state
    AFTER INSERT OR UPDATE OR DELETE ON evt_ingresos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_accounting_state();

-- Function to manually recalculate all closed events (for maintenance)
CREATE OR REPLACE FUNCTION recalculate_all_closed_events()
RETURNS TABLE(
    event_id integer,
    event_name text,
    old_state text,
    new_state text,
    processed_at timestamp
) AS $$
DECLARE
    event_record record;
    old_state_name text;
    new_state_name text;
BEGIN
    -- Process all events in 'Cerrado' state
    FOR event_record IN
        SELECT e.id, e.nombre_proyecto, es.nombre as current_state
        FROM evt_eventos e
        JOIN evt_estados es ON e.estado_id = es.id
        WHERE es.nombre = 'Cerrado' AND e.activo = true
    LOOP
        -- Store old state
        old_state_name := event_record.current_state;
        
        -- Calculate new state
        PERFORM calculate_event_accounting_state(event_record.id);
        
        -- Get new state name
        SELECT es.nombre INTO new_state_name
        FROM evt_eventos e
        JOIN evt_estados es ON e.estado_id = es.id
        WHERE e.id = event_record.id;
        
        -- Return result
        event_id := event_record.id;
        event_name := event_record.nombre_proyecto;
        old_state := old_state_name;
        new_state := new_state_name;
        processed_at := now();
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_evt_ingresos_evento_facturado_pagado 
ON evt_ingresos(evento_id, facturado, pagado);

CREATE INDEX IF NOT EXISTS idx_evt_ingresos_fecha_compromiso 
ON evt_ingresos(fecha_compromiso_pago) 
WHERE fecha_compromiso_pago IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evt_eventos_estado_activo 
ON evt_eventos(estado_id, activo);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_event_accounting_state(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_all_closed_events() TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Automated accounting state management system installed successfully!';
    RAISE NOTICE 'New states added: Cerrado, Pagos Pendiente, Pagados, Pagos Vencidos';
    RAISE NOTICE 'Triggers activated on evt_ingresos table';
    RAISE NOTICE 'Use recalculate_all_closed_events() to process existing events';
END $$;