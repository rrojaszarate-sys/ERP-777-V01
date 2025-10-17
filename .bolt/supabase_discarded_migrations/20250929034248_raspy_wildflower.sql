/*
  # MADE ERP v2.0 - Complete Database Reconstruction
  
  This script reconstructs the entire MADE ERP v2.0 database schema with:
  1. Core system tables (companies, users, roles)
  2. Events module tables (events, clients, income, expenses)
  3. Automatic calculation triggers
  4. Dashboard and reporting views
  5. Test data for immediate use
  6. RLS policies (commented out for development)
  
  Execute this script in Supabase SQL Editor to set up the complete system.
*/

-- =============================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional UUID functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 2. UTILITY FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate income totals (subtotal, IVA, total)
CREATE OR REPLACE FUNCTION calculate_income_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal from cantidad * precio_unitario
    NEW.subtotal = COALESCE(NEW.cantidad, 1) * COALESCE(NEW.precio_unitario, 0);
    
    -- Calculate IVA from subtotal * iva_porcentaje
    NEW.iva = NEW.subtotal * (COALESCE(NEW.iva_porcentaje, 16) / 100);
    
    -- Calculate total as subtotal + iva
    NEW.total = NEW.subtotal + NEW.iva;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate expense totals (subtotal, IVA, total)
CREATE OR REPLACE FUNCTION calculate_expense_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal from cantidad * precio_unitario
    NEW.subtotal = COALESCE(NEW.cantidad, 1) * COALESCE(NEW.precio_unitario, 0);
    
    -- Calculate IVA from subtotal * iva_porcentaje
    NEW.iva = NEW.subtotal * (COALESCE(NEW.iva_porcentaje, 16) / 100);
    
    -- Calculate total as subtotal + iva
    NEW.total = NEW.subtotal + NEW.iva;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update event financial totals when income/expenses change
CREATE OR REPLACE FUNCTION update_event_financials()
RETURNS TRIGGER AS $$
DECLARE
    event_id_to_update INTEGER;
    total_ingresos NUMERIC := 0;
    total_gastos NUMERIC := 0;
    utilidad_calculada NUMERIC := 0;
    margen_calculado NUMERIC := 0;
BEGIN
    -- Determine which event to update
    IF TG_OP = 'DELETE' THEN
        event_id_to_update = OLD.evento_id;
    ELSE
        event_id_to_update = NEW.evento_id;
    END IF;
    
    -- Calculate total income for the event
    SELECT COALESCE(SUM(total), 0) INTO total_ingresos
    FROM evt_ingresos 
    WHERE evento_id = event_id_to_update;
    
    -- Calculate total expenses for the event
    SELECT COALESCE(SUM(total), 0) INTO total_gastos
    FROM evt_gastos 
    WHERE evento_id = event_id_to_update AND deleted_at IS NULL;
    
    -- Calculate profit and margin
    utilidad_calculada = total_ingresos - total_gastos;
    margen_calculado = CASE 
        WHEN total_ingresos > 0 THEN (utilidad_calculada / total_ingresos) * 100
        ELSE 0 
    END;
    
    -- Update the event with calculated totals
    UPDATE evt_eventos 
    SET 
        subtotal = total_ingresos / 1.16, -- Assuming 16% IVA
        iva = total_ingresos - (total_ingresos / 1.16),
        total = total_ingresos,
        total_gastos = total_gastos,
        utilidad = utilidad_calculada,
        margen_utilidad = margen_calculado,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = event_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- =============================================================================
-- 3. CORE SYSTEM TABLES
-- =============================================================================

-- Companies table - Multi-tenant support
CREATE TABLE IF NOT EXISTS core_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    rfc VARCHAR(13) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    logo_url TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users table - System users
CREATE TABLE IF NOT EXISTS core_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES core_companies(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255),
    telefono VARCHAR(20),
    puesto VARCHAR(100),
    avatar_url TEXT,
    activo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roles table - System roles and permissions
CREATE TABLE IF NOT EXISTS core_roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS core_user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES core_users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES core_roles(id) ON DELETE CASCADE,
    asignado_por UUID REFERENCES core_users(id),
    fecha_asignacion TIMESTAMPTZ DEFAULT now(),
    activo BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- System configuration table
CREATE TABLE IF NOT EXISTS core_system_config (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES core_companies(id),
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES core_users(id),
    UNIQUE(company_id, config_key)
);

-- Security configuration table
CREATE TABLE IF NOT EXISTS core_security_config (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES core_companies(id),
    security_mode VARCHAR(20) DEFAULT 'development',
    rls_enabled BOOLEAN DEFAULT false,
    bypass_auth BOOLEAN DEFAULT true,
    enable_permissions BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 480,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES core_users(id)
);

-- Audit log table
CREATE TABLE IF NOT EXISTS core_audit_log (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES core_companies(id),
    user_id UUID REFERENCES core_users(id),
    timestamp TIMESTAMPTZ DEFAULT now(),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    duration INTEGER
);

-- =============================================================================
-- 4. EVENTS MODULE TABLES
-- =============================================================================

-- Event types table
CREATE TABLE IF NOT EXISTS evt_tipos_evento (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES core_companies(id),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#74F1C8',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Event states table
CREATE TABLE IF NOT EXISTS evt_estados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    color VARCHAR(7),
    orden INTEGER DEFAULT 0,
    workflow_step INTEGER
);

-- Expense categories table
CREATE TABLE IF NOT EXISTS evt_categorias_gastos (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES core_companies(id),
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#16A085',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Clients table
CREATE TABLE IF NOT EXISTS evt_clientes (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES core_companies(id),
    razon_social TEXT NOT NULL,
    nombre_comercial TEXT,
    rfc TEXT NOT NULL,
    email TEXT,
    telefono TEXT,
    direccion_fiscal TEXT,
    contacto_principal TEXT,
    telefono_contacto TEXT,
    email_contacto TEXT,
    regimen_fiscal TEXT,
    uso_cfdi TEXT,
    metodo_pago TEXT,
    forma_pago TEXT,
    dias_credito INTEGER,
    limite_credito NUMERIC,
    activo BOOLEAN DEFAULT true,
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES core_users(id)
);

-- Events table
CREATE TABLE IF NOT EXISTS evt_eventos (
    id SERIAL PRIMARY KEY,
    company_id UUID REFERENCES core_companies(id),
    clave_evento VARCHAR(50) UNIQUE NOT NULL,
    nombre_proyecto TEXT NOT NULL,
    descripcion TEXT,
    cliente_id INTEGER REFERENCES evt_clientes(id),
    tipo_evento_id INTEGER REFERENCES evt_tipos_evento(id),
    estado_id INTEGER REFERENCES evt_estados(id) DEFAULT 1,
    responsable_id UUID REFERENCES core_users(id),
    fecha_evento DATE NOT NULL,
    fecha_fin DATE,
    hora_inicio TIME,
    hora_fin TIME,
    lugar TEXT,
    numero_invitados INTEGER,
    presupuesto_estimado NUMERIC DEFAULT 0,
    
    -- Financial calculations (auto-calculated by triggers)
    subtotal NUMERIC DEFAULT 0,
    iva_porcentaje NUMERIC DEFAULT 16,
    iva NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    total_gastos NUMERIC DEFAULT 0,
    utilidad NUMERIC DEFAULT 0,
    margen_utilidad NUMERIC DEFAULT 0,
    
    -- Status tracking
    status_facturacion VARCHAR(20) DEFAULT 'pendiente_facturar',
    status_pago VARCHAR(20) DEFAULT 'pendiente',
    fecha_facturacion DATE,
    fecha_vencimiento DATE,
    fecha_pago DATE,
    documento_factura_url TEXT,
    documento_pago_url TEXT,
    
    -- Project management
    prioridad VARCHAR(10) DEFAULT 'media',
    fase_proyecto VARCHAR(20) DEFAULT 'cotizacion',
    notas TEXT,
    
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES core_users(id),
    updated_by UUID REFERENCES core_users(id)
);

-- Income table
CREATE TABLE IF NOT EXISTS evt_ingresos (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER REFERENCES evt_eventos(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL,
    descripcion TEXT,
    cantidad NUMERIC DEFAULT 1,
    precio_unitario NUMERIC DEFAULT 0,
    subtotal NUMERIC DEFAULT 0,
    iva_porcentaje NUMERIC DEFAULT 16,
    iva NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    fecha_ingreso DATE DEFAULT CURRENT_DATE,
    referencia TEXT,
    documento_url TEXT,
    
    -- Billing status
    facturado BOOLEAN DEFAULT false,
    cobrado BOOLEAN DEFAULT false,
    fecha_facturacion DATE,
    fecha_cobro DATE,
    metodo_cobro VARCHAR(20),
    
    -- File attachment (migrated from OCR)
    archivo_adjunto TEXT,
    archivo_nombre TEXT,
    archivo_tamaño INTEGER,
    archivo_tipo VARCHAR(100),
    
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES core_users(id)
);

-- Expenses table
CREATE TABLE IF NOT EXISTS evt_gastos (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER REFERENCES evt_eventos(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES evt_categorias_gastos(id),
    concepto TEXT NOT NULL,
    descripcion TEXT,
    cantidad NUMERIC DEFAULT 1,
    precio_unitario NUMERIC DEFAULT 0,
    subtotal NUMERIC DEFAULT 0,
    iva_porcentaje NUMERIC DEFAULT 16,
    iva NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    proveedor TEXT,
    rfc_proveedor VARCHAR(13),
    fecha_gasto DATE DEFAULT CURRENT_DATE,
    forma_pago VARCHAR(20) DEFAULT 'transferencia',
    referencia TEXT,
    documento_url TEXT,
    
    -- Approval workflow
    status_aprobacion VARCHAR(20) DEFAULT 'pendiente',
    aprobado_por UUID REFERENCES core_users(id),
    fecha_aprobacion DATE,
    
    -- File attachment (migrated from OCR)
    archivo_adjunto TEXT,
    archivo_nombre TEXT,
    archivo_tamaño INTEGER,
    archivo_tipo VARCHAR(100),
    
    -- Soft delete
    notas TEXT,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES core_users(id),
    delete_reason TEXT,
    
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES core_users(id)
);

-- =============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- =============================================================================

-- Core tables indexes
CREATE INDEX IF NOT EXISTS idx_core_users_company_id ON core_users(company_id);
CREATE INDEX IF NOT EXISTS idx_core_users_email ON core_users(email);
CREATE INDEX IF NOT EXISTS idx_core_audit_log_timestamp ON core_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_core_audit_log_user_id ON core_audit_log(user_id);

-- Events module indexes
CREATE INDEX IF NOT EXISTS idx_evt_clientes_company_id ON evt_clientes(company_id);
CREATE INDEX IF NOT EXISTS idx_evt_clientes_rfc ON evt_clientes(rfc);
CREATE INDEX IF NOT EXISTS idx_evt_clientes_activo ON evt_clientes(activo);
CREATE INDEX IF NOT EXISTS idx_evt_clientes_created_at ON evt_clientes(created_at);

CREATE INDEX IF NOT EXISTS idx_evt_eventos_cliente_id ON evt_eventos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_evt_eventos_responsable_id ON evt_eventos(responsable_id);
CREATE INDEX IF NOT EXISTS idx_evt_eventos_fecha_evento ON evt_eventos(fecha_evento);
CREATE INDEX IF NOT EXISTS idx_evt_eventos_status_pago ON evt_eventos(status_pago);
CREATE INDEX IF NOT EXISTS idx_evt_eventos_activo ON evt_eventos(activo);

CREATE INDEX IF NOT EXISTS idx_evt_ingresos_evento_id ON evt_ingresos(evento_id);
CREATE INDEX IF NOT EXISTS idx_evt_ingresos_fecha_ingreso ON evt_ingresos(fecha_ingreso);

CREATE INDEX IF NOT EXISTS idx_evt_gastos_evento_id ON evt_gastos(evento_id);
CREATE INDEX IF NOT EXISTS idx_evt_gastos_categoria_id ON evt_gastos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_evt_gastos_fecha_gasto ON evt_gastos(fecha_gasto);
CREATE INDEX IF NOT EXISTS idx_evt_gastos_activo ON evt_gastos(activo);

-- =============================================================================
-- 6. TRIGGERS FOR AUTOMATIC CALCULATIONS
-- =============================================================================

-- Trigger to update updated_at on core tables
CREATE TRIGGER update_core_companies_updated_at
    BEFORE UPDATE ON core_companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_core_users_updated_at
    BEFORE UPDATE ON core_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evt_clientes_updated_at
    BEFORE UPDATE ON evt_clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evt_eventos_updated_at
    BEFORE UPDATE ON evt_eventos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evt_ingresos_updated_at
    BEFORE UPDATE ON evt_ingresos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evt_gastos_updated_at
    BEFORE UPDATE ON evt_gastos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for automatic financial calculations
CREATE TRIGGER calculate_income_totals_trigger
    BEFORE INSERT OR UPDATE ON evt_ingresos
    FOR EACH ROW EXECUTE FUNCTION calculate_income_totals();

CREATE TRIGGER calculate_expense_totals_trigger
    BEFORE INSERT OR UPDATE ON evt_gastos
    FOR EACH ROW EXECUTE FUNCTION calculate_expense_totals();

-- Triggers to update event totals when income/expenses change
CREATE TRIGGER update_event_financials_on_income
    AFTER INSERT OR UPDATE OR DELETE ON evt_ingresos
    FOR EACH ROW EXECUTE FUNCTION update_event_financials();

CREATE TRIGGER update_event_financials_on_expense
    AFTER INSERT OR UPDATE OR DELETE ON evt_gastos
    FOR EACH ROW EXECUTE FUNCTION update_event_financials();

-- =============================================================================
-- 7. DASHBOARD AND REPORTING VIEWS
-- =============================================================================

-- Complete events view with all related data
CREATE OR REPLACE VIEW vw_eventos_completos AS
SELECT 
    e.*,
    -- Client information
    c.razon_social as cliente_nombre,
    c.nombre_comercial as cliente_comercial,
    c.rfc as cliente_rfc,
    c.email as cliente_email,
    c.telefono as cliente_telefono,
    c.contacto_principal,
    -- Event type information
    te.nombre as tipo_evento,
    te.color as tipo_color,
    -- State information
    es.nombre as estado,
    es.color as estado_color,
    es.workflow_step,
    -- Responsible user information
    u.nombre as responsable_nombre,
    -- Payment status calculations
    CASE 
        WHEN e.fecha_vencimiento IS NOT NULL AND e.fecha_vencimiento < CURRENT_DATE AND e.status_pago != 'pagado'
        THEN CURRENT_DATE - e.fecha_vencimiento
        ELSE 0
    END as dias_vencido,
    CASE 
        WHEN e.fecha_vencimiento IS NOT NULL AND e.fecha_vencimiento < CURRENT_DATE AND e.status_pago != 'pagado'
        THEN 'vencido'
        WHEN e.status_pago = 'pagado'
        THEN 'pagado'
        ELSE 'vigente'
    END as status_vencimiento,
    -- Audit information
    cu.nombre as creado_por,
    uu.nombre as actualizado_por
FROM evt_eventos e
LEFT JOIN evt_clientes c ON e.cliente_id = c.id
LEFT JOIN evt_tipos_evento te ON e.tipo_evento_id = te.id
LEFT JOIN evt_estados es ON e.estado_id = es.id
LEFT JOIN core_users u ON e.responsable_id = u.id
LEFT JOIN core_users cu ON e.created_by = cu.id
LEFT JOIN core_users uu ON e.updated_by = uu.id
WHERE e.activo = true;

-- Dashboard metrics view
CREATE OR REPLACE VIEW vw_dashboard_metricas AS
SELECT 
    COUNT(*) as total_eventos,
    COUNT(*) FILTER (WHERE fecha_evento > CURRENT_DATE) as eventos_futuros,
    COUNT(*) FILTER (WHERE fecha_evento <= CURRENT_DATE) as eventos_pasados,
    COUNT(*) FILTER (WHERE status_pago != 'pagado') as pagos_pendientes,
    COUNT(*) FILTER (WHERE status_facturacion = 'pendiente_facturar') as facturas_pendientes,
    COUNT(*) FILTER (WHERE fecha_vencimiento < CURRENT_DATE AND status_pago != 'pagado') as pagos_vencidos,
    COUNT(*) FILTER (WHERE status_pago = 'pagado') as eventos_cobrados,
    COALESCE(SUM(total), 0) as ingresos_totales,
    COALESCE(SUM(total) FILTER (WHERE status_pago = 'pagado'), 0) as ingresos_cobrados,
    COALESCE(SUM(total) FILTER (WHERE status_pago != 'pagado'), 0) as ingresos_por_cobrar,
    COALESCE(SUM(total_gastos), 0) as gastos_totales,
    COALESCE(SUM(utilidad), 0) as utilidad_total,
    CASE 
        WHEN COUNT(*) > 0 THEN AVG(margen_utilidad)
        ELSE 0 
    END as margen_promedio,
    CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE status_pago = 'pagado')::NUMERIC / COUNT(*)) * 100
        ELSE 0 
    END as tasa_cobranza,
    CASE 
        WHEN SUM(total) > 0 THEN SUM(total_gastos) / SUM(total)
        ELSE 0 
    END as ratio_gastos_ingresos
FROM evt_eventos 
WHERE activo = true;

-- Temporal analysis view
CREATE OR REPLACE VIEW vw_analisis_temporal AS
SELECT 
    EXTRACT(YEAR FROM fecha_evento)::INTEGER as año,
    EXTRACT(MONTH FROM fecha_evento)::INTEGER as mes,
    COUNT(*) as total_eventos,
    COALESCE(SUM(total), 0) as ingresos_mes,
    COALESCE(SUM(total_gastos), 0) as gastos_mes,
    COALESCE(SUM(utilidad), 0) as utilidad_mes,
    CASE 
        WHEN COUNT(*) > 0 THEN AVG(margen_utilidad)
        ELSE 0 
    END as margen_promedio,
    COUNT(*) FILTER (WHERE status_pago = 'pagado') as eventos_cobrados,
    COUNT(*) FILTER (WHERE status_pago != 'pagado') as eventos_pendientes
FROM evt_eventos 
WHERE activo = true
GROUP BY EXTRACT(YEAR FROM fecha_evento), EXTRACT(MONTH FROM fecha_evento)
ORDER BY año DESC, mes DESC;

-- Expenses by category view
CREATE OR REPLACE VIEW vw_gastos_por_categoria AS
SELECT 
    c.id as categoria_id,
    c.nombre as categoria,
    c.color as categoria_color,
    COUNT(g.id) as total_gastos,
    COALESCE(SUM(g.total), 0) as monto_total,
    CASE 
        WHEN COUNT(g.id) > 0 THEN AVG(g.total)
        ELSE 0 
    END as promedio_gasto,
    COUNT(g.id) FILTER (WHERE g.status_aprobacion = 'aprobado') as gastos_aprobados,
    COUNT(g.id) FILTER (WHERE g.status_aprobacion = 'pendiente') as gastos_pendientes
FROM evt_categorias_gastos c
LEFT JOIN evt_gastos g ON c.id = g.categoria_id AND g.activo = true AND g.deleted_at IS NULL
WHERE c.activo = true
GROUP BY c.id, c.nombre, c.color
ORDER BY monto_total DESC;

-- Master billing view
CREATE OR REPLACE VIEW vw_master_facturacion AS
SELECT 
    e.id as evento_id,
    e.clave_evento,
    e.nombre_proyecto as evento_nombre,
    e.fecha_evento,
    e.total,
    e.utilidad,
    e.status_facturacion,
    e.status_pago,
    e.fecha_facturacion,
    e.fecha_vencimiento,
    e.fecha_pago,
    c.razon_social as cliente_nombre,
    c.rfc as cliente_rfc,
    u.nombre as responsable,
    EXTRACT(YEAR FROM e.fecha_evento)::INTEGER as año,
    EXTRACT(MONTH FROM e.fecha_evento)::INTEGER as mes,
    CASE 
        WHEN e.fecha_vencimiento IS NOT NULL AND e.fecha_vencimiento < CURRENT_DATE AND e.status_pago != 'pagado'
        THEN CURRENT_DATE - e.fecha_vencimiento
        ELSE 0
    END as dias_vencido
FROM evt_eventos e
LEFT JOIN evt_clientes c ON e.cliente_id = c.id
LEFT JOIN core_users u ON e.responsable_id = u.id
WHERE e.activo = true
ORDER BY e.fecha_evento DESC;

-- =============================================================================
-- 8. ROW LEVEL SECURITY (COMMENTED OUT FOR DEVELOPMENT)
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE core_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_tipos_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_categorias_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE evt_gastos ENABLE ROW LEVEL SECURITY;

-- DEVELOPMENT MODE: Permissive policies (allow all operations for authenticated users)
-- Comment out these policies in production and implement proper security

-- Core tables policies
CREATE POLICY "Users can manage companies" ON core_companies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage users" ON core_users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can read roles" ON core_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage user roles" ON core_user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage system config" ON core_system_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage security config" ON core_security_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can read audit log" ON core_audit_log FOR SELECT TO authenticated USING (true);

-- Events module policies
CREATE POLICY "Users can manage event types" ON evt_tipos_evento FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can read event states" ON evt_estados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage expense categories" ON evt_categorias_gastos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage clients" ON evt_clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage events" ON evt_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage income" ON evt_ingresos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage expenses" ON evt_gastos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- 9. REFERENCE DATA
-- =============================================================================

-- Insert default roles
INSERT INTO core_roles (nombre, descripcion, permisos) VALUES
('Administrador', 'Acceso completo al sistema', '["*.*.*.*"]'::jsonb),
('Ejecutivo', 'Gestión de eventos y clientes', '["dashboard.read.*.*", "eventos.*.*.*", "clientes.*.*.*", "gastos.*.*.*", "ingresos.*.*.*"]'::jsonb),
('Visualizador', 'Solo lectura', '["dashboard.read.*.*", "eventos.read.*.*", "clientes.read.*.*"]'::jsonb)
ON CONFLICT (nombre) DO NOTHING;

-- Insert default event states
INSERT INTO evt_estados (nombre, descripcion, color, orden, workflow_step) VALUES
('Borrador', 'Evento en borrador', '#6B7280', 1, 1),
('Cotizado', 'Evento cotizado', '#3B82F6', 2, 2),
('Aprobado', 'Evento aprobado por el cliente', '#10B981', 3, 3),
('En Proceso', 'Evento en ejecución', '#F59E0B', 4, 4),
('Completado', 'Evento completado', '#059669', 5, 5),
('Facturado', 'Evento facturado', '#7C3AED', 6, 6),
('Cobrado', 'Evento cobrado completamente', '#059669', 7, 7)
ON CONFLICT (nombre) DO NOTHING;

-- =============================================================================
-- 10. TEST DATA FOR DEVELOPMENT
-- =============================================================================

-- Insert demo company
INSERT INTO core_companies (id, nombre, rfc, email, telefono, direccion, activo) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'EMPRESA DEMO S.A. de C.V.', 'EDE123456789', 'contacto@empresademo.com', '55-1234-5678', 'Av. Demo 123, Col. Desarrollo, CDMX', true)
ON CONFLICT (rfc) DO NOTHING;

-- Insert demo users with specific UUIDs for each role
INSERT INTO core_users (id, company_id, email, nombre, apellidos, puesto, activo) VALUES
('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'admin@demo.com', 'Admin', 'Usuario', 'Administrador del Sistema', true),
('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'ejecutivo@demo.com', 'Juan Carlos', 'Martínez López', 'Ejecutivo de Eventos', true),
('33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', 'viewer@demo.com', 'María Elena', 'García Sánchez', 'Visualizador', true)
ON CONFLICT (email) DO NOTHING;

-- Assign roles to demo users
INSERT INTO core_user_roles (user_id, role_id, asignado_por, activo) VALUES
('11111111-1111-1111-1111-111111111111', 1, '11111111-1111-1111-1111-111111111111', true),
('22222222-2222-2222-2222-222222222222', 2, '11111111-1111-1111-1111-111111111111', true),
('33333333-3333-3333-3333-333333333333', 3, '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Insert default event types
INSERT INTO evt_tipos_evento (company_id, nombre, descripcion, color) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Conferencia', 'Eventos de conferencias y seminarios', '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440000', 'Corporativo', 'Eventos corporativos y empresariales', '#10B981'),
('550e8400-e29b-41d4-a716-446655440000', 'Social', 'Eventos sociales y celebraciones', '#F59E0B'),
('550e8400-e29b-41d4-a716-446655440000', 'Comercial', 'Eventos comerciales y ferias', '#EF4444'),
('550e8400-e29b-41d4-a716-446655440000', 'Educativo', 'Eventos educativos y capacitación', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- Insert default expense categories
INSERT INTO evt_categorias_gastos (company_id, nombre, descripcion, color) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Servicios Profesionales', 'Servicios profesionales y consultoría', '#3B82F6'),
('550e8400-e29b-41d4-a716-446655440000', 'Recursos Humanos', 'Gastos de personal y nómina', '#10B981'),
('550e8400-e29b-41d4-a716-446655440000', 'Materiales', 'Materiales y suministros', '#F59E0B'),
('550e8400-e29b-41d4-a716-446655440000', 'Combustible/Casetas', 'Combustible y gastos de transporte', '#EF4444'),
('550e8400-e29b-41d4-a716-446655440000', 'Otros', 'Otros gastos diversos', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- Insert demo clients
INSERT INTO evt_clientes (company_id, razon_social, nombre_comercial, rfc, email, telefono, contacto_principal, regimen_fiscal, uso_cfdi, metodo_pago, forma_pago, dias_credito, limite_credito, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Tech Innovations SA de CV', 'TechInno', 'TIN123456ABC', 'contacto@techinno.com', '55-1234-5678', 'Ana García', '601', 'G03', 'PUE', '03', 30, 100000, '11111111-1111-1111-1111-111111111111'),
('550e8400-e29b-41d4-a716-446655440000', 'Corporativo Global SA', 'CorpGlobal', 'CGL789012DEF', 'eventos@corpglobal.com', '55-9876-5432', 'Carlos Rodríguez', '612', 'G01', 'PPD', '03', 45, 250000, '11111111-1111-1111-1111-111111111111'),
('550e8400-e29b-41d4-a716-446655440000', 'Innovación Digital SRL', 'InnovaDigital', 'IDS456789GHI', 'info@innovadigital.mx', '55-5555-1234', 'Laura Martínez', '621', 'G03', 'PUE', '04', 15, 75000, '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- Insert demo events
INSERT INTO evt_eventos (company_id, clave_evento, nombre_proyecto, descripcion, cliente_id, tipo_evento_id, estado_id, responsable_id, fecha_evento, fecha_fin, hora_inicio, hora_fin, lugar, numero_invitados, presupuesto_estimado, status_facturacion, status_pago, prioridad, fase_proyecto, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'EVT-2025-001', 'Conferencia Tech 2025', 'Conferencia anual de tecnología e innovación', 1, 1, 3, '22222222-2222-2222-2222-222222222222', '2025-03-15', '2025-03-17', '09:00', '18:00', 'Centro de Convenciones WTC', 300, 150000, 'pendiente_facturar', 'pendiente', 'alta', 'aprobado', '11111111-1111-1111-1111-111111111111'),
('550e8400-e29b-41d4-a716-446655440000', 'EVT-2025-002', 'Evento Corporativo CorpGlobal', 'Evento de fin de año corporativo', 2, 2, 4, '22222222-2222-2222-2222-222222222222', '2025-02-28', NULL, '19:00', '23:00', 'Hotel Presidente InterContinental', 150, 85000, 'facturado', 'pago_pendiente', 'media', 'en_proceso', '11111111-1111-1111-1111-111111111111'),
('550e8400-e29b-41d4-a716-446655440000', 'EVT-2025-003', 'Capacitación InnovaDigital', 'Taller de capacitación en transformación digital', 3, 5, 7, '33333333-3333-3333-3333-333333333333', '2025-01-20', '2025-01-21', '08:30', '17:30', 'Oficinas InnovaDigital', 50, 35000, 'facturado', 'pagado', 'baja', 'completado', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (clave_evento) DO NOTHING;

-- Insert demo income records
INSERT INTO evt_ingresos (evento_id, concepto, descripcion, cantidad, precio_unitario, fecha_ingreso, referencia, facturado, cobrado, metodo_cobro, created_by) VALUES
(1, 'Pago inicial Conferencia Tech', 'Anticipo 50% del evento', 1, 75000, '2025-01-10', 'FACT-2025-001', true, false, 'transferencia', '22222222-2222-2222-2222-222222222222'),
(1, 'Liquidación Conferencia Tech', 'Pago final del evento', 1, 75000, '2025-03-20', 'FACT-2025-002', false, false, 'transferencia', '22222222-2222-2222-2222-222222222222'),
(2, 'Evento Corporativo - Pago completo', 'Pago total del evento corporativo', 1, 85000, '2025-02-15', 'FACT-2025-003', true, false, 'cheque', '22222222-2222-2222-2222-222222222222'),
(3, 'Capacitación Digital - Pagado', 'Pago completo de capacitación', 1, 35000, '2025-01-15', 'FACT-2025-004', true, true, 'transferencia', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Insert demo expense records
INSERT INTO evt_gastos (evento_id, categoria_id, concepto, descripcion, cantidad, precio_unitario, proveedor, rfc_proveedor, fecha_gasto, forma_pago, status_aprobacion, created_by) VALUES
(1, 1, 'Consultoría especializada', 'Asesoría técnica para conferencia', 1, 25000, 'Consultores Tech SA', 'CTE123456789', '2025-01-15', 'transferencia', 'aprobado', '22222222-2222-2222-2222-222222222222'),
(1, 3, 'Equipo audiovisual', 'Renta de equipo para conferencia', 3, 8000, 'Audio Pro SA', 'APR987654321', '2025-02-01', 'transferencia', 'aprobado', '22222222-2222-2222-2222-222222222222'),
(1, 4, 'Catering premium', 'Servicio de alimentos para 300 personas', 300, 150, 'Catering Deluxe', 'CDL456789123', '2025-03-15', 'efectivo', 'pendiente', '22222222-2222-2222-2222-222222222222'),
(2, 2, 'Personal de apoyo', 'Staff para evento corporativo', 5, 2000, 'Servicios RH SA', 'SRH789123456', '2025-02-25', 'transferencia', 'aprobado', '22222222-2222-2222-2222-222222222222'),
(2, 3, 'Decoración navideña', 'Decoración temática de fin de año', 1, 15000, 'Decoraciones Elite', 'DEL321654987', '2025-02-20', 'cheque', 'aprobado', '22222222-2222-2222-2222-222222222222'),
(3, 1, 'Facilitador externo', 'Instructor especializado en transformación digital', 2, 8000, 'Capacitación Pro', 'CPR654321987', '2025-01-18', 'transferencia', 'aprobado', '33333333-3333-3333-3333-333333333333'),
(3, 3, 'Material didáctico', 'Manuales y material de apoyo', 50, 200, 'Materiales Educativos', 'MED987321654', '2025-01-19', 'efectivo', 'aprobado', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 11. FINAL VERIFICATION AND CLEANUP
-- =============================================================================

-- Update event financial totals (triggers will calculate automatically)
UPDATE evt_eventos SET updated_at = CURRENT_TIMESTAMP WHERE id IN (1, 2, 3);

-- Insert audit log entries for the demo data creation
INSERT INTO core_audit_log (company_id, user_id, action, module, entity_type, entity_id, new_value) VALUES
('550e8400-e29b-41d4-a716-446655440000', '11111111-1111-1111-1111-111111111111', 'database_reconstructed', 'system', 'database', 'complete_schema', '{"message": "Database reconstructed with demo data", "timestamp": "' || CURRENT_TIMESTAMP || '"}'::jsonb);

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '✅ MADE ERP v2.0 Database Reconstruction Complete!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Summary:';
    RAISE NOTICE '   - 1 Demo company created';
    RAISE NOTICE '   - 3 Demo users created (Admin, Ejecutivo, Visualizador)';
    RAISE NOTICE '   - 3 Demo roles assigned';
    RAISE NOTICE '   - 5 Event types created';
    RAISE NOTICE '   - 7 Event states created';
    RAISE NOTICE '   - 5 Expense categories created';
    RAISE NOTICE '   - 3 Demo clients created';
    RAISE NOTICE '   - 3 Demo events created';
    RAISE NOTICE '   - 4 Demo income records created';
    RAISE NOTICE '   - 7 Demo expense records created';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Security: RLS enabled with permissive policies for development';
    RAISE NOTICE '⚡ Triggers: Automatic financial calculations enabled';
    RAISE NOTICE '📈 Views: Dashboard and reporting views created';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your MADE ERP v2.0 system is ready to use!';
END $$;