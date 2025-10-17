/**
 * 🎯 Script para Poblar Base de Datos de Supabase
 * 
 * Este script genera datos de ejemplo realistas para:
 * - Clientes (evt_clientes)
 * - Eventos (evt_eventos)
 * - Gastos (evt_finanzas)
 * - Ingresos (evt_ingresos)
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gomnouwackzvthpwyric.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvbW5vdXdhY2t6dnRocHd5cmljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTEwMjk4MywiZXhwIjoyMDc0Njc4OTgzfQ.prdLfUMwgzMctf9xdwnNyilAIpbP1vUiGFyvIbFecLU';

const supabase = createClient(supabaseUrl, supabaseKey);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📊 DATOS DE EJEMPLO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const clientesData = [
  {
    razon_social: 'CORPORATIVO AZTECA SA DE CV',
    nombre_comercial: 'Corporativo Azteca',
    rfc: 'CAZ850515XY8',
    email: 'contacto@corporativoazteca.com.mx',
    telefono: '5555-1234',
    direccion_fiscal: 'Av. Reforma 123, Col. Juárez, CDMX, CP 06600',
    contacto_principal: 'Juan Pérez Martínez',
    telefono_contacto: '5555-1235',
    email_contacto: 'jperez@corporativoazteca.com.mx',
    regimen_fiscal: '601',
    uso_cfdi: 'G03',
    metodo_pago: 'PUE',
    forma_pago: '03',
    dias_credito: 30,
    limite_credito: 500000,
    activo: true,
    notas: 'Cliente corporativo de alto volumen'
  },
  {
    razon_social: 'HOTEL EXCELLENCE SA DE CV',
    nombre_comercial: 'Hotel Excellence',
    rfc: 'HEX920320AB5',
    email: 'eventos@hotelexcellence.com',
    telefono: '5555-5678',
    direccion_fiscal: 'Blvd. Adolfo López Mateos 456, Álvaro Obregón, CDMX, CP 01000',
    contacto_principal: 'María González López',
    telefono_contacto: '5555-5679',
    email_contacto: 'mgonzalez@hotelexcellence.com',
    regimen_fiscal: '601',
    uso_cfdi: 'G03',
    metodo_pago: 'PPD',
    forma_pago: '04',
    dias_credito: 15,
    limite_credito: 300000,
    activo: true,
    notas: 'Especializado en eventos sociales'
  },
  {
    razon_social: 'EVENTOS Y BANQUETES DEL SUR SA DE CV',
    nombre_comercial: 'Eventos del Sur',
    rfc: 'EBS780910CD2',
    email: 'info@eventosdelsur.mx',
    telefono: '5555-9012',
    direccion_fiscal: 'Calz. de Tlalpan 789, Coyoacán, CDMX, CP 04000',
    contacto_principal: 'Roberto Sánchez Flores',
    telefono_contacto: '5555-9013',
    email_contacto: 'rsanchez@eventosdelsur.mx',
    regimen_fiscal: '601',
    uso_cfdi: 'G03',
    metodo_pago: 'PUE',
    forma_pago: '01',
    dias_credito: 0,
    limite_credito: 150000,
    activo: true,
    notas: 'Proveedor de servicios de banquetes'
  },
  {
    razon_social: 'CORPORATIVO INTERNACIONAL DE EVENTOS SA DE CV',
    nombre_comercial: 'CIE Eventos',
    rfc: 'CIE000525EF9',
    email: 'ventas@cieeventos.com',
    telefono: '5555-3456',
    direccion_fiscal: 'Av. Insurgentes Sur 1234, Benito Juárez, CDMX, CP 03900',
    contacto_principal: 'Ana Martínez Ruiz',
    telefono_contacto: '5555-3457',
    email_contacto: 'amartinez@cieeventos.com',
    regimen_fiscal: '601',
    uso_cfdi: 'G03',
    metodo_pago: 'PPD',
    forma_pago: '03',
    dias_credito: 45,
    limite_credito: 1000000,
    activo: true,
    notas: 'Cliente VIP - Eventos corporativos internacionales'
  },
  {
    razon_social: 'SALÓN JARDÍN PARAÍSO SA DE CV',
    nombre_comercial: 'Jardín Paraíso',
    rfc: 'SJP950815GH4',
    email: 'reservaciones@jardinparaiso.mx',
    telefono: '5555-7890',
    direccion_fiscal: 'Camino Real 567, Magdalena Contreras, CDMX, CP 10200',
    contacto_principal: 'Carlos Hernández Torres',
    telefono_contacto: '5555-7891',
    email_contacto: 'chernandez@jardinparaiso.mx',
    regimen_fiscal: '601',
    uso_cfdi: 'G03',
    metodo_pago: 'PUE',
    forma_pago: '28',
    dias_credito: 7,
    limite_credito: 75000,
    activo: true,
    notas: 'Especializado en bodas y XV años'
  }
];

// Función para generar eventos
const generarEventos = (clienteIds) => {
  const tiposEvento = [21, 22, 23, 24, 25]; // IDs de tipos de evento: Boda, XV Años, Corporativo, Social, Graduación
  const estados = [2, 3, 4, 5, 6, 7]; // IDs de estados: Acuerdo, OC, En Ejecución, Finalizado, Facturado, Pagado
  const nombres = [
    'Boda García-Martínez',
    'XV Años Sofía',
    'Congreso Anual de Ventas 2025',
    'Graduación MBA',
    'Convención Internacional',
    'Fiesta de Fin de Año Corporativo',
    'Presentación de Producto',
    'Cena de Gala Aniversario',
    'Conferencia de Tecnología',
    'Boda Rodríguez-López'
  ];

  return nombres.map((nombre, index) => {
    const fechaEvento = new Date(2025, Math.floor(Math.random() * 6) + 6, Math.floor(Math.random() * 28) + 1);
    const fechaFin = new Date(fechaEvento);
    fechaFin.setDate(fechaFin.getDate() + Math.floor(Math.random() * 3));
    
    const presupuesto = (Math.random() * 450000 + 50000).toFixed(2);
    const subtotal = parseFloat(presupuesto);
    const iva = (subtotal * 0.16).toFixed(2);
    const total = (subtotal + parseFloat(iva)).toFixed(2);
    
    return {
      clave_evento: `EVT-2025-${String(index + 100).padStart(3, '0')}`,
      nombre_proyecto: nombre,
      descripcion: `Evento social - ${nombre}`,
      cliente_id: clienteIds[Math.floor(Math.random() * clienteIds.length)],
      tipo_evento_id: tiposEvento[Math.floor(Math.random() * tiposEvento.length)],
      estado_id: estados[Math.floor(Math.random() * estados.length)],
      responsable_id: '00000000-0000-0000-0000-000000000001',
      fecha_evento: fechaEvento.toISOString().split('T')[0],
      fecha_fin: fechaFin.toISOString().split('T')[0],
      hora_inicio: '18:00:00',
      hora_fin: '23:00:00',
      lugar: 'Por definir',
      numero_invitados: Math.floor(Math.random() * 300) + 50,
      presupuesto_estimado: parseFloat(presupuesto),
      subtotal: subtotal,
      iva_porcentaje: 16,
      iva: parseFloat(iva),
      total: parseFloat(total),
      total_gastos: 0,
      utilidad: parseFloat(total),
      margen_utilidad: 100,
      status_facturacion: 'pendiente_facturar',
      status_pago: 'pendiente',
      prioridad: ['alta', 'media', 'baja'][Math.floor(Math.random() * 3)],
      fase_proyecto: ['cotizacion', 'confirmado', 'en_proceso'][Math.floor(Math.random() * 3)],
      notas: '',
      activo: true
    };
  });
};

// Función para generar gastos
const generarGastos = (eventoIds) => {
  const proveedores = [
    'BANQUETES LA TRADICIONAL',
    'DECORACIONES ELITE',
    'AUDIO Y LUCES PROFESIONALES',
    'FLORERÍA JARDÍN',
    'MOBILIARIO Y EVENTOS',
    'PASTELERÍA DELICIAS',
    'RENTA DE EQUIPO AV',
    'TRANSPORTES EJECUTIVOS',
    'SEGURIDAD PRIVADA',
    'FOTOGRAFÍA Y VIDEO PRO'
  ];

  const conceptos = [
    'Alimentos y Bebidas',
    'Decoración',
    'Sonido e Iluminación',
    'Flores y Arreglos',
    'Mobiliario',
    'Repostería',
    'Equipo Audiovisual',
    'Transporte',
    'Seguridad',
    'Fotografía y Video'
  ];

  const gastos = [];
  
  eventoIds.forEach(eventoId => {
    const numGastos = Math.floor(Math.random() * 5) + 3; // 3-7 gastos por evento
    
    for (let i = 0; i < numGastos; i++) {
      const proveedorIndex = Math.floor(Math.random() * proveedores.length);
      const total = (Math.random() * 45000 + 5000).toFixed(2);
      const subtotal = (parseFloat(total) / 1.16).toFixed(2);
      const iva = (parseFloat(total) - parseFloat(subtotal)).toFixed(2);
      
      // Generar detalle de compra
      const numItems = Math.floor(Math.random() * 5) + 1;
      const detalleCompra = [];
      
      for (let j = 0; j < numItems; j++) {
        const cantidad = Math.floor(Math.random() * 10) + 1;
        const precioUnitario = (Math.random() * 1000 + 100).toFixed(2);
        detalleCompra.push({
          descripcion: `${conceptos[proveedorIndex]} - Item ${j + 1}`,
          cantidad: cantidad,
          precio_unitario: parseFloat(precioUnitario),
          total: (cantidad * parseFloat(precioUnitario)).toFixed(2)
        });
      }
      
      gastos.push({
        evento_id: eventoId,
        fecha: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        proveedor: proveedores[proveedorIndex],
        rfc: `${proveedores[proveedorIndex].substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 900000 + 100000)}ABC`,
        concepto: conceptos[proveedorIndex],
        descripcion: `Servicio de ${conceptos[proveedorIndex].toLowerCase()} para el evento`,
        categoria_id: Math.floor(Math.random() * 10) + 1,
        subtotal: parseFloat(subtotal),
        iva: parseFloat(iva),
        total: parseFloat(total),
        metodo_pago: ['efectivo', 'transferencia', 'tarjeta_credito'][Math.floor(Math.random() * 3)],
        numero_factura: `FAC-${Math.floor(Math.random() * 90000 + 10000)}`,
        status_pago: ['pagado', 'pendiente', 'parcial'][Math.floor(Math.random() * 3)],
        fecha_pago: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        detalle_compra: detalleCompra,
        user_id: '00000000-0000-0000-0000-000000000001',
        archivo_url: null,
        notas: ''
      });
    }
  });
  
  return gastos;
};

// Función para generar ingresos
const generarIngresos = (eventoIds) => {
  const ingresos = [];
  
  eventoIds.forEach(eventoId => {
    const numPagos = Math.floor(Math.random() * 3) + 1; // 1-3 pagos por evento
    
    for (let i = 0; i < numPagos; i++) {
      const monto = (Math.random() * 100000 + 20000).toFixed(2);
      const subtotal = (parseFloat(monto) / 1.16).toFixed(2);
      const iva = (parseFloat(monto) - parseFloat(subtotal)).toFixed(2);
      
      ingresos.push({
        evento_id: eventoId,
        fecha: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        concepto: i === 0 ? 'Anticipo' : `Pago ${i}`,
        descripcion: `Pago ${i + 1} del evento`,
        subtotal: parseFloat(subtotal),
        iva: parseFloat(iva),
        total: parseFloat(monto),
        metodo_pago: ['transferencia', 'efectivo', 'tarjeta_credito'][Math.floor(Math.random() * 3)],
        referencia_pago: `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
        status: ['confirmado', 'pendiente'][Math.floor(Math.random() * 2)],
        fecha_confirmacion: new Date().toISOString().split('T')[0],
        user_id: '00000000-0000-0000-0000-000000000001',
        comprobante_url: null,
        notas: ''
      });
    }
  });
  
  return ingresos;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🚀 EJECUCIÓN PRINCIPAL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function poblarBaseDatos() {
  console.log('🚀 Iniciando población de base de datos...\n');
  
  try {
    // 1. INSERTAR CLIENTES
    console.log('👥 Insertando clientes...');
    const { data: clientes, error: errorClientes } = await supabase
      .from('evt_clientes')
      .insert(clientesData)
      .select();
    
    if (errorClientes) throw errorClientes;
    console.log(`✅ ${clientes.length} clientes insertados\n`);
    
    const clienteIds = clientes.map(c => c.id);
    
    // 2. INSERTAR EVENTOS
    console.log('📅 Insertando eventos...');
    const eventosData = generarEventos(clienteIds);
    const { data: eventos, error: errorEventos } = await supabase
      .from('evt_eventos')
      .insert(eventosData)
      .select();
    
    if (errorEventos) throw errorEventos;
    console.log(`✅ ${eventos.length} eventos insertados\n`);
    
    const eventoIds = eventos.map(e => e.id);
    
    // 3. INSERTAR GASTOS
    console.log('💰 Insertando gastos...');
    const gastosData = generarGastos(eventoIds);
    const { data: gastos, error: errorGastos } = await supabase
      .from('evt_finanzas')
      .insert(gastosData)
      .select();
    
    if (errorGastos) throw errorGastos;
    console.log(`✅ ${gastos.length} gastos insertados\n`);
    
    // 4. INSERTAR INGRESOS
    console.log('💵 Insertando ingresos...');
    const ingresosData = generarIngresos(eventoIds);
    const { data: ingresos, error: errorIngresos } = await supabase
      .from('evt_ingresos')
      .insert(ingresosData)
      .select();
    
    if (errorIngresos) throw errorIngresos;
    console.log(`✅ ${ingresos.length} ingresos insertados\n`);
    
    // 5. RESUMEN FINAL
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ BASE DE DATOS POBLADA EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📊 RESUMEN:');
    console.log(`  - Clientes:  ${clientes.length}`);
    console.log(`  - Eventos:   ${eventos.length}`);
    console.log(`  - Gastos:    ${gastos.length}`);
    console.log(`  - Ingresos:  ${ingresos.length}`);
    console.log('\n🎉 ¡Listo para usar!\n');
    
  } catch (error) {
    console.error('❌ Error al poblar base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar
poblarBaseDatos();
