export interface Event {
  id: string;
  company_id?: string;
  clave_evento: string;
  nombre_proyecto: string;
  descripcion?: string;
  cliente_id?: string;
  tipo_evento_id?: string;
  estado_id: number;
  responsable_id?: string;
  solicitante_id?: string;
  fecha_evento: string;
  fecha_fin?: string;
  hora_inicio?: string;
  hora_fin?: string;
  lugar?: string;
  numero_invitados?: number;
  presupuesto_estimado?: number;
  
  // Financial data
  subtotal: number;
  iva_porcentaje: number;
  iva: number;
  total: number;
  total_gastos: number;
  utilidad: number;
  margen_utilidad: number;
  
  // Status
  status_facturacion: 'pendiente_facturar' | 'facturado' | 'cancelado';
  status_pago: 'pendiente' | 'pago_pendiente' | 'pagado' | 'vencido';
  fecha_facturacion?: string;
  fecha_vencimiento?: string;
  fecha_pago?: string;
  documento_factura_url?: string;
  documento_pago_url?: string;
  
  // Project management
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fase_proyecto: 'cotizacion' | 'aprobado' | 'en_proceso' | 'completado';
  notas?: string;
  
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Relations
  cliente?: Cliente;
  tipo_evento?: TipoEvento;
  estado?: EventState;
  responsable?: Usuario;
  solicitante?: Usuario;
  ingresos?: Income[];
  gastos?: Expense[];
  documentos?: Documento[];
}

export interface EventoCompleto extends Event {
  cliente_nombre?: string;
  cliente_comercial?: string;
  cliente_rfc?: string;
  cliente_email?: string;
  cliente_telefono?: string;
  contacto_principal?: string;
  tipo_evento?: string;
  tipo_color?: string;
  estado?: string;
  estado_color?: string;
  workflow_step?: number;
  responsable_nombre?: string;
  dias_vencido?: number;
  status_vencimiento?: string;
  creado_por?: string;
  actualizado_por?: string;
}

export interface Cliente {
  id: string;
  company_id?: string;
  razon_social: string;
  nombre_comercial?: string;
  rfc: string;
  sufijo: string;
  email?: string;
  telefono?: string;
  direccion_fiscal?: string;
  contacto_principal?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  regimen_fiscal?: string;
  uso_cfdi: string;
  metodo_pago: string;
  forma_pago: string;
  dias_credito: number;
  limite_credito?: number;
  activo: boolean;
  notas?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TipoEvento {
  id: string;
  company_id?: string;
  nombre: string;
  descripcion?: string;
  color: string;
  activo: boolean;
  created_at: string;
}

export interface Estado {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  orden: number;
  workflow_step?: number;
}

export interface EventState {
  id: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  orden: number;
  workflow_step?: number;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
}

export interface DashboardMetrics {
  total_eventos: number;
  eventos_futuros: number;
  eventos_pasados: number;
  pagos_pendientes: number;
  facturas_pendientes: number;
  pagos_vencidos: number;
  eventos_cobrados: number;
  ingresos_totales: number;
  ingresos_cobrados: number;
  ingresos_por_cobrar: number;
  gastos_totales: number;
  utilidad_total: number;
  margen_promedio: number;
  tasa_cobranza: number;
  ratio_gastos_ingresos: number;
}

export interface AnalisisTemporal {
  año: number;
  mes: number;
  total_eventos: number;
  ingresos_mes: number;
  gastos_mes: number;
  utilidad_mes: number;
  margen_promedio: number;
  eventos_cobrados: number;
  eventos_pendientes: number;
}

export const EVENT_STATES = {
  BORRADOR: 1,
  COTIZADO: 2,
  APROBADO: 3,
  EN_PROCESO: 4,
  COMPLETADO: 5,
  FACTURADO: 6,
  COBRADO: 7
} as const;

export const PAYMENT_STATUS = {
  PENDIENTE: 'pendiente',
  PAGO_PENDIENTE: 'pago_pendiente',
  PAGADO: 'pagado',
  VENCIDO: 'vencido'
} as const;

export const BILLING_STATUS = {
  PENDIENTE_FACTURAR: 'pendiente_facturar',
  FACTURADO: 'facturado',
  CANCELADO: 'cancelado'
} as const;

export const PROJECT_PHASES = {
  COTIZACION: 'cotizacion',
  APROBADO: 'aprobado',
  EN_PROCESO: 'en_proceso',
  COMPLETADO: 'completado'
} as const;

export const PRIORITIES = {
  BAJA: 'baja',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente'
} as const;