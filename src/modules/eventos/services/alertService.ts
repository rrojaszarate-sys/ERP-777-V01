/**
 * 📧 Servicio de Alertas de Cobro por Email
 */

import { supabase } from '../../../core/config/supabase';
import nodemailer from 'nodemailer';
import type { Invoice, InvoiceAlert, AlertConfig } from '../types/Invoice';
import { 
  diasHastaVencimiento, 
  formatDateForDisplay,
  diasDesde 
} from '../utils/dateCalculator';

export class AlertService {
  private static instance: AlertService;

  private constructor() {}

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  /**
   * Obtiene la configuración de alertas
   */
  async getAlertConfig(): Promise<AlertConfig | null> {
    try {
      const { data, error } = await supabase
        .from('evt_configuracion_alertas')
        .select('*')
        .eq('activo', true)
        .single();
      
      if (error) {
        // Si no existe, crear una por defecto
        return this.createDefaultConfig();
      }
      
      return data as AlertConfig;
    } catch (error) {
      console.error('Error al obtener configuración:', error);
      return null;
    }
  }

  /**
   * Crea configuración por defecto
   */
  private async createDefaultConfig(): Promise<AlertConfig> {
    const defaultConfig = {
      dias_antes_alerta: 3,
      dias_despues_reenvio: 7,
      emails_cc: [],
      activo: true
    };

    const { data, error } = await supabase
      .from('evt_configuracion_alertas')
      .insert([defaultConfig])
      .select()
      .single();

    if (error) throw error;

    return data as AlertConfig;
  }

  /**
   * Verifica qué facturas necesitan alertas
   * (Para ejecutar diariamente)
   */
  async verificarFacturasParaAlertas(): Promise<{
    previas: Invoice[];
    compromiso: Invoice[];
    vencidas: Invoice[];
  }> {
    try {
      console.log('🔍 Verificando facturas para alertas...');
      
      const config = await this.getAlertConfig();
      if (!config) {
        console.warn('⚠️ No hay configuración de alertas activa');
        return { previas: [], compromiso: [], vencidas: [] };
      }

      // Obtener facturas pendientes o parciales
      const { data, error } = await supabase
        .from('evt_ingresos')
        .select(`
          *,
          evento:evt_eventos(
            id,
            clave_evento,
            nombre_proyecto,
            cliente:evt_clientes(
              id,
              razon_social,
              rfc,
              email,
              email_contacto
            ),
            responsable:core_users(
              id,
              nombre,
              email
            )
          )
        `)
        .in('status_cobro', ['pendiente', 'parcial', 'vencido'])
        .eq('activo', true)
        .not('uuid_cfdi', 'is', null);

      if (error) throw error;

      const facturas = (data as Invoice[]) || [];
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const previas: Invoice[] = [];
      const compromiso: Invoice[] = [];
      const vencidas: Invoice[] = [];

      for (const factura of facturas) {
        const diasRestantes = diasHastaVencimiento(new Date(factura.fecha_compromiso));
        
        // Alerta previa (X días antes)
        if (diasRestantes === config.dias_antes_alerta) {
          const yaEnviada = await this.alertaYaEnviada(factura.id, 'previa');
          if (!yaEnviada) {
            previas.push(factura);
          }
        }
        
        // Alerta en día de compromiso
        if (diasRestantes === 0) {
          const yaEnviada = await this.alertaYaEnviada(factura.id, 'compromiso');
          if (!yaEnviada) {
            compromiso.push(factura);
          }
        }
        
        // Alerta de vencida (cada X días después del vencimiento)
        if (diasRestantes < 0) {
          const diasVencida = Math.abs(diasRestantes);
          
          // Enviar cada X días configurados
          if (diasVencida % config.dias_despues_reenvio === 0) {
            const ultimaAlerta = await this.getUltimaAlertaVencida(factura.id);
            
            // Si no hay alerta o fue hace más de X días
            if (!ultimaAlerta || diasDesde(new Date(ultimaAlerta.fecha_envio)) >= config.dias_despues_reenvio) {
              vencidas.push(factura);
            }
          }
        }
      }

      console.log(`📊 Alertas a enviar - Previas: ${previas.length}, Compromiso: ${compromiso.length}, Vencidas: ${vencidas.length}`);

      return { previas, compromiso, vencidas };
    } catch (error) {
      console.error('❌ Error al verificar facturas:', error);
      return { previas: [], compromiso: [], vencidas: [] };
    }
  }

  /**
   * Envía alertas de cobro
   */
  async enviarAlertas(facturas: Invoice[], tipo: 'previa' | 'compromiso' | 'vencida'): Promise<number> {
    let enviadas = 0;

    for (const factura of facturas) {
      try {
        const destinatarios = this.obtenerDestinatarios(factura);
        
        console.log(`📧 Enviando alerta ${tipo} para factura ${factura.uuid_cfdi}...`);
        console.log(`   Destinatarios: ${destinatarios.join(', ')}`);

        // Enviar email con Gmail
        await this.enviarEmailGmail(factura, tipo, destinatarios);
        
        await this.registrarAlerta(factura.id, tipo, destinatarios, 'enviada');
        
        enviadas++;
      } catch (error) {
        console.error(`❌ Error al enviar alerta para ${factura.uuid_cfdi}:`, error);
        await this.registrarAlerta(factura.id, tipo, [], 'error', error instanceof Error ? error.message : 'Error desconocido');
      }
    }

    return enviadas;
  }

  /**
   * Envía email usando Gmail (con Nodemailer)
   */
  private async enviarEmailGmail(
    factura: Invoice, 
    tipo: 'previa' | 'compromiso' | 'vencida',
    destinatarios: string[]
  ): Promise<void> {
    // Configurar transporter de Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Generar contenido del email
    const { subject, html, text } = this.generateEmailContent(factura, tipo);

    // Enviar email
    await transporter.sendMail({
      from: `"Sistema de Facturas" <${process.env.GMAIL_USER}>`,
      to: destinatarios.join(', '),
      subject,
      html,
      text
    });

    console.log(`✅ Email enviado a: ${destinatarios.join(', ')}`);
  }

  /**
   * Obtiene los destinatarios de una factura
   */
  private obtenerDestinatarios(factura: Invoice): string[] {
    const emails: string[] = [];

    // Email del cliente
    if (factura.evento?.cliente?.email) {
      emails.push(factura.evento.cliente.email);
    }
    if (factura.evento?.cliente?.email_contacto) {
      emails.push(factura.evento.cliente.email_contacto);
    }

    // Email del responsable
    if (factura.evento?.responsable?.email) {
      emails.push(factura.evento.responsable.email);
    }

    // Eliminar duplicados
    return [...new Set(emails)].filter(email => email && email.includes('@'));
  }

  /**
   * Verifica si ya se envió una alerta
   */
  private async alertaYaEnviada(ingresoId: string, tipo: 'previa' | 'compromiso'): Promise<boolean> {
    const hoy = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('evt_alertas_enviadas')
      .select('id')
      .eq('ingreso_id', ingresoId)
      .eq('tipo_alerta', tipo)
      .gte('fecha_envio', hoy)
      .limit(1);

    if (error) return false;

    return (data?.length || 0) > 0;
  }

  /**
   * Obtiene la última alerta de vencida enviada
   */
  private async getUltimaAlertaVencida(ingresoId: string): Promise<InvoiceAlert | null> {
    const { data, error } = await supabase
      .from('evt_alertas_enviadas')
      .select('*')
      .eq('ingreso_id', ingresoId)
      .eq('tipo_alerta', 'vencida')
      .eq('estado', 'enviada')
      .order('fecha_envio', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;

    return data as InvoiceAlert;
  }

  /**
   * Registra una alerta enviada
   */
  private async registrarAlerta(
    ingresoId: string,
    tipo: 'previa' | 'compromiso' | 'vencida',
    destinatarios: string[],
    estado: 'enviada' | 'error',
    errorMensaje?: string
  ): Promise<void> {
    await supabase.from('evt_alertas_enviadas').insert([
      {
        ingreso_id: ingresoId,
        tipo_alerta: tipo,
        fecha_envio: new Date().toISOString(),
        destinatarios,
        estado,
        error_mensaje: errorMensaje || null
      }
    ]);
  }

  /**
   * Genera el contenido del email
   */
  generateEmailContent(factura: Invoice, tipo: 'previa' | 'compromiso' | 'vencida'): {
    subject: string;
    html: string;
    text: string;
  } {
    const diasRestantes = diasHastaVencimiento(new Date(factura.fecha_compromiso));
    const cliente = factura.evento?.cliente?.razon_social || 'Cliente';
    const proyecto = factura.evento?.nombre_proyecto || factura.evento?.clave_evento || 'Proyecto';
    
    let subject = '';
    let mensaje = '';

    switch (tipo) {
      case 'previa':
        subject = `🔔 Recordatorio: Factura próxima a vencer - ${proyecto}`;
        mensaje = `La factura vencerá en ${diasRestantes} días (${formatDateForDisplay(factura.fecha_compromiso)})`;
        break;
      case 'compromiso':
        subject = `⚠️ Factura vence HOY - ${proyecto}`;
        mensaje = `La factura vence el día de hoy (${formatDateForDisplay(factura.fecha_compromiso)})`;
        break;
      case 'vencida':
        subject = `🚨 Factura VENCIDA - ${proyecto}`;
        mensaje = `La factura está vencida desde hace ${Math.abs(diasRestantes)} días`;
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a8a; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #111827; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💼 Sistema de Gestión de Facturas</h1>
          </div>
          
          <div class="content">
            <h2>Estimado/a ${cliente},</h2>
            <p>${mensaje}</p>
            
            <div class="alert">
              <strong>⏰ Acción requerida:</strong> Por favor, proceda con el pago de la siguiente factura.
            </div>
            
            <div class="details">
              <h3>📋 Detalles de la Factura</h3>
              
              <div class="detail-row">
                <span class="label">Proyecto:</span>
                <span class="value">${proyecto}</span>
              </div>
              
              <div class="detail-row">
                <span class="label">UUID:</span>
                <span class="value">${factura.uuid_cfdi}</span>
              </div>
              
              ${factura.serie && factura.folio ? `
              <div class="detail-row">
                <span class="label">Serie - Folio:</span>
                <span class="value">${factura.serie}-${factura.folio}</span>
              </div>
              ` : ''}
              
              <div class="detail-row">
                <span class="label">Fecha de Emisión:</span>
                <span class="value">${formatDateForDisplay(factura.fecha_emision)}</span>
              </div>
              
              <div class="detail-row">
                <span class="label">Fecha de Vencimiento:</span>
                <span class="value">${formatDateForDisplay(factura.fecha_compromiso)}</span>
              </div>
              
              <div class="detail-row">
                <span class="label">Monto Total:</span>
                <span class="value" style="font-size: 20px; font-weight: bold; color: #1e3a8a;">
                  ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(factura.total)}
                </span>
              </div>
              
              ${factura.notas_cobro ? `
              <div class="detail-row">
                <span class="label">Notas:</span>
                <span class="value">${factura.notas_cobro}</span>
              </div>
              ` : ''}
            </div>
            
            <p>Si ya realizó el pago, por favor ignore este mensaje y notifíquenos para actualizar el estado.</p>
            
            <p>Para cualquier consulta, no dude en contactarnos.</p>
            
            <p>Saludos cordiales,<br><strong>Equipo de Facturación</strong></p>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del Sistema de Gestión de Facturas.</p>
            <p>Por favor, no responda a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
${subject}

Estimado/a ${cliente},

${mensaje}

DETALLES DE LA FACTURA:
- Proyecto: ${proyecto}
- UUID: ${factura.uuid_cfdi}
${factura.serie && factura.folio ? `- Serie - Folio: ${factura.serie}-${factura.folio}` : ''}
- Fecha de Emisión: ${formatDateForDisplay(factura.fecha_emision)}
- Fecha de Vencimiento: ${formatDateForDisplay(factura.fecha_compromiso)}
- Monto Total: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(factura.total)}
${factura.notas_cobro ? `- Notas: ${factura.notas_cobro}` : ''}

Si ya realizó el pago, por favor ignore este mensaje y notifíquenos para actualizar el estado.

Saludos cordiales,
Equipo de Facturación

---
Este es un mensaje automático. Por favor, no responda a este correo.
    `.trim();

    return { subject, html, text };
  }
}

export const alertService = AlertService.getInstance();
