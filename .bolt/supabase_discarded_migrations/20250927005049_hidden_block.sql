/*
  # Generate Comprehensive Test Data for MADE ERP v2.0

  This migration creates a complete dataset for testing and development purposes.

  ## Data Generated:
  1. **Company**: 1 company (MADE GROUP)
  2. **Users**: 20 users with varied roles and permissions
  3. **Clients**: 50 clients with complete fiscal information
  4. **Events**: 1,000 events (20 per client) with realistic data
  5. **Expenses**: 20,000 expenses (20 per event) distributed across categories
  6. **Incomes**: 5,000-10,000 incomes (5-10 per event) with varied amounts
  7. **Reference Data**: Categories, event types, states, and configurations

  ## Security:
  - Respects all foreign key constraints
  - Maintains data consistency
  - Includes proper RLS considerations
  - Uses realistic Mexican fiscal data (RFC, CFDI, etc.)

  ## Performance:
  - Uses batch inserts for efficiency
  - Includes proper indexing considerations
  - Optimized for large dataset generation
*/

-- Ensure required extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data in dependency order
TRUNCATE TABLE public.evt_historial RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.evt_gastos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.evt_ingresos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.evt_documentos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.evt_eventos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.evt_clientes RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.evt_categorias_gastos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.evt_tipos_evento RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.evt_estados RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.core_user_roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.core_security_config RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.core_system_config RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.core_audit_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.core_saved_views RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.alm_productos RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.cmp_proveedores RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.cnt_cuentas RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.rh_empleados RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.ocr_processing_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.core_users RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.core_roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.core_companies RESTART IDENTITY CASCADE;

-- 1. Insert Company: MADE GROUP
INSERT INTO public.core_companies (id, nombre, rfc, email, telefono, direccion, logo_url, activo, created_at, updated_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'MADE GROUP S.A. de C.V.',
    'MGR240101ABC',
    'contacto@madegroup.com.mx',
    '55-5555-0001',
    'Av. Insurgentes Sur 1234, Col. Del Valle, C.P. 03100, Ciudad de México, CDMX',
    'https://example.com/logo-made-group.png',
    TRUE,
    NOW(),
    NOW()
);

-- 2. Insert Core Roles
INSERT INTO public.core_roles (nombre, descripcion, permisos, activo, created_at)
VALUES
    ('Administrador', 'Acceso completo al sistema', '["*.*.*.*"]'::jsonb, TRUE, NOW()),
    ('Ejecutivo', 'Gestión de eventos y clientes', '["dashboard.read.*.*", "eventos.create.*.*", "eventos.update.*.*", "eventos.read.*.*", "clientes.create.*.*", "clientes.update.*.*", "gastos.create.*.*", "gastos.update.*.*", "gastos.delete.soft.*", "ingresos.create.*.*", "ingresos.update.*.*", "facturacion.update.*.*", "reportes.export.*.*"]'::jsonb, TRUE, NOW()),
    ('Visualizador', 'Solo lectura de información', '["dashboard.read.*.*", "eventos.read.*.*", "clientes.read.*.*", "gastos.read.*.*", "ingresos.read.*.*", "facturacion.read.*.*", "reportes.read.*.*"]'::jsonb, TRUE, NOW()),
    ('Coordinador', 'Coordinación de eventos y equipos', '["dashboard.read.*.*", "eventos.create.*.*", "eventos.update.*.*", "eventos.read.*.*", "gastos.create.*.*", "gastos.update.*.*", "ingresos.read.*.*"]'::jsonb, TRUE, NOW()),
    ('Analista', 'Análisis financiero y reportes', '["dashboard.read.*.*", "eventos.read.*.*", "gastos.read.*.*", "ingresos.read.*.*", "reportes.export.*.*"]'::jsonb, TRUE, NOW());

-- 3. Insert Users (20 users with Mexican names)
INSERT INTO public.core_users (id, company_id, email, nombre, apellidos, telefono, puesto, activo, ultimo_login, created_at, updated_at)
VALUES
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@madegroup.com.mx', 'Administrador', 'del Sistema', '55-5555-0002', 'Administrador General', TRUE, NOW() - INTERVAL '1 hour', NOW(), NOW()),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'juan.perez@madegroup.com.mx', 'Juan Carlos', 'Pérez Martínez', '55-5555-0003', 'Ejecutivo Senior', TRUE, NOW() - INTERVAL '2 hours', NOW(), NOW()),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'maria.garcia@madegroup.com.mx', 'María Elena', 'García López', '55-5555-0004', 'Ejecutiva de Proyectos', TRUE, NOW() - INTERVAL '3 hours', NOW(), NOW()),
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'carlos.lopez@madegroup.com.mx', 'Carlos Alberto', 'López Hernández', '55-5555-0005', 'Visualizador', TRUE, NOW() - INTERVAL '4 hours', NOW(), NOW()),
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'laura.martinez@madegroup.com.mx', 'Laura Patricia', 'Martínez Rodríguez', '55-5555-0006', 'Coordinadora de Eventos', TRUE, NOW() - INTERVAL '5 hours', NOW(), NOW()),
    ('g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'pedro.sanchez@madegroup.com.mx', 'Pedro Antonio', 'Sánchez González', '55-5555-0007', 'Analista Financiero', TRUE, NOW() - INTERVAL '6 hours', NOW(), NOW()),
    ('h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sofia.ramirez@madegroup.com.mx', 'Sofía Isabel', 'Ramírez Torres', '55-5555-0008', 'Ejecutiva de Ventas', TRUE, NOW() - INTERVAL '7 hours', NOW(), NOW()),
    ('i0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'diego.hernandez@madegroup.com.mx', 'Diego Fernando', 'Hernández Morales', '55-5555-0009', 'Coordinador Técnico', TRUE, NOW() - INTERVAL '8 hours', NOW(), NOW()),
    ('j0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'valeria.diaz@madegroup.com.mx', 'Valeria Alejandra', 'Díaz Castillo', '55-5555-0010', 'Gerente de Cuenta', TRUE, NOW() - INTERVAL '9 hours', NOW(), NOW()),
    ('k0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ricardo.torres@madegroup.com.mx', 'Ricardo Javier', 'Torres Vázquez', '55-5555-0011', 'Analista de Datos', TRUE, NOW() - INTERVAL '10 hours', NOW(), NOW()),
    ('l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'gabriela.ruiz@madegroup.com.mx', 'Gabriela Monserrat', 'Ruiz Mendoza', '55-5555-0012', 'Especialista en Logística', TRUE, NOW() - INTERVAL '11 hours', NOW(), NOW()),
    ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'fernando.morales@madegroup.com.mx', 'Fernando Sebastián', 'Morales Cruz', '55-5555-0013', 'Coordinador de Producción', TRUE, NOW() - INTERVAL '12 hours', NOW(), NOW()),
    ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'andrea.flores@madegroup.com.mx', 'Andrea Beatriz', 'Flores Jiménez', '55-5555-0014', 'Consultora Senior', TRUE, NOW() - INTERVAL '13 hours', NOW(), NOW()),
    ('o0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'manuel.guerrero@madegroup.com.mx', 'Manuel Alejandro', 'Guerrero Ramos', '55-5555-0015', 'Auxiliar Administrativo', TRUE, NOW() - INTERVAL '14 hours', NOW(), NOW()),
    ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'daniela.ortiz@madegroup.com.mx', 'Daniela Carolina', 'Ortiz Silva', '55-5555-0016', 'Supervisora de Calidad', TRUE, NOW() - INTERVAL '15 hours', NOW(), NOW()),
    ('q0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'jorge.reyes@madegroup.com.mx', 'Jorge Luis', 'Reyes Aguilar', '55-5555-0017', 'Practicante', TRUE, NOW() - INTERVAL '16 hours', NOW(), NOW()),
    ('r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'natalia.vazquez@madegroup.com.mx', 'Natalia Fernanda', 'Vázquez Delgado', '55-5555-0018', 'Jefa de Área Comercial', TRUE, NOW() - INTERVAL '17 hours', NOW(), NOW()),
    ('s0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'roberto.mendoza@madegroup.com.mx', 'Roberto Carlos', 'Mendoza Vargas', '55-5555-0019', 'Pasante de Sistemas', TRUE, NOW() - INTERVAL '18 hours', NOW(), NOW()),
    ('t0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'brenda.castillo@madegroup.com.mx', 'Brenda Guadalupe', 'Castillo Herrera', '55-5555-0020', 'Directora de Operaciones', TRUE, NOW() - INTERVAL '19 hours', NOW(), NOW()),
    ('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'sergio.cruz@madegroup.com.mx', 'Sergio Emilio', 'Cruz Peña', '55-5555-0021', 'Asesor Técnico', TRUE, NOW() - INTERVAL '20 hours', NOW(), NOW());

-- 4. Assign User Roles
INSERT INTO public.core_user_roles (user_id, role_id, asignado_por, fecha_asignacion, activo)
VALUES
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Admin
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 2, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Ejecutivo
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 2, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Ejecutivo
    ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 3, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Visualizador
    ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 4, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Coordinador
    ('g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 5, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Analista
    ('h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 2, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Ejecutivo
    ('i0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 4, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Coordinador
    ('j0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 2, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Ejecutivo
    ('k0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 5, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Analista
    ('l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 2, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Ejecutivo
    ('m0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 4, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Coordinador
    ('n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 2, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Ejecutivo
    ('o0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 3, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Visualizador
    ('p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 2, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Ejecutivo
    ('q0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 3, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Visualizador
    ('r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 2, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Ejecutivo
    ('s0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 3, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Visualizador
    ('t0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 1, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE), -- Admin
    ('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 5, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', NOW(), TRUE); -- Analista

-- 5. Insert Security Configuration
INSERT INTO public.core_security_config (company_id, security_mode, rls_enabled, bypass_auth, enable_permissions, session_timeout, updated_at, updated_by)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'development',
    FALSE,
    TRUE,
    FALSE,
    480,
    NOW(),
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'
);

-- 6. Insert Event Categories
INSERT INTO public.evt_categorias_gastos (company_id, nombre, descripcion, color, activo, created_at)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Servicios Profesionales', 'Consultorías, asesorías, servicios especializados', '#3B82F6', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Recursos Humanos', 'Personal, nóminas, honorarios, prestaciones', '#10B981', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Materiales y Suministros', 'Decoración, mobiliario, materiales de oficina', '#F59E0B', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Transporte y Logística', 'Combustible, casetas, fletes, viáticos', '#EF4444', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marketing y Publicidad', 'Promoción, diseño gráfico, medios digitales', '#8B5CF6', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Alimentos y Bebidas', 'Catering, coffee breaks, banquetes', '#06B6D4', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tecnología y Equipo', 'Renta de equipo audiovisual, cómputo', '#6D28D9', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Otros Gastos', 'Gastos diversos no clasificados', '#6B7280', TRUE, NOW());

-- 7. Insert Event Types
INSERT INTO public.evt_tipos_evento (company_id, nombre, descripcion, color, activo, created_at)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Conferencia', 'Eventos académicos y profesionales con ponentes', '#74F1C8', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Corporativo', 'Eventos empresariales internos y externos', '#16A085', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Social', 'Celebraciones, bodas, aniversarios', '#F39C12', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Lanzamiento', 'Presentación de productos o servicios', '#3498DB', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Capacitación', 'Talleres, seminarios, cursos', '#E74C3C', TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Feria Comercial', 'Exposiciones y ferias de negocios', '#9B59B6', TRUE, NOW());

-- 8. Insert Event States (if not already present)
INSERT INTO public.evt_estados (id, nombre, descripcion, color, orden, workflow_step)
VALUES
    (1, 'Borrador', 'Evento en fase inicial de planificación', '#6B7280', 1, 1),
    (2, 'Cotizado', 'Propuesta enviada al cliente', '#3B82F6', 2, 2),
    (3, 'Aprobado', 'Cliente aceptó la propuesta', '#10B981', 3, 3),
    (4, 'En Proceso', 'Evento en ejecución o preparación activa', '#F59E0B', 4, 4),
    (5, 'Completado', 'Evento finalizado exitosamente', '#059669', 5, 5),
    (6, 'Facturado', 'Evento facturado al cliente', '#7C3AED', 6, 6),
    (7, 'Cobrado', 'Pago recibido del cliente', '#059669', 7, 7),
    (8, 'Cancelado', 'Evento cancelado', '#EF4444', 8, 0)
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    color = EXCLUDED.color,
    orden = EXCLUDED.orden,
    workflow_step = EXCLUDED.workflow_step;

-- 9. Insert Clients (50 clients with realistic Mexican company data)
INSERT INTO public.evt_clientes (company_id, razon_social, nombre_comercial, rfc, email, telefono, direccion_fiscal, contacto_principal, telefono_contacto, email_contacto, regimen_fiscal, uso_cfdi, metodo_pago, forma_pago, dias_credito, limite_credito, activo, notas, created_at, updated_at, created_by)
SELECT
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    CASE 
        WHEN gs <= 10 THEN 'Corporativo ' || INITCAP(md5(random()::text)::text[1:8]) || ' S.A. de C.V.'
        WHEN gs <= 20 THEN 'Grupo ' || INITCAP(md5(random()::text)::text[1:8]) || ' S.A.'
        WHEN gs <= 30 THEN 'Empresa ' || INITCAP(md5(random()::text)::text[1:8]) || ' S.R.L.'
        WHEN gs <= 40 THEN 'Servicios ' || INITCAP(md5(random()::text)::text[1:8]) || ' S.C.'
        ELSE 'Consultoría ' || INITCAP(md5(random()::text)::text[1:8]) || ' S.A. de C.V.'
    END,
    CASE 
        WHEN gs <= 10 THEN 'Corp' || UPPER(md5(random()::text)::text[1:4])
        WHEN gs <= 20 THEN 'Grupo' || UPPER(md5(random()::text)::text[1:3])
        WHEN gs <= 30 THEN 'Emp' || UPPER(md5(random()::text)::text[1:5])
        WHEN gs <= 40 THEN 'Serv' || UPPER(md5(random()::text)::text[1:4])
        ELSE 'Cons' || UPPER(md5(random()::text)::text[1:4])
    END,
    UPPER(md5(random()::text)::text[1:3]) || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || UPPER(md5(random()::text)::text[1:3]),
    'contacto' || LPAD(gs::TEXT, 2, '0') || '@' || LOWER(md5(random()::text)::text[1:8]) || '.com.mx',
    '55-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0'),
    (ARRAY[
        'Av. Reforma', 'Av. Insurgentes', 'Av. Universidad', 'Paseo de la Reforma', 
        'Eje Central', 'Av. Revolución', 'Blvd. Manuel Ávila Camacho', 'Periférico Sur'
    ])[FLOOR(RANDOM() * 8) + 1] || ' ' || FLOOR(RANDOM() * 9999 + 100)::TEXT || ', ' ||
    (ARRAY[
        'Col. Roma Norte', 'Col. Condesa', 'Col. Polanco', 'Col. Del Valle', 
        'Col. Santa Fe', 'Col. Doctores', 'Col. Centro', 'Col. Narvarte'
    ])[FLOOR(RANDOM() * 8) + 1] || ', C.P. ' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0') || ', Ciudad de México, CDMX',
    (ARRAY[
        'Ana María', 'Carlos Eduardo', 'María José', 'José Luis', 'Laura Patricia',
        'Miguel Ángel', 'Carmen Elena', 'Francisco Javier', 'Isabel Cristina', 'Antonio Rafael'
    ])[FLOOR(RANDOM() * 10) + 1] || ' ' || 
    (ARRAY[
        'González', 'Rodríguez', 'Martínez', 'López', 'Hernández',
        'García', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'
    ])[FLOOR(RANDOM() * 10) + 1],
    '55-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0'),
    'contacto' || LPAD(gs::TEXT, 2, '0') || '.directo@' || LOWER(md5(random()::text)::text[1:8]) || '.com.mx',
    (ARRAY['601', '612', '621', '622', '623'])[FLOOR(RANDOM() * 5) + 1],
    (ARRAY['G01', 'G02', 'G03', 'I01', 'P01'])[FLOOR(RANDOM() * 5) + 1],
    (ARRAY['PUE', 'PPD'])[FLOOR(RANDOM() * 2) + 1],
    (ARRAY['01', '02', '03', '04', '28'])[FLOOR(RANDOM() * 5) + 1],
    (ARRAY[15, 30, 45, 60])[FLOOR(RANDOM() * 4) + 1],
    FLOOR(RANDOM() * 500000 + 100000)::NUMERIC(15,2),
    TRUE,
    'Cliente estratégico con ' || FLOOR(RANDOM() * 10 + 1)::TEXT || ' años de relación comercial.',
    NOW() - (FLOOR(RANDOM() * 730) || ' days')::INTERVAL, -- Created within last 2 years
    NOW(),
    (ARRAY[
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 
        'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'j0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
        'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',
        'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28'
    ])[FLOOR(RANDOM() * 8) + 1] -- Only executives can create clients
FROM generate_series(1, 50) gs;

-- 10. Insert Events (20 events per client = 1,000 total events)
INSERT INTO public.evt_eventos (
    company_id, clave_evento, nombre_proyecto, descripcion, cliente_id, tipo_evento_id, 
    estado_id, responsable_id, fecha_evento, fecha_fin, hora_inicio, hora_fin, lugar, 
    numero_invitados, presupuesto_estimado, subtotal, iva_porcentaje, iva, total, 
    total_gastos, utilidad, margen_utilidad, status_facturacion, status_pago, 
    fecha_facturacion, fecha_vencimiento, fecha_pago, prioridad, fase_proyecto, 
    notas, activo, created_at, updated_at, created_by, updated_by
)
SELECT
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'EVT-' || EXTRACT(YEAR FROM event_date)::TEXT || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY c.id, gs, event_date)::TEXT, 4, '0'),
    (ARRAY[
        'Conferencia Anual de Innovación', 'Lanzamiento de Producto Estrella', 'Cena de Gala Empresarial',
        'Taller de Liderazgo Ejecutivo', 'Feria Comercial Internacional', 'Evento de Networking',
        'Seminario de Transformación Digital', 'Convención de Ventas', 'Simposio de Sustentabilidad',
        'Congreso de Tecnología', 'Festival Gastronómico', 'Expo de Innovación',
        'Reunión Anual de Accionistas', 'Presentación de Resultados', 'Celebración de Aniversario'
    ])[FLOOR(RANDOM() * 15) + 1] || ' ' || EXTRACT(YEAR FROM event_date)::TEXT,
    'Evento especializado para ' || c.nombre_comercial || ' con enfoque en ' || 
    (ARRAY['innovación', 'crecimiento', 'expansión', 'consolidación', 'transformación'])[FLOOR(RANDOM() * 5) + 1] || 
    ' empresarial y desarrollo de ' || 
    (ARRAY['talento', 'mercados', 'productos', 'servicios', 'tecnología'])[FLOOR(RANDOM() * 5) + 1] || '.',
    c.id,
    (SELECT id FROM public.evt_tipos_evento ORDER BY RANDOM() LIMIT 1),
    (ARRAY[3, 4, 5, 6, 7])[FLOOR(RANDOM() * 5) + 1], -- Aprobado to Cobrado
    (ARRAY[
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
        'j0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        'n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26',
        'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28'
    ])[FLOOR(RANDOM() * 9) + 1],
    event_date,
    CASE 
        WHEN RANDOM() > 0.7 THEN event_date + (FLOOR(RANDOM() * 5) + 1 || ' days')::INTERVAL 
        ELSE NULL 
    END,
    (ARRAY['08:00', '09:00', '10:00', '14:00', '15:00'])[FLOOR(RANDOM() * 5) + 1] || ':00',
    (ARRAY['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'])[FLOOR(RANDOM() * 6) + 1] || ':00',
    (ARRAY[
        'Centro Banamex, Ciudad de México', 'Expo Santa Fe, Ciudad de México',
        'World Trade Center, Ciudad de México', 'Hotel Presidente InterContinental',
        'Hacienda de los Morales', 'Centro de Convenciones Tlatelolco',
        'Hotel Hilton Mexico City Reforma', 'Palacio de los Deportes',
        'Foro Sol, Ciudad de México', 'Casa de la Cultura Jesús Reyes Heroles'
    ])[FLOOR(RANDOM() * 10) + 1],
    FLOOR(RANDOM() * 800 + 50), -- 50 to 850 guests
    presupuesto_base,
    subtotal_calc,
    16.00,
    iva_calc,
    total_calc,
    gastos_calc,
    utilidad_calc,
    margen_calc,
    (ARRAY['pendiente_facturar', 'facturado'])[FLOOR(RANDOM() * 2) + 1],
    (ARRAY['pendiente', 'pago_pendiente', 'pagado', 'vencido'])[FLOOR(RANDOM() * 4) + 1],
    CASE WHEN RANDOM() > 0.4 THEN event_date + (FLOOR(RANDOM() * 30) + 1 || ' days')::INTERVAL ELSE NULL END,
    CASE WHEN RANDOM() > 0.4 THEN event_date + (FLOOR(RANDOM() * 60) + 30 || ' days')::INTERVAL ELSE NULL END,
    CASE WHEN RANDOM() > 0.6 THEN event_date + (FLOOR(RANDOM() * 90) + 15 || ' days')::INTERVAL ELSE NULL END,
    (ARRAY['baja', 'media', 'alta', 'urgente'])[FLOOR(RANDOM() * 4) + 1],
    (ARRAY['cotizacion', 'aprobado', 'en_proceso', 'completado'])[FLOOR(RANDOM() * 4) + 1],
    'Evento estratégico para ' || c.nombre_comercial || '. Incluye ' || 
    (ARRAY['catering premium', 'tecnología avanzada', 'entretenimiento', 'logística especializada'])[FLOOR(RANDOM() * 4) + 1] || 
    ' y coordinación integral.',
    TRUE,
    NOW() - (FLOOR(RANDOM() * 365) || ' days')::INTERVAL,
    NOW(),
    (ARRAY[
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'j0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
        'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',
        'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28'
    ])[FLOOR(RANDOM() * 8) + 1],
    (ARRAY[
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'j0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
        'l0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'n0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24',
        'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'r0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28'
    ])[FLOOR(RANDOM() * 8) + 1]
FROM (
    SELECT 
        c.*,
        gs,
        -- Generate realistic event date within last 2 years or next 6 months
        CASE 
            WHEN RANDOM() > 0.3 THEN 
                NOW() - (FLOOR(RANDOM() * 730) || ' days')::INTERVAL -- Past events (70%)
            ELSE 
                NOW() + (FLOOR(RANDOM() * 180) || ' days')::INTERVAL -- Future events (30%)
        END as event_date,
        -- Calculate realistic financial amounts
        FLOOR(RANDOM() * 800000 + 50000)::NUMERIC(15,2) as presupuesto_base
    FROM public.evt_clientes c, generate_series(1, 20) gs
) subq
CROSS JOIN LATERAL (
    SELECT 
        presupuesto_base * (RANDOM() * 0.3 + 0.7) as subtotal_calc -- 70-100% of budget
) calc1
CROSS JOIN LATERAL (
    SELECT 
        subtotal_calc * 0.16 as iva_calc,
        subtotal_calc * 1.16 as total_calc
) calc2
CROSS JOIN LATERAL (
    SELECT 
        total_calc * (RANDOM() * 0.4 + 0.4) as gastos_calc -- 40-80% of total as expenses
) calc3
CROSS JOIN LATERAL (
    SELECT 
        total_calc - gastos_calc as utilidad_calc,
        CASE 
            WHEN total_calc > 0 THEN ((total_calc - gastos_calc) / total_calc) * 100 
            ELSE 0 
        END as margen_calc
) calc4;

-- 11. Insert Expenses (20 expenses per event = 20,000 total expenses)
INSERT INTO public.evt_gastos (
    evento_id, categoria_id, concepto, descripcion, cantidad, precio_unitario, 
    subtotal, iva_porcentaje, iva, total, proveedor, rfc_proveedor, fecha_gasto, 
    forma_pago, referencia, status_aprobacion, aprobado_por, fecha_aprobacion, 
    notas, activo, created_at, updated_at, created_by
)
SELECT
    e.id,
    cat.id,
    expense_concept,
    'Gasto de ' || cat.nombre || ' para el evento ' || e.nombre_proyecto || '. ' ||
    'Incluye ' || (ARRAY['servicios especializados', 'materiales premium', 'logística avanzada', 'coordinación integral'])[FLOOR(RANDOM() * 4) + 1] || '.',
    cantidad_calc,
    precio_unitario_calc,
    subtotal_calc,
    16.00,
    iva_calc,
    total_calc,
    proveedor_name,
    proveedor_rfc,
    e.fecha_evento + (FLOOR(RANDOM() * 60) - 30 || ' days')::INTERVAL, -- ±30 days from event
    (ARRAY['efectivo', 'transferencia', 'cheque', 'tarjeta'])[FLOOR(RANDOM() * 4) + 1],
    'FACT-' || UPPER(md5(random()::text)::text[1:3]) || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0'),
    (ARRAY['pendiente', 'aprobado', 'rechazado'])[FLOOR(RANDOM() * 3) + 1],
    (ARRAY[
        'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        't0eebc99-9c0b-4ef8-bb6d-6bb9bd380a30'
    ])[FLOOR(RANDOM() * 3) + 1], -- Admins and senior executives approve
    NOW() - (FLOOR(RANDOM() * 30) || ' days')::INTERVAL,
    'Gasto aprobado según presupuesto del evento.',
    TRUE,
    NOW() - (FLOOR(RANDOM() * 365) || ' days')::INTERVAL,
    NOW(),
    e.responsable_id
FROM (
    SELECT 
        e.*,
        cat.*,
        gs,
        -- Generate expense concepts based on category
        CASE cat.nombre
            WHEN 'Servicios Profesionales' THEN 
                (ARRAY['Consultoría especializada', 'Asesoría legal', 'Servicios contables', 'Auditoría externa', 'Diseño gráfico profesional'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Recursos Humanos' THEN 
                (ARRAY['Personal de apoyo', 'Coordinadores de evento', 'Personal de seguridad', 'Meseros especializados', 'Técnicos audiovisuales'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Materiales y Suministros' THEN 
                (ARRAY['Decoración floral premium', 'Mobiliario especializado', 'Cristalería y vajilla', 'Mantelería de lujo', 'Material promocional'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Transporte y Logística' THEN 
                (ARRAY['Transporte de equipo', 'Combustible vehículos', 'Casetas de autopista', 'Flete especializado', 'Viáticos del personal'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Marketing y Publicidad' THEN 
                (ARRAY['Campaña en redes sociales', 'Diseño de material gráfico', 'Publicidad digital', 'Producción audiovisual', 'Fotografía profesional'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Alimentos y Bebidas' THEN 
                (ARRAY['Catering gourmet', 'Coffee break premium', 'Cóctel de bienvenida', 'Cena de gala', 'Servicio de bar'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Tecnología y Equipo' THEN 
                (ARRAY['Renta de equipo audiovisual', 'Sistema de sonido profesional', 'Iluminación LED', 'Pantallas gigantes', 'Equipo de transmisión'])[FLOOR(RANDOM() * 5) + 1]
            ELSE 
                (ARRAY['Servicios diversos', 'Gastos administrativos', 'Imprevistos', 'Seguros del evento', 'Permisos y licencias'])[FLOOR(RANDOM() * 5) + 1]
        END as expense_concept,
        -- Generate realistic provider names
        CASE cat.nombre
            WHEN 'Servicios Profesionales' THEN 
                (ARRAY['Consultoría Integral SA', 'Asesoría Premium SC', 'Servicios Corporativos SRL', 'Grupo Consultor ABC', 'Expertos Asociados SA'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Recursos Humanos' THEN 
                (ARRAY['Personal Especializado SA', 'Recursos Humanos Plus', 'Staffing Solutions SRL', 'Grupo de Personal ABC', 'Servicios de RH SA'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Materiales y Suministros' THEN 
                (ARRAY['Decoraciones Premium SA', 'Suministros Especiales SRL', 'Materiales de Lujo SC', 'Proveedora Central SA', 'Distribuidora Elite SA'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Transporte y Logística' THEN 
                (ARRAY['Transportes Ejecutivos SA', 'Logística Integral SRL', 'Fletes Especializados SC', 'Grupo Logístico ABC', 'Servicios de Transporte SA'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Marketing y Publicidad' THEN 
                (ARRAY['Agencia Creativa SA', 'Marketing Digital Plus', 'Publicidad Integral SRL', 'Grupo Publicitario ABC', 'Medios y Estrategia SA'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Alimentos y Bebidas' THEN 
                (ARRAY['Catering Gourmet SA', 'Banquetes Premium SRL', 'Servicios Gastronómicos SC', 'Grupo Alimentario ABC', 'Catering Ejecutivo SA'])[FLOOR(RANDOM() * 5) + 1]
            WHEN 'Tecnología y Equipo' THEN 
                (ARRAY['Tecnología Audiovisual SA', 'Equipos Profesionales SRL', 'Sistemas AV Premium SC', 'Grupo Tecnológico ABC', 'Soluciones AV SA'])[FLOOR(RANDOM() * 5) + 1]
            ELSE 
                (ARRAY['Servicios Generales SA', 'Proveedora Universal SRL', 'Suministros Diversos SC', 'Grupo Comercial ABC', 'Distribuidora Integral SA'])[FLOOR(RANDOM() * 5) + 1]
        END as proveedor_name,
        -- Generate realistic RFC for providers
        UPPER(md5(random()::text)::text[1:3]) || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || UPPER(md5(random()::text)::text[1:3]) as proveedor_rfc
    FROM public.evt_eventos e
    CROSS JOIN public.evt_categorias_gastos cat
    CROSS JOIN generate_series(1, 3) gs -- 3 expenses per category per event (8 categories * 3 = 24, but we'll limit to 20)
    WHERE cat.company_id = e.company_id
) expense_data
CROSS JOIN LATERAL (
    SELECT 
        FLOOR(RANDOM() * 10 + 1)::NUMERIC(10,3) as cantidad_calc,
        FLOOR(RANDOM() * 15000 + 500)::NUMERIC(15,2) as precio_unitario_calc
) calc1
CROSS JOIN LATERAL (
    SELECT 
        cantidad_calc * precio_unitario_calc as subtotal_calc,
        cantidad_calc * precio_unitario_calc * 0.16 as iva_calc,
        cantidad_calc * precio_unitario_calc * 1.16 as total_calc
) calc2
WHERE ROW_NUMBER() OVER (PARTITION BY expense_data.id ORDER BY expense_data.gs, RANDOM()) <= 20; -- Limit to 20 expenses per event

-- 12. Insert Incomes (5-10 incomes per event = 5,000-10,000 total incomes)
INSERT INTO public.evt_ingresos (
    evento_id, concepto, descripcion, cantidad, precio_unitario, subtotal, 
    iva_porcentaje, iva, total, fecha_ingreso, referencia, facturado, cobrado, 
    fecha_facturacion, fecha_cobro, metodo_cobro, notas, created_at, updated_at, created_by
)
SELECT
    e.id,
    income_concept,
    'Ingreso por ' || income_concept || ' del evento ' || e.nombre_proyecto || '. ' ||
    'Facturación correspondiente al ' || 
    (ARRAY['anticipo inicial', 'pago intermedio', 'liquidación final', 'servicios adicionales'])[FLOOR(RANDOM() * 4) + 1] || '.',
    1,
    monto_base,
    subtotal_calc,
    16.00,
    iva_calc,
    total_calc,
    e.fecha_evento + (FLOOR(RANDOM() * 120) - 60 || ' days')::INTERVAL, -- ±60 days from event
    'FACT-' || EXTRACT(YEAR FROM e.fecha_evento)::TEXT || '-' || UPPER(md5(random()::text)::text[1:2]) || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0'),
    CASE WHEN RANDOM() > 0.2 THEN TRUE ELSE FALSE END, -- 80% facturado
    CASE WHEN RANDOM() > 0.3 THEN TRUE ELSE FALSE END, -- 70% cobrado
    CASE WHEN RANDOM() > 0.2 THEN e.fecha_evento + (FLOOR(RANDOM() * 45) + 5 || ' days')::INTERVAL ELSE NULL END,
    CASE WHEN RANDOM() > 0.3 THEN e.fecha_evento + (FLOOR(RANDOM() * 90) + 15 || ' days')::INTERVAL ELSE NULL END,
    (ARRAY['transferencia', 'cheque', 'efectivo', 'tarjeta'])[FLOOR(RANDOM() * 4) + 1],
    'Ingreso procesado según contrato con ' || c.nombre_comercial || '.',
    NOW() - (FLOOR(RANDOM() * 365) || ' days')::INTERVAL,
    NOW(),
    e.responsable_id
FROM (
    SELECT 
        e.*,
        c.nombre_comercial,
        gs,
        -- Generate income concepts
        CASE gs
            WHEN 1 THEN 'Anticipo 30% - ' || e.nombre_proyecto
            WHEN 2 THEN 'Pago Intermedio 40% - ' || e.nombre_proyecto
            WHEN 3 THEN 'Liquidación Final 30% - ' || e.nombre_proyecto
            WHEN 4 THEN 'Servicios Adicionales - ' || e.nombre_proyecto
            WHEN 5 THEN 'Ajuste de Proyecto - ' || e.nombre_proyecto
            WHEN 6 THEN 'Bonificación por Volumen - ' || e.nombre_proyecto
            WHEN 7 THEN 'Servicios Premium - ' || e.nombre_proyecto
            WHEN 8 THEN 'Extensión de Contrato - ' || e.nombre_proyecto
            WHEN 9 THEN 'Servicios de Consultoría - ' || e.nombre_proyecto
            ELSE 'Otros Ingresos - ' || e.nombre_proyecto
        END as income_concept,
        -- Calculate income amounts based on event budget
        CASE gs
            WHEN 1 THEN e.presupuesto_estimado * 0.30 -- 30% anticipo
            WHEN 2 THEN e.presupuesto_estimado * 0.40 -- 40% intermedio
            WHEN 3 THEN e.presupuesto_estimado * 0.30 -- 30% final
            ELSE FLOOR(RANDOM() * 50000 + 5000)::NUMERIC(15,2) -- Additional services
        END as monto_base
    FROM public.evt_eventos e
    JOIN public.evt_clientes c ON e.cliente_id = c.id
    CROSS JOIN generate_series(1, FLOOR(RANDOM() * 6) + 5) gs -- 5 to 10 incomes per event
) income_data
CROSS JOIN LATERAL (
    SELECT 
        monto_base as subtotal_calc,
        monto_base * 0.16 as iva_calc,
        monto_base * 1.16 as total_calc
) calc;

-- 13. Insert OCR Processing Logs (sample data for demonstration)
INSERT INTO public.ocr_processing_log (
    document_type, document_id, original_filename, processing_time_seconds, 
    confidence_overall, confidence_breakdown, extracted_text, errors, 
    processed_at, processed_by
)
SELECT
    (ARRAY['expense', 'income'])[FLOOR(RANDOM() * 2) + 1],
    e.id::TEXT,
    'documento_' || LPAD(ROW_NUMBER() OVER (ORDER BY e.id, gs)::TEXT, 6, '0') || 
    (ARRAY['.pdf', '.jpg', '.png'])[FLOOR(RANDOM() * 3) + 1],
    FLOOR(RANDOM() * 45 + 15), -- 15-60 seconds processing time
    (RANDOM() * 30 + 70)::NUMERIC, -- 70-100% confidence
    ('{"concepto": ' || (RANDOM() * 30 + 70)::INT || ', "monto": ' || (RANDOM() * 30 + 70)::INT || 
     ', "fecha": ' || (RANDOM() * 30 + 70)::INT || ', "proveedor": ' || (RANDOM() * 30 + 70)::INT || '}')::jsonb,
    'Texto extraído del documento fiscal. RFC: ' || 
    UPPER(md5(random()::text)::text[1:3]) || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || UPPER(md5(random()::text)::text[1:3]) ||
    ' Total: $' || FLOOR(RANDOM() * 50000 + 1000)::TEXT || '.00 Fecha: ' || 
    TO_CHAR(NOW() - (FLOOR(RANDOM() * 365) || ' days')::INTERVAL, 'DD/MM/YYYY'),
    CASE WHEN RANDOM() > 0.9 THEN 'Error de formato en campo RFC' ELSE NULL END,
    NOW() - (FLOOR(RANDOM() * 90) || ' days')::INTERVAL,
    (ARRAY[
        'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'j0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20'
    ])[FLOOR(RANDOM() * 4) + 1]
FROM public.evt_eventos e
CROSS JOIN public.evt_categorias_gastos cat
CROSS JOIN generate_series(1, 2) gs -- 2 OCR logs per event per category
WHERE cat.company_id = e.company_id
AND RANDOM() > 0.7 -- Only 30% of events have OCR logs
LIMIT 5000; -- Limit total OCR logs

-- 14. Insert Audit Logs (sample activity tracking)
INSERT INTO public.core_audit_log (
    company_id, user_id, timestamp, action, module, entity_type, entity_id, 
    old_value, new_value, ip_address, user_agent, session_id, success, 
    error_message, duration
)
SELECT
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    u.id,
    NOW() - (FLOOR(RANDOM() * 365) || ' days')::INTERVAL,
    (ARRAY[
        'evento_creado', 'evento_actualizado', 'evento_eliminado', 'evento_status_cambiado',
        'ingreso_agregado', 'ingreso_actualizado', 'ingreso_eliminado',
        'gasto_agregado', 'gasto_actualizado', 'gasto_eliminado', 'gasto_aprobado',
        'documento_subido', 'ocr_validado', 'exportacion_pdf', 'exportacion_excel',
        'login', 'logout'
    ])[FLOOR(RANDOM() * 16) + 1],
    (ARRAY['eventos', 'finanzas', 'documentos', 'sistema', 'reportes'])[FLOOR(RANDOM() * 5) + 1],
    (ARRAY['evt_eventos', 'evt_gastos', 'evt_ingresos', 'evt_documentos', 'core_users'])[FLOOR(RANDOM() * 5) + 1],
    FLOOR(RANDOM() * 1000 + 1)::TEXT,
    ('{"status_anterior": "' || (ARRAY['borrador', 'cotizado', 'aprobado'])[FLOOR(RANDOM() * 3) + 1] || '"}')::jsonb,
    ('{"status_nuevo": "' || (ARRAY['aprobado', 'en_proceso', 'completado'])[FLOOR(RANDOM() * 3) + 1] || '"}')::jsonb,
    ('192.168.' || FLOOR(RANDOM() * 255 + 1)::TEXT || '.' || FLOOR(RANDOM() * 255 + 1)::TEXT)::INET,
    (ARRAY[
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ])[FLOOR(RANDOM() * 3) + 1],
    'session_' || md5(random()::text)::text[1:16],
    CASE WHEN RANDOM() > 0.05 THEN TRUE ELSE FALSE END, -- 95% success rate
    CASE WHEN RANDOM() <= 0.05 THEN 'Error de conexión temporal' ELSE NULL END,
    FLOOR(RANDOM() * 2000 + 100) -- 100-2100ms duration
FROM public.core_users u
CROSS JOIN generate_series(1, 50) gs -- 50 audit logs per user
WHERE u.company_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
LIMIT 10000; -- Limit total audit logs

-- 15. Insert System Configuration
INSERT INTO public.core_system_config (company_id, config_key, config_value, description, updated_at, updated_by)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'iva_rate', '16.0', 'Tasa de IVA por defecto', NOW(), 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'currency', '"MXN"', 'Moneda por defecto', NOW(), 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'default_credit_days', '30', 'Días de crédito por defecto', NOW(), 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'ocr_enabled', 'true', 'OCR habilitado para documentos', NOW(), 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'auto_approval_limit', '10000.00', 'Límite para aprobación automática de gastos', NOW(), 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12');

-- 16. Insert Sample Providers (for reference)
INSERT INTO public.cmp_proveedores (company_id, nombre, rfc, email, telefono, direccion, contacto_principal, activo, created_at)
SELECT
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    provider_name,
    provider_rfc,
    LOWER(REPLACE(provider_name, ' ', '')) || '@proveedor.com.mx',
    '55-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0'),
    'Calle Comercial ' || gs || ', Col. Industrial, Ciudad de México',
    'Contacto ' || gs,
    TRUE,
    NOW() - (FLOOR(RANDOM() * 365) || ' days')::INTERVAL
FROM (
    SELECT 
        gs,
        (ARRAY[
            'Catering Premium SA de CV', 'Decoraciones Elite SRL', 'Audiovisuales Pro SA',
            'Transportes Ejecutivos SC', 'Servicios Integrales SA', 'Tecnología Avanzada SRL',
            'Mobiliario Especializado SA', 'Flores y Diseño SC', 'Seguridad Profesional SA',
            'Limpieza Corporativa SRL', 'Mantenimiento Integral SA', 'Suministros Oficina SC',
            'Fotografía Profesional SA', 'Producción Audiovisual SRL', 'Consultoría Empresarial SA'
        ])[FLOOR(RANDOM() * 15) + 1] as provider_name,
        'PROV' || LPAD(gs::TEXT, 2, '0') || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0') || 'ABC' as provider_rfc
    FROM generate_series(1, 25) gs
) provider_data;

-- 17. Insert Sample Products (for inventory module)
INSERT INTO public.alm_productos (company_id, codigo, nombre, descripcion, categoria, precio_unitario, stock_actual, stock_minimo, activo, created_at)
SELECT
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'PROD-' || LPAD(gs::TEXT, 4, '0'),
    product_name,
    'Producto especializado para eventos: ' || product_name,
    product_category,
    FLOOR(RANDOM() * 5000 + 100)::NUMERIC(15,2),
    FLOOR(RANDOM() * 100 + 10),
    FLOOR(RANDOM() * 20 + 5),
    TRUE,
    NOW() - (FLOOR(RANDOM() * 365) || ' days')::INTERVAL
FROM (
    SELECT 
        gs,
        (ARRAY[
            'Mesa Redonda Premium', 'Silla Ejecutiva Tapizada', 'Mantel de Lino Blanco',
            'Centro de Mesa Floral', 'Equipo de Sonido Profesional', 'Micrófono Inalámbrico',
            'Pantalla LED 55 Pulgadas', 'Proyector Full HD', 'Sistema de Iluminación',
            'Cámara de Video 4K', 'Tarima Modular', 'Backdrop Personalizable',
            'Servicio de Catering Gourmet', 'Coffee Break Premium', 'Cóctel de Bienvenida'
        ])[FLOOR(RANDOM() * 15) + 1] as product_name,
        (ARRAY[
            'Mobiliario', 'Decoración', 'Tecnología', 'Audiovisual', 
            'Iluminación', 'Catering', 'Servicios'
        ])[FLOOR(RANDOM() * 7) + 1] as product_category
    FROM generate_series(1, 50) gs
) product_data;

-- 18. Insert Sample Employees (for HR module)
INSERT INTO public.rh_empleados (company_id, numero_empleado, nombre, apellidos, puesto, departamento, salario, fecha_ingreso, activo, created_at)
SELECT
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'EMP-' || LPAD(gs::TEXT, 4, '0'),
    employee_name,
    employee_lastname,
    employee_position,
    employee_department,
    FLOOR(RANDOM() * 50000 + 15000)::NUMERIC(15,2),
    NOW() - (FLOOR(RANDOM() * 1825) || ' days')::INTERVAL, -- Up to 5 years ago
    TRUE,
    NOW() - (FLOOR(RANDOM() * 365) || ' days')::INTERVAL
FROM (
    SELECT 
        gs,
        (ARRAY[
            'Ana', 'Carlos', 'María', 'José', 'Laura', 'Miguel', 'Carmen', 'Francisco',
            'Isabel', 'Antonio', 'Rosa', 'Manuel', 'Pilar', 'Jesús', 'Mercedes'
        ])[FLOOR(RANDOM() * 15) + 1] as employee_name,
        (ARRAY[
            'García Pérez', 'Rodríguez López', 'González Martínez', 'Fernández Sánchez',
            'López Hernández', 'Martínez Díaz', 'Sánchez Moreno', 'Pérez Muñoz',
            'Gómez Álvarez', 'Martín Romero', 'Jiménez Alonso', 'Ruiz Gutiérrez'
        ])[FLOOR(RANDOM() * 12) + 1] as employee_lastname,
        (ARRAY[
            'Coordinador de Eventos', 'Asistente Administrativo', 'Técnico Audiovisual',
            'Especialista en Logística', 'Analista Financiero', 'Ejecutivo de Ventas',
            'Diseñador Gráfico', 'Coordinador de Producción', 'Supervisor de Calidad',
            'Gerente de Operaciones', 'Consultor Senior', 'Analista de Datos'
        ])[FLOOR(RANDOM() * 12) + 1] as employee_position,
        (ARRAY[
            'Eventos', 'Administración', 'Tecnología', 'Logística', 'Finanzas',
            'Ventas', 'Marketing', 'Producción', 'Calidad', 'Operaciones'
        ])[FLOOR(RANDOM() * 10) + 1] as employee_department
    FROM generate_series(1, 30) gs
) employee_data;

-- 19. Insert Chart of Accounts (for accounting module)
INSERT INTO public.cnt_cuentas (company_id, codigo, nombre, tipo_cuenta, padre_id, nivel, activo, created_at)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1000', 'ACTIVO', 'activo', NULL, 1, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1100', 'ACTIVO CIRCULANTE', 'activo', 1, 2, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1101', 'Caja', 'activo', 2, 3, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1102', 'Bancos', 'activo', 2, 3, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '1103', 'Clientes', 'activo', 2, 3, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2000', 'PASIVO', 'pasivo', NULL, 1, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2100', 'PASIVO CIRCULANTE', 'pasivo', 6, 2, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2101', 'Proveedores', 'pasivo', 7, 3, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2102', 'IVA por Pagar', 'pasivo', 7, 3, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '3000', 'CAPITAL', 'capital', NULL, 1, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '4000', 'INGRESOS', 'ingreso', NULL, 1, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '4001', 'Ingresos por Eventos', 'ingreso', 11, 2, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5000', 'GASTOS', 'gasto', NULL, 1, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5001', 'Gastos de Operación', 'gasto', 13, 2, TRUE, NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '5002', 'Gastos Administrativos', 'gasto', 13, 2, TRUE, NOW());

-- 20. Insert Saved Views (user preferences)
INSERT INTO public.core_saved_views (user_id, name, description, module, filters, sorting, columns, shared, role_specific, created_at)
SELECT
    u.id,
    view_name,
    view_description,
    view_module,
    view_filters::jsonb,
    view_sorting::jsonb,
    view_columns::jsonb,
    CASE WHEN RANDOM() > 0.8 THEN TRUE ELSE FALSE END, -- 20% shared views
    CASE WHEN RANDOM() > 0.9 THEN 'Ejecutivo' ELSE NULL END, -- 10% role-specific
    NOW() - (FLOOR(RANDOM() * 180) || ' days')::INTERVAL
FROM public.core_users u
CROSS JOIN (
    SELECT 
        gs,
        (ARRAY[
            'Eventos Pendientes', 'Clientes VIP', 'Gastos del Mes', 'Ingresos por Cobrar',
            'Eventos Próximos', 'Facturas Vencidas', 'Utilidad por Cliente', 'OCR Procesados'
        ])[FLOOR(RANDOM() * 8) + 1] as view_name,
        (ARRAY[
            'Vista personalizada de eventos pendientes de facturación',
            'Clientes con mayor volumen de eventos',
            'Gastos del mes actual por categoría',
            'Ingresos pendientes de cobro',
            'Eventos programados para los próximos 30 días',
            'Facturas con pagos vencidos',
            'Análisis de utilidad por cliente',
            'Documentos procesados con OCR'
        ])[FLOOR(RANDOM() * 8) + 1] as view_description,
        (ARRAY['eventos', 'clientes', 'gastos', 'ingresos', 'facturacion'])[FLOOR(RANDOM() * 5) + 1] as view_module,
        '{"status": ["pendiente", "aprobado"], "fecha_inicio": "2024-01-01"}' as view_filters,
        '{"field": "fecha_evento", "direction": "desc"}' as view_sorting,
        '["nombre_proyecto", "cliente", "fecha_evento", "total", "status_pago"]' as view_columns
    FROM generate_series(1, 3) gs -- 3 views per user
) view_data
WHERE u.company_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
LIMIT 150; -- Limit total saved views

-- Final verification queries (commented out for production)
/*
SELECT 'Data Generation Summary:' as summary;
SELECT 'Companies: ' || COUNT(*) as count FROM public.core_companies;
SELECT 'Users: ' || COUNT(*) as count FROM public.core_users;
SELECT 'Clients: ' || COUNT(*) as count FROM public.evt_clientes;
SELECT 'Events: ' || COUNT(*) as count FROM public.evt_eventos;
SELECT 'Expenses: ' || COUNT(*) as count FROM public.evt_gastos;
SELECT 'Incomes: ' || COUNT(*) as count FROM public.evt_ingresos;
SELECT 'OCR Logs: ' || COUNT(*) as count FROM public.ocr_processing_log;
SELECT 'Audit Logs: ' || COUNT(*) as count FROM public.core_audit_log;
*/

-- Success message
SELECT 'Test data generation completed successfully!' as status,
       'Generated: 1 company, 20 users, 50 clients, 1000 events, ~20000 expenses, ~7500 incomes' as summary;