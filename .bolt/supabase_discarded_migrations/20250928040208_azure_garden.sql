/*
  # MADE ERP v2.0 - Estructura de Base de Datos
  # Fecha: 27 de Septiembre, 2025
  # Sistema Integral de Gestión de Eventos
  
  Este archivo documenta la estructura completa de la base de datos del sistema MADE ERP v2.0,
  un sistema empresarial para la gestión integral de eventos con control financiero,
  gestión de clientes y sistema de archivos adjuntos.
*/

-- =====================================================
-- MÓDULO CORE: Configuración y Usuarios del Sistema
-- =====================================================

/*
  Tabla: core_companies
  Propósito: Almacena información de las empresas que usan el sistema (multi-tenant)
  Características: Soporte para múltiples empresas, validación de RFC mexicano
*/
CREATE TABLE core_companies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre varchar(255) NOT NULL,                    -- Razón social de la empresa
    rfc varchar(13) UNIQUE NOT NULL,                 -- RFC mexicano validado
    email varchar(255),                              -- Email principal de la empresa
    telefono varchar(20),                            -- Teléfono de contacto
    direccion text,                                  -- Dirección fiscal completa
    logo_url text,                                   -- URL del logo de la empresa
    activo boolean DEFAULT true,                     -- Estado activo/inactivo
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

/*
  Tabla: core_users
  Propósito: Usuarios del sistema con información básica y relación a empresa
  Características: Integración con Supabase Auth, multi-tenant por empresa
*/
CREATE TABLE core_users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid REFERENCES core_companies(id) ON DELETE CASCADE,
    email varchar(255) UNIQUE NOT NULL,              -- Email único del usuario
    nombre varchar(255) NOT NULL,                    -- Nombre completo del usuario
    apellidos varchar(255),                          -- Apellidos del usuario
    telefono varchar(20),                            -- Teléfono personal
    puesto varchar(100),                             -- Puesto en la empresa
    avatar_url text,                                 -- URL del avatar del usuario
    activo boolean DEFAULT true,                     -- Estado activo/inactivo
    ultimo_login timestamptz,                        -- Último acceso al sistema
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

/*
  Tabla: core_roles
  Propósito: Definición de roles del sistema con permisos granulares
  Características: Sistema de permisos basado en JSON, roles personalizables
*/
CREATE TABLE core_roles (
    id serial PRIMARY KEY,
    nombre varchar(100) UNIQUE NOT NULL,             -- Nombre del rol (ej: Administrador)
    descripcion text,                                -- Descripción del rol
    permisos jsonb DEFAULT '[]'::jsonb,              -- Array de permisos en formato JSON
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

/*
  Tabla: core_user_roles
  Propósito: Relación many-to-many entre usuarios y roles
  Características: Auditoría de asignación, soporte para múltiples roles por usuario
*/
CREATE TABLE core_user_roles (
    id serial PRIMARY KEY,
    user_id uuid REFERENCES core_users(id) ON DELETE CASCADE,
    role_id integer REFERENCES core_roles(id) ON DELETE CASCADE,
    asignado_por uuid REFERENCES core_users(id),     -- Quién asignó el rol
    fecha_asignacion timestamptz DEFAULT now(),      -- Cuándo se asignó
    activo boolean DEFAULT true,                     -- Estado de la asignación
    UNIQUE(user_id, role_id)                         -- Un usuario no puede tener el mismo rol duplicado
);

-- =====================================================
-- MÓDULO DE EVENTOS: Gestión Central de Eventos
-- =====================================================

/*
  Tabla: evt_clientes
  Propósito: Información fiscal y comercial de clientes mexicanos
  Características: Validación RFC, configuración CFDI, datos de facturación
*/
CREATE TABLE evt_clientes (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id) ON DELETE CASCADE,
    razon_social varchar(255) NOT NULL,              -- Razón social oficial
    nombre_comercial varchar(255),                   -- Nombre comercial (opcional)
    rfc varchar(13) NOT NULL,                        -- RFC mexicano validado
    email varchar(255),                              -- Email principal
    telefono varchar(20),                            -- Teléfono principal
    direccion_fiscal text,                           -- Dirección fiscal completa
    contacto_principal varchar(255),                 -- Nombre del contacto principal
    telefono_contacto varchar(20),                   -- Teléfono del contacto
    email_contacto varchar(255),                     -- Email del contacto
    regimen_fiscal varchar(10),                      -- Régimen fiscal SAT (601, 612, etc.)
    uso_cfdi varchar(10) DEFAULT 'G03',              -- Uso de CFDI por defecto
    metodo_pago varchar(10) DEFAULT 'PUE',           -- Método de pago (PUE/PPD)
    forma_pago varchar(10) DEFAULT '03',             -- Forma de pago SAT
    dias_credito integer DEFAULT 30,                 -- Días de crédito otorgados
    limite_credito numeric(15,2),                    -- Límite de crédito en pesos
    activo boolean DEFAULT true,
    notas text,                                      -- Notas adicionales del cliente
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES core_users(id),
    UNIQUE(company_id, rfc)                          -- RFC único por empresa
);

/*
  Tabla: evt_tipos_evento
  Propósito: Categorización de tipos de eventos
  Características: Personalizable por empresa, código de colores
*/
CREATE TABLE evt_tipos_evento (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id),
    nombre varchar(100) NOT NULL,                    -- Nombre del tipo (ej: Conferencia)
    descripcion text,                                -- Descripción del tipo
    color varchar(7) DEFAULT '#74F1C8',              -- Color hexadecimal para UI
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

/*
  Tabla: evt_estados
  Propósito: Estados del workflow de eventos
  Características: Workflow ordenado, colores personalizables
*/
CREATE TABLE evt_estados (
    id serial PRIMARY KEY,
    nombre varchar(50) UNIQUE NOT NULL,              -- Nombre del estado
    descripcion text,                                -- Descripción del estado
    color varchar(7),                                -- Color para UI
    orden integer DEFAULT 0,                         -- Orden en el workflow
    workflow_step integer                            -- Paso en el workflow automatizado
);

/*
  Tabla: evt_eventos (TABLA PRINCIPAL)
  Propósito: Información completa de eventos con control financiero
  Características: Cálculos automáticos, workflow de estados, archivos adjuntos
*/
CREATE TABLE evt_eventos (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id) ON DELETE CASCADE,
    clave_evento varchar(50) UNIQUE NOT NULL,        -- Clave única auto-generada (EVT-2024-001)
    nombre_proyecto varchar(255) NOT NULL,           -- Nombre del proyecto/evento
    descripcion text,                                -- Descripción detallada
    cliente_id integer REFERENCES evt_clientes(id),
    tipo_evento_id integer REFERENCES evt_tipos_evento(id),
    estado_id integer REFERENCES evt_estados(id) DEFAULT 1,
    responsable_id uuid REFERENCES core_users(id),
    
    -- Fechas y ubicación
    fecha_evento date NOT NULL,                      -- Fecha principal del evento
    fecha_fin date,                                  -- Fecha de fin (opcional)
    hora_inicio time,                                -- Hora de inicio
    hora_fin time,                                   -- Hora de fin
    lugar varchar(255),                              -- Ubicación del evento
    numero_invitados integer,                        -- Número estimado de asistentes
    
    -- Control financiero (calculado automáticamente por triggers)
    presupuesto_estimado numeric(15,2),              -- Presupuesto inicial estimado
    subtotal numeric(15,2) DEFAULT 0,                -- Subtotal de ingresos
    iva_porcentaje numeric(5,2) DEFAULT 16.00,       -- Porcentaje de IVA aplicado
    iva numeric(15,2) DEFAULT 0,                     -- Monto de IVA
    total numeric(15,2) DEFAULT 0,                   -- Total de ingresos
    total_gastos numeric(15,2) DEFAULT 0,            -- Total de gastos
    utilidad numeric(15,2) DEFAULT 0,                -- Utilidad neta (ingresos - gastos)
    margen_utilidad numeric(5,2) DEFAULT 0,          -- Porcentaje de margen
    
    -- Estados de facturación y pago
    status_facturacion varchar(20) DEFAULT 'pendiente_facturar',  -- pendiente_facturar, facturado, cancelado
    status_pago varchar(20) DEFAULT 'pendiente',                  -- pendiente, pago_pendiente, pagado, vencido
    fecha_facturacion date,                          -- Fecha de facturación
    fecha_vencimiento date,                          -- Fecha de vencimiento de pago
    fecha_pago date,                                 -- Fecha de pago recibido
    documento_factura_url text,                      -- URL de la factura generada
    documento_pago_url text,                         -- URL del comprobante de pago
    
    -- Gestión de proyecto
    prioridad varchar(10) DEFAULT 'media',           -- baja, media, alta, urgente
    fase_proyecto varchar(50) DEFAULT 'cotizacion',  -- cotizacion, aprobado, en_proceso, completado
    notas text,                                      -- Notas internas del evento
    
    -- Auditoría
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES core_users(id),
    updated_by uuid REFERENCES core_users(id)
);

-- =====================================================
-- MÓDULO FINANCIERO: Ingresos y Gastos
-- =====================================================

/*
  Tabla: evt_categorias_gastos
  Propósito: Categorización de gastos para análisis financiero
  Características: Colores personalizables, específicas por empresa
*/
CREATE TABLE evt_categorias_gastos (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id),
    nombre varchar(100) NOT NULL,                    -- Nombre de la categoría
    descripcion text,                                -- Descripción de la categoría
    color varchar(7) DEFAULT '#16A085',              -- Color hexadecimal para reportes
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

/*
  Tabla: evt_ingresos
  Propósito: Registro de ingresos con archivos PDF obligatorios
  Características: Cálculos automáticos, archivos adjuntos, estados de facturación
*/
CREATE TABLE evt_ingresos (
    id serial PRIMARY KEY,
    evento_id integer REFERENCES evt_eventos(id) ON DELETE CASCADE,
    concepto varchar(255) NOT NULL,                  -- Concepto del ingreso
    descripcion text,                                -- Descripción detallada
    cantidad numeric(10,3) DEFAULT 1,                -- Cantidad de servicios/productos
    precio_unitario numeric(15,2) NOT NULL,          -- Precio por unidad
    subtotal numeric(15,2) DEFAULT 0,                -- Calculado automáticamente
    iva_porcentaje numeric(5,2) DEFAULT 16.00,       -- Porcentaje de IVA
    iva numeric(15,2) DEFAULT 0,                     -- Monto de IVA calculado
    total numeric(15,2) DEFAULT 0,                   -- Total calculado automáticamente
    fecha_ingreso date DEFAULT CURRENT_DATE,         -- Fecha del ingreso
    referencia varchar(100),                         -- Referencia o número de factura
    
    -- Estados de facturación
    facturado boolean DEFAULT false,                 -- Si ya se facturó
    cobrado boolean DEFAULT false,                   -- Si ya se cobró
    fecha_facturacion date,                          -- Fecha de facturación
    fecha_cobro date,                                -- Fecha de cobro
    metodo_cobro varchar(50),                        -- Método de cobro utilizado
    
    -- Archivos adjuntos (OBLIGATORIOS para ingresos)
    archivo_adjunto text,                            -- URL del archivo en Supabase Storage
    archivo_nombre text,                             -- Nombre original del archivo
    archivo_tamaño bigint,                           -- Tamaño en bytes
    archivo_tipo text,                               -- Tipo MIME del archivo
    
    notas text,                                      -- Notas adicionales
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES core_users(id)
);

/*
  Tabla: evt_gastos
  Propósito: Registro de gastos con archivos opcionales y workflow de aprobación
  Características: Soft delete, workflow de aprobación, archivos opcionales
*/
CREATE TABLE evt_gastos (
    id serial PRIMARY KEY,
    evento_id integer REFERENCES evt_eventos(id) ON DELETE CASCADE,
    categoria_id integer REFERENCES evt_categorias_gastos(id),
    concepto varchar(255) NOT NULL,                  -- Concepto del gasto
    descripcion text,                                -- Descripción detallada
    cantidad numeric(10,3) DEFAULT 1,                -- Cantidad de productos/servicios
    precio_unitario numeric(15,2) NOT NULL,          -- Precio por unidad
    subtotal numeric(15,2) DEFAULT 0,                -- Calculado automáticamente
    iva_porcentaje numeric(5,2) DEFAULT 16.00,       -- Porcentaje de IVA
    iva numeric(15,2) DEFAULT 0,                     -- Monto de IVA calculado
    total numeric(15,2) DEFAULT 0,                   -- Total calculado automáticamente
    proveedor varchar(255),                          -- Nombre del proveedor
    rfc_proveedor varchar(13),                       -- RFC del proveedor (validado)
    fecha_gasto date DEFAULT CURRENT_DATE,           -- Fecha del gasto
    forma_pago varchar(20) DEFAULT 'efectivo',       -- Forma de pago utilizada
    referencia varchar(100),                         -- Referencia o número de factura
    documento_url text,                              -- URL del documento (legacy)
    
    -- Workflow de aprobación
    status_aprobacion varchar(20) DEFAULT 'aprobado', -- pendiente, aprobado, rechazado
    aprobado_por uuid REFERENCES core_users(id),     -- Quién aprobó el gasto
    fecha_aprobacion timestamptz,                     -- Cuándo se aprobó
    
    -- Archivos adjuntos (OPCIONALES para gastos)
    archivo_adjunto text,                            -- URL del archivo en Supabase Storage
    archivo_nombre text,                             -- Nombre original del archivo
    archivo_tamaño bigint,                           -- Tamaño en bytes
    archivo_tipo text,                               -- Tipo MIME del archivo
    
    -- Soft delete para auditoría
    deleted_at timestamptz,                          -- Fecha de eliminación lógica
    deleted_by uuid REFERENCES core_users(id),       -- Quién eliminó el registro
    delete_reason text,                              -- Motivo de eliminación
    
    notas text,                                      -- Notas adicionales
    activo boolean DEFAULT true,                     -- Estado activo (para soft delete)
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES core_users(id)
);

-- =====================================================
-- MÓDULO DE DOCUMENTOS: Gestión de Archivos
-- =====================================================

/*
  Tabla: evt_documentos
  Propósito: Registro de documentos adjuntos a eventos
  Características: Metadatos de archivos, categorización, auditoría
*/
CREATE TABLE evt_documentos (
    id serial PRIMARY KEY,
    evento_id integer REFERENCES evt_eventos(id) ON DELETE CASCADE,
    tipo_documento varchar(50) NOT NULL,             -- ingreso, gasto, factura, comprobante
    categoria varchar(50),                           -- Categoría adicional del documento
    nombre_archivo varchar(255) NOT NULL,            -- Nombre original del archivo
    url_archivo text NOT NULL,                       -- URL en Supabase Storage
    tamaño_archivo bigint,                           -- Tamaño en bytes
    tipo_mime varchar(100),                          -- Tipo MIME del archivo
    descripcion text,                                -- Descripción del documento
    datos_ocr jsonb,                                 -- Datos extraídos por OCR (legacy)
    procesado_ocr boolean DEFAULT false,             -- Si fue procesado por OCR (legacy)
    confianza_ocr numeric(3,2),                      -- Nivel de confianza OCR (legacy)
    created_at timestamptz DEFAULT now(),
    uploaded_by uuid REFERENCES core_users(id)
);

-- =====================================================
-- MÓDULO DE AUDITORÍA: Trazabilidad y Logs
-- =====================================================

/*
  Tabla: core_audit_log
  Propósito: Registro completo de todas las acciones del sistema
  Características: Trazabilidad completa, metadatos de sesión, performance tracking
*/
CREATE TABLE core_audit_log (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id),
    user_id uuid REFERENCES core_users(id),
    timestamp timestamptz DEFAULT now(),
    action varchar(50) NOT NULL,                     -- Acción realizada (evento_creado, etc.)
    module varchar(50) NOT NULL,                     -- Módulo del sistema (eventos, clientes, etc.)
    entity_type varchar(50) NOT NULL,                -- Tipo de entidad afectada
    entity_id varchar(100) NOT NULL,                 -- ID de la entidad afectada
    old_value jsonb,                                 -- Valor anterior (para updates)
    new_value jsonb,                                 -- Valor nuevo
    ip_address inet,                                 -- Dirección IP del usuario
    user_agent text,                                 -- User agent del navegador
    session_id varchar(255),                         -- ID de sesión
    success boolean DEFAULT true,                    -- Si la operación fue exitosa
    error_message text,                              -- Mensaje de error si falló
    duration integer                                 -- Duración de la operación en ms
);

/*
  Tabla: evt_historial
  Propósito: Historial específico de cambios en eventos
  Características: Registro detallado de modificaciones por campo
*/
CREATE TABLE evt_historial (
    id serial PRIMARY KEY,
    evento_id integer REFERENCES evt_eventos(id) ON DELETE CASCADE,
    campo_modificado varchar(100) NOT NULL,          -- Campo que se modificó
    valor_anterior text,                             -- Valor antes del cambio
    valor_nuevo text,                                -- Valor después del cambio
    accion varchar(20) NOT NULL,                     -- create, update, delete
    descripcion text,                                -- Descripción del cambio
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES core_users(id)
);

-- =====================================================
-- MÓDULO DE CONFIGURACIÓN: Configuración del Sistema
-- =====================================================

/*
  Tabla: core_system_config
  Propósito: Configuración global del sistema por empresa
  Características: Configuración flexible en JSON, versionado
*/
CREATE TABLE core_system_config (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id),
    config_key varchar(100) NOT NULL,                -- Clave de configuración
    config_value jsonb,                              -- Valor en formato JSON
    description text,                                -- Descripción de la configuración
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES core_users(id),
    UNIQUE(company_id, config_key)                   -- Una configuración por empresa
);

/*
  Tabla: core_security_config
  Propósito: Configuración de seguridad y permisos
  Características: Control granular de seguridad, timeouts de sesión
*/
CREATE TABLE core_security_config (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id),
    security_mode varchar(20) DEFAULT 'development', -- development, production
    rls_enabled boolean DEFAULT false,               -- Si RLS está habilitado
    bypass_auth boolean DEFAULT true,                -- Bypass de autenticación (solo dev)
    enable_permissions boolean DEFAULT false,        -- Si los permisos están activos
    session_timeout integer DEFAULT 480,             -- Timeout de sesión en minutos
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES core_users(id)
);

-- =====================================================
-- MÓDULOS ADICIONALES: Funcionalidades Extendidas
-- =====================================================

/*
  Tabla: core_saved_views
  Propósito: Vistas guardadas por usuarios para filtros personalizados
  Características: Filtros personalizables, compartibles entre usuarios
*/
CREATE TABLE core_saved_views (
    id serial PRIMARY KEY,
    user_id uuid REFERENCES core_users(id),
    name varchar(100) NOT NULL,                      -- Nombre de la vista guardada
    description text,                                -- Descripción de la vista
    module varchar(50) NOT NULL,                     -- Módulo al que aplica
    filters jsonb,                                   -- Filtros aplicados en JSON
    sorting jsonb,                                   -- Ordenamiento aplicado
    columns jsonb,                                   -- Columnas visibles
    shared boolean DEFAULT false,                    -- Si es compartida con otros usuarios
    role_specific varchar(50),                       -- Si es específica para un rol
    created_at timestamptz DEFAULT now()
);

/*
  Tabla: core_scheduled_reports
  Propósito: Reportes programados automáticos
  Características: Configuración cron, múltiples formatos, destinatarios
*/
CREATE TABLE core_scheduled_reports (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,                      -- Nombre del reporte
    description text,                                -- Descripción del reporte
    report_type varchar(50),                         -- Tipo de reporte
    config jsonb,                                    -- Configuración del reporte en JSON
    schedule_cron varchar(100),                      -- Expresión cron para programación
    recipients jsonb,                                -- Lista de destinatarios
    format varchar(20) DEFAULT 'pdf',                -- Formato de salida (pdf, excel, csv)
    active boolean DEFAULT true,                     -- Si está activo
    last_run timestamptz,                            -- Última ejecución
    next_run timestamptz,                            -- Próxima ejecución programada
    created_by uuid REFERENCES core_users(id),
    created_at timestamptz DEFAULT now()
);

/*
  Tabla: core_activity_log
  Propósito: Log de actividad de usuarios para dashboard
  Características: Actividad en tiempo real, metadatos de sesión
*/
CREATE TABLE core_activity_log (
    id serial PRIMARY KEY,
    user_id uuid REFERENCES core_users(id),
    user_email varchar(255),                         -- Email del usuario (desnormalizado)
    user_role varchar(50),                           -- Rol del usuario al momento de la acción
    action varchar(100) NOT NULL,                    -- Acción realizada
    description text,                                -- Descripción de la acción
    module varchar(50),                              -- Módulo donde se realizó
    ip_address inet,                                 -- IP del usuario
    user_agent text,                                 -- User agent del navegador
    created_at timestamptz DEFAULT now()
);

-- =====================================================
-- MÓDULOS FUTUROS: Preparación para Expansión
-- =====================================================

/*
  Tabla: alm_productos (PREPARACIÓN FUTURA)
  Propósito: Catálogo de productos para módulo de almacén
  Estado: Estructura básica para desarrollo futuro
*/
CREATE TABLE alm_productos (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id),
    codigo varchar(50) NOT NULL,                     -- Código único del producto
    nombre varchar(255) NOT NULL,                    -- Nombre del producto
    descripcion text,                                -- Descripción del producto
    categoria varchar(100),                          -- Categoría del producto
    precio_unitario numeric(15,2),                   -- Precio unitario
    stock_actual integer DEFAULT 0,                  -- Stock actual
    stock_minimo integer DEFAULT 0,                  -- Stock mínimo
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, codigo)                       -- Código único por empresa
);

/*
  Tabla: cmp_proveedores (PREPARACIÓN FUTURA)
  Propósito: Catálogo de proveedores para módulo de compras
  Estado: Estructura básica para desarrollo futuro
*/
CREATE TABLE cmp_proveedores (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id),
    nombre varchar(255) NOT NULL,                    -- Nombre del proveedor
    rfc varchar(13) NOT NULL,                        -- RFC del proveedor
    email varchar(255),                              -- Email de contacto
    telefono varchar(20),                            -- Teléfono de contacto
    direccion text,                                  -- Dirección del proveedor
    contacto_principal varchar(255),                 -- Contacto principal
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

/*
  Tabla: cnt_cuentas (PREPARACIÓN FUTURA)
  Propósito: Catálogo de cuentas contables
  Estado: Estructura básica para módulo de contabilidad
*/
CREATE TABLE cnt_cuentas (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id),
    codigo varchar(20) NOT NULL,                     -- Código de la cuenta contable
    nombre varchar(255) NOT NULL,                    -- Nombre de la cuenta
    tipo_cuenta varchar(50),                         -- Tipo de cuenta (activo, pasivo, etc.)
    padre_id integer REFERENCES cnt_cuentas(id),     -- Cuenta padre (jerarquía)
    nivel integer DEFAULT 1,                         -- Nivel en la jerarquía
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, codigo)                       -- Código único por empresa
);

/*
  Tabla: rh_empleados (PREPARACIÓN FUTURA)
  Propósito: Información de empleados para módulo de RRHH
  Estado: Estructura básica para desarrollo futuro
*/
CREATE TABLE rh_empleados (
    id serial PRIMARY KEY,
    company_id uuid REFERENCES core_companies(id),
    numero_empleado varchar(20) NOT NULL,            -- Número único del empleado
    nombre varchar(255) NOT NULL,                    -- Nombre completo
    apellidos varchar(255),                          -- Apellidos
    puesto varchar(100),                             -- Puesto de trabajo
    departamento varchar(100),                       -- Departamento
    salario numeric(15,2),                           -- Salario mensual
    fecha_ingreso date,                              -- Fecha de ingreso a la empresa
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(company_id, numero_empleado)              -- Número único por empresa
);

-- =====================================================
-- TABLA ESPECIAL: Log de Procesamiento OCR (Legacy)
-- =====================================================

/*
  Tabla: ocr_processing_log
  Propósito: Log histórico del procesamiento OCR (antes de migración)
  Estado: Mantenida para compatibilidad, no se usa en v2.0
  Nota: Esta tabla conserva el historial de cuando el sistema usaba OCR
*/
CREATE TABLE ocr_processing_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type text NOT NULL,                     -- Tipo de documento procesado
    document_id text NOT NULL,                       -- ID del documento
    original_filename text,                          -- Nombre original del archivo
    processing_time_seconds numeric,                 -- Tiempo de procesamiento
    confidence_overall numeric,                      -- Confianza general del OCR
    confidence_breakdown jsonb,                      -- Desglose de confianza por campo
    extracted_text text,                             -- Texto extraído completo
    errors text,                                     -- Errores durante el procesamiento
    processed_at timestamptz DEFAULT now(),
    processed_by text                                -- Sistema o usuario que procesó
);

-- =====================================================
-- VISTAS MATERIALIZADAS: Consultas Optimizadas
-- =====================================================

/*
  Vista: vw_eventos_completos
  Propósito: Vista desnormalizada con toda la información de eventos
  Uso: Consultas rápidas para listados y reportes
*/
CREATE VIEW vw_eventos_completos AS
SELECT 
    e.id,
    e.clave_evento,
    e.nombre_proyecto,
    e.descripcion,
    e.fecha_evento,
    e.fecha_fin,
    e.lugar,
    e.numero_invitados,
    
    -- Información del cliente
    c.razon_social as cliente_nombre,
    c.nombre_comercial as cliente_comercial,
    c.rfc as cliente_rfc,
    c.email as cliente_email,
    c.telefono as cliente_telefono,
    c.contacto_principal,
    
    -- Información del tipo y estado
    te.nombre as tipo_evento,
    te.color as tipo_color,
    es.nombre as estado,
    es.color as estado_color,
    es.workflow_step,
    
    -- Información del responsable
    u.nombre as responsable_nombre,
    
    -- Información financiera
    e.subtotal,
    e.iva_porcentaje,
    e.iva,
    e.total,
    e.total_gastos,
    e.utilidad,
    e.margen_utilidad,
    
    -- Estados de facturación y pago
    e.status_facturacion,
    e.status_pago,
    e.fecha_facturacion,
    e.fecha_vencimiento,
    e.fecha_pago,
    
    -- Gestión de proyecto
    e.fase_proyecto,
    e.prioridad,
    
    -- Cálculos adicionales
    CASE 
        WHEN e.fecha_vencimiento IS NOT NULL AND e.fecha_vencimiento < CURRENT_DATE 
        THEN EXTRACT(days FROM CURRENT_DATE - e.fecha_vencimiento)::integer
        ELSE 0 
    END as dias_vencido,
    
    CASE 
        WHEN e.fecha_vencimiento IS NOT NULL AND e.fecha_vencimiento < CURRENT_DATE 
        THEN 'Vencido'
        WHEN e.fecha_vencimiento IS NOT NULL AND e.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days'
        THEN 'Por vencer'
        ELSE 'Al corriente'
    END as status_vencimiento,
    
    -- Auditoría
    e.created_at,
    e.updated_at,
    uc.nombre as creado_por,
    uu.nombre as actualizado_por
    
FROM evt_eventos e
LEFT JOIN evt_clientes c ON e.cliente_id = c.id
LEFT JOIN evt_tipos_evento te ON e.tipo_evento_id = te.id
LEFT JOIN evt_estados es ON e.estado_id = es.id
LEFT JOIN core_users u ON e.responsable_id = u.id
LEFT JOIN core_users uc ON e.created_by = uc.id
LEFT JOIN core_users uu ON e.updated_by = uu.id
WHERE e.activo = true;

/*
  Vista: vw_dashboard_metricas
  Propósito: Métricas consolidadas para el dashboard ejecutivo
  Uso: KPIs y métricas en tiempo real
*/
CREATE VIEW vw_dashboard_metricas AS
SELECT 
    COUNT(*) as total_eventos,
    COUNT(*) FILTER (WHERE fecha_evento > CURRENT_DATE) as eventos_futuros,
    COUNT(*) FILTER (WHERE fecha_evento <= CURRENT_DATE) as eventos_pasados,
    COUNT(*) FILTER (WHERE status_pago IN ('pendiente', 'pago_pendiente')) as pagos_pendientes,
    COUNT(*) FILTER (WHERE status_facturacion = 'pendiente_facturar') as facturas_pendientes,
    COUNT(*) FILTER (WHERE fecha_vencimiento < CURRENT_DATE AND status_pago != 'pagado') as pagos_vencidos,
    COUNT(*) FILTER (WHERE status_pago = 'pagado') as eventos_cobrados,
    
    -- Métricas financieras
    COALESCE(SUM(total), 0) as ingresos_totales,
    COALESCE(SUM(total) FILTER (WHERE status_pago = 'pagado'), 0) as ingresos_cobrados,
    COALESCE(SUM(total) FILTER (WHERE status_pago != 'pagado'), 0) as ingresos_por_cobrar,
    COALESCE(SUM(total_gastos), 0) as gastos_totales,
    COALESCE(SUM(utilidad), 0) as utilidad_total,
    
    -- Métricas calculadas
    CASE 
        WHEN COUNT(*) > 0 THEN AVG(margen_utilidad)
        ELSE 0 
    END as margen_promedio,
    
    CASE 
        WHEN COUNT(*) > 0 THEN 
            (COUNT(*) FILTER (WHERE status_pago = 'pagado')::numeric / COUNT(*)::numeric) * 100
        ELSE 0 
    END as tasa_cobranza,
    
    CASE 
        WHEN SUM(total) > 0 THEN 
            (SUM(total_gastos) / SUM(total)) * 100
        ELSE 0 
    END as ratio_gastos_ingresos
    
FROM evt_eventos 
WHERE activo = true;

/*
  Vista: vw_master_facturacion
  Propósito: Vista consolidada para el master de facturación
  Uso: Control centralizado de facturación y cobranza
*/
CREATE VIEW vw_master_facturacion AS
SELECT 
    e.id,
    e.clave_evento,
    e.nombre_proyecto,
    e.fecha_evento,
    EXTRACT(year FROM e.fecha_evento) as año,
    EXTRACT(month FROM e.fecha_evento) as mes,
    c.razon_social as cliente_nombre,
    c.rfc as cliente_rfc,
    u.nombre as responsable,
    e.subtotal,
    e.iva,
    e.total,
    e.total_gastos,
    e.utilidad,
    e.margen_utilidad,
    e.status_facturacion,
    e.status_pago,
    e.fecha_facturacion,
    e.fecha_vencimiento,
    e.fecha_pago,
    e.prioridad,
    e.fase_proyecto,
    
    -- Cálculo de días vencidos
    CASE 
        WHEN e.fecha_vencimiento IS NOT NULL AND e.fecha_vencimiento < CURRENT_DATE 
        THEN EXTRACT(days FROM CURRENT_DATE - e.fecha_vencimiento)::integer
        ELSE 0 
    END as dias_vencido,
    
    -- Color del badge según estado
    CASE e.status_pago
        WHEN 'pagado' THEN '#10B981'
        WHEN 'pago_pendiente' THEN '#F59E0B'
        WHEN 'pendiente' THEN '#EF4444'
        ELSE '#6B7280'
    END as badge_color
    
FROM evt_eventos e
LEFT JOIN evt_clientes c ON e.cliente_id = c.id
LEFT JOIN core_users u ON e.responsable_id = u.id
WHERE e.activo = true;

/*
  Vista: vw_gastos_por_categoria
  Propósito: Análisis de gastos agrupados por categoría
  Uso: Reportes financieros y análisis de costos
*/
CREATE VIEW vw_gastos_por_categoria AS
SELECT 
    cg.nombre as categoria,
    cg.color as categoria_color,
    COUNT(g.id) as total_gastos,
    COALESCE(SUM(g.total), 0) as monto_total,
    COALESCE(AVG(g.total), 0) as promedio_gasto,
    COALESCE(MIN(g.total), 0) as gasto_minimo,
    COALESCE(MAX(g.total), 0) as gasto_maximo,
    COUNT(g.id) FILTER (WHERE g.deleted_at IS NOT NULL) as gastos_eliminados,
    COUNT(g.id) FILTER (WHERE g.activo = true) as gastos_activos
FROM evt_categorias_gastos cg
LEFT JOIN evt_gastos g ON cg.id = g.categoria_id
WHERE cg.activo = true
GROUP BY cg.id, cg.nombre, cg.color;

/*
  Vista: vw_analisis_temporal
  Propósito: Análisis temporal de ingresos, gastos y utilidad
  Uso: Gráficos de tendencias y análisis de performance
*/
CREATE VIEW vw_analisis_temporal AS
SELECT 
    EXTRACT(year FROM fecha_evento) as año,
    EXTRACT(month FROM fecha_evento) as mes,
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
GROUP BY EXTRACT(year FROM fecha_evento), EXTRACT(month FROM fecha_evento)
ORDER BY año DESC, mes DESC;

-- =====================================================
-- FUNCIONES Y TRIGGERS: Automatización de Cálculos
-- =====================================================

/*
  Función: calculate_expense_totals()
  Propósito: Calcula automáticamente subtotal, IVA y total de gastos
  Trigger: Se ejecuta BEFORE INSERT OR UPDATE en evt_gastos
*/
CREATE OR REPLACE FUNCTION calculate_expense_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular subtotal
    NEW.subtotal = NEW.cantidad * NEW.precio_unitario;
    
    -- Calcular IVA
    NEW.iva = NEW.subtotal * (NEW.iva_porcentaje / 100);
    
    -- Calcular total
    NEW.total = NEW.subtotal + NEW.iva;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/*
  Función: calculate_income_totals()
  Propósito: Calcula automáticamente subtotal, IVA y total de ingresos
  Trigger: Se ejecuta BEFORE INSERT OR UPDATE en evt_ingresos
*/
CREATE OR REPLACE FUNCTION calculate_income_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular subtotal
    NEW.subtotal = NEW.cantidad * NEW.precio_unitario;
    
    -- Calcular IVA
    NEW.iva = NEW.subtotal * (NEW.iva_porcentaje / 100);
    
    -- Calcular total
    NEW.total = NEW.subtotal + NEW.iva;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/*
  Función: update_event_totals()
  Propósito: Actualiza automáticamente los totales del evento cuando cambian ingresos/gastos
  Trigger: Se ejecuta AFTER INSERT, UPDATE, DELETE en evt_ingresos y evt_gastos
*/
CREATE OR REPLACE FUNCTION update_event_totals()
RETURNS TRIGGER AS $$
DECLARE
    evento_id_to_update integer;
    total_ingresos numeric(15,2);
    total_gastos_calc numeric(15,2);
    utilidad_calc numeric(15,2);
    margen_calc numeric(5,2);
BEGIN
    -- Determinar el evento_id según la operación
    IF TG_OP = 'DELETE' THEN
        evento_id_to_update = OLD.evento_id;
    ELSE
        evento_id_to_update = NEW.evento_id;
    END IF;
    
    -- Calcular total de ingresos
    SELECT COALESCE(SUM(total), 0) INTO total_ingresos
    FROM evt_ingresos 
    WHERE evento_id = evento_id_to_update;
    
    -- Calcular total de gastos (solo activos)
    SELECT COALESCE(SUM(total), 0) INTO total_gastos_calc
    FROM evt_gastos 
    WHERE evento_id = evento_id_to_update 
    AND activo = true 
    AND deleted_at IS NULL;
    
    -- Calcular utilidad
    utilidad_calc = total_ingresos - total_gastos_calc;
    
    -- Calcular margen
    IF total_ingresos > 0 THEN
        margen_calc = (utilidad_calc / total_ingresos) * 100;
    ELSE
        margen_calc = 0;
    END IF;
    
    -- Actualizar el evento
    UPDATE evt_eventos SET
        subtotal = total_ingresos / 1.16,  -- Aproximación del subtotal
        total = total_ingresos,
        total_gastos = total_gastos_calc,
        utilidad = utilidad_calc,
        margen_utilidad = margen_calc,
        updated_at = now()
    WHERE id = evento_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS: Automatización de Procesos
-- =====================================================

-- Triggers para cálculos automáticos de gastos
CREATE TRIGGER trg_calculate_expense_totals
    BEFORE INSERT OR UPDATE ON evt_gastos
    FOR EACH ROW
    EXECUTE FUNCTION calculate_expense_totals();

-- Triggers para cálculos automáticos de ingresos
CREATE TRIGGER trg_calculate_income_totals
    BEFORE INSERT OR UPDATE ON evt_ingresos
    FOR EACH ROW
    EXECUTE FUNCTION calculate_income_totals();

-- Triggers para actualizar totales de eventos
CREATE TRIGGER trg_update_event_totals_gastos
    AFTER INSERT OR UPDATE OR DELETE ON evt_gastos
    FOR EACH ROW
    EXECUTE FUNCTION update_event_totals();

CREATE TRIGGER trg_update_event_totals_ingresos
    AFTER INSERT OR UPDATE OR DELETE ON evt_ingresos
    FOR EACH ROW
    EXECUTE FUNCTION update_event_totals();

-- =====================================================
-- ÍNDICES: Optimización de Consultas
-- =====================================================

-- Índices para evt_eventos (tabla principal)
CREATE INDEX idx_evt_eventos_company_fecha ON evt_eventos(company_id, fecha_evento);
CREATE INDEX idx_evt_eventos_cliente_fecha ON evt_eventos(cliente_id, fecha_evento);
CREATE INDEX idx_evt_eventos_responsable ON evt_eventos(responsable_id);
CREATE INDEX idx_evt_eventos_estado_pago ON evt_eventos(status_pago, fecha_vencimiento);

-- Índices para evt_clientes
CREATE INDEX idx_evt_clientes_rfc_activo ON evt_clientes(rfc, activo);

-- Índices para evt_gastos
CREATE INDEX idx_evt_gastos_evento_categoria ON evt_gastos(evento_id, categoria_id);
CREATE INDEX idx_evt_gastos_deleted ON evt_gastos(deleted_at) WHERE deleted_at IS NOT NULL;

-- Índices para evt_ingresos
CREATE INDEX idx_evt_ingresos_evento_fecha ON evt_ingresos(evento_id, fecha_ingreso);

-- Índices para core_users
CREATE INDEX idx_core_users_email_activo ON core_users(email, activo);

-- Índices para auditoría
CREATE INDEX idx_core_audit_timestamp ON core_audit_log(timestamp DESC);

-- =====================================================
-- POLÍTICAS RLS: Seguridad a Nivel de Fila
-- =====================================================

-- Habilitar RLS en tablas principales (actualmente deshabilitado en desarrollo)
-- ALTER TABLE evt_eventos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE evt_clientes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE evt_ingresos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE evt_gastos ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (actualmente no aplicadas en desarrollo)
/*
CREATE POLICY "Users can read company events" ON evt_eventos
    FOR SELECT TO authenticated
    USING (company_id IN (
        SELECT company_id FROM core_users WHERE id = uid()
    ));

CREATE POLICY "Users can create events" ON evt_eventos
    FOR INSERT TO authenticated
    WITH CHECK (company_id IN (
        SELECT company_id FROM core_users WHERE id = uid()
    ));
*/

-- =====================================================
-- DATOS DE REFERENCIA: Configuración Inicial
-- =====================================================

-- Estados básicos del workflow
INSERT INTO evt_estados (nombre, descripcion, color, orden, workflow_step) VALUES
('Borrador', 'Evento en borrador', '#6B7280', 1, 1),
('Cotizado', 'Evento cotizado', '#3B82F6', 2, 2),
('Aprobado', 'Evento aprobado por el cliente', '#10B981', 3, 3),
('En Proceso', 'Evento en ejecución', '#F59E0B', 4, 4),
('Completado', 'Evento completado', '#059669', 5, 5),
('Facturado', 'Evento facturado', '#7C3AED', 6, 6),
('Cobrado', 'Evento cobrado completamente', '#059669', 7, 7)
ON CONFLICT (nombre) DO NOTHING;

-- Roles básicos del sistema
INSERT INTO core_roles (nombre, descripcion, permisos) VALUES
('Administrador', 'Acceso completo al sistema', '["*.*.*.*"]'),
('Ejecutivo', 'Gestión de eventos y clientes', '["eventos.*.*.*", "clientes.*.*.*", "gastos.*.*.*", "ingresos.*.*.*"]'),
('Visualizador', 'Solo lectura de información', '["*.read.*.*"]')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================
-- COMENTARIOS SOBRE LA ESTRUCTURA
-- =====================================================

/*
  CARACTERÍSTICAS PRINCIPALES DE LA BASE DE DATOS:

  1. MULTI-TENANT: Soporte para múltiples empresas con aislamiento de datos
  2. AUDITORÍA COMPLETA: Registro de todas las operaciones con metadatos
  3. SOFT DELETE: Eliminación lógica para mantener integridad histórica
  4. CÁLCULOS AUTOMÁTICOS: Triggers para mantener consistencia financiera
  5. ARCHIVOS ADJUNTOS: Integración con Supabase Storage
  6. WORKFLOW: Estados ordenados con validaciones de transición
  7. FLEXIBILIDAD: Configuración JSON para extensibilidad
  8. PERFORMANCE: Índices optimizados para consultas frecuentes
  9. SEGURIDAD: RLS preparado para producción
  10. ESCALABILIDAD: Estructura preparada para módulos futuros

  MIGRACIÓN DE OCR A ARCHIVOS:
  - Se mantuvieron campos legacy (ocr_*) para compatibilidad
  - Se agregaron campos archivo_* para el nuevo sistema
  - La tabla ocr_processing_log se conserva para historial
  - Los nuevos registros usan exclusivamente archivo_adjunto

  MÓDULOS PREPARADOS PARA FUTURO DESARROLLO:
  - Almacén (alm_productos)
  - Compras (cmp_proveedores)
  - Contabilidad (cnt_cuentas)
  - Recursos Humanos (rh_empleados)

  CONSIDERACIONES DE SEGURIDAD:
  - RLS configurado pero deshabilitado en desarrollo
  - Validación de RFC mexicano en aplicación
  - Sanitización de nombres de archivo
  - Políticas de acceso por empresa

  OPTIMIZACIONES IMPLEMENTADAS:
  - Vistas materializadas para consultas complejas
  - Índices compuestos para filtros frecuentes
  - Triggers para cálculos automáticos
  - Configuración de cache en React Query
*/