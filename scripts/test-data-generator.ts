/**
 * Script para generar datos de prueba integral
 * Fecha: 17 de Octubre 2025
 * 
 * Genera:
 * - Clientes con datos completos
 * - 15-20 eventos por cliente
 * - 10 ingresos por cliente
 * - 50 gastos por cliente
 */

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker/locale/es_MX';

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración de pruebas
const TEST_CONFIG = {
  NUM_CLIENTES: 20,
  EVENTOS_MIN: 15,
  EVENTOS_MAX: 20,
  INGRESOS_POR_CLIENTE: 10,
  GASTOS_POR_CLIENTE: 50,
};

// Estados posibles para eventos
const ESTADOS_EVENTOS = [
  'pendiente',
  'confirmado',
  'en_preparacion',
  'en_curso',
  'finalizado',
  'cancelado'
];

// Tipos de eventos
const TIPOS_EVENTOS = [
  'Boda',
  'XV Años',
  'Bautizo',
  'Primera Comunión',
  'Graduación',
  'Cumpleaños Adulto',
  'Baby Shower',
  'Despedida de Soltera/o',
  'Aniversario',
  'Reunión Familiar'
];

// Categorías de gastos
const CATEGORIAS_GASTOS = [
  'Alimentos y Bebidas',
  'Decoración',
  'Mobiliario',
  'Personal',
  'Transporte',
  'Marketing',
  'Servicios Profesionales',
  'Mantenimiento',
  'Limpieza',
  'Seguridad',
  'Tecnología',
  'Papelería',
  'Otros'
];

// Formas de pago SAT
const FORMAS_PAGO_SAT = ['01', '02', '03', '04', '28', '99'];

// Métodos de pago SAT
const METODOS_PAGO_SAT = ['PUE', 'PPD'];

// Uso CFDI
const USOS_CFDI = ['G01', 'G03', 'P01'];

// Colores para logging
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Utilidades
const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg: string) => console.log(`\n${colors.cyan}${colors.bright}═══ ${msg} ═══${colors.reset}\n`),
};

// Contador de errores
const errorLog: Array<{
  tipo: string;
  mensaje: string;
  detalles: any;
  timestamp: Date;
}> = [];

// Función para registrar errores
function registrarError(tipo: string, mensaje: string, detalles: any) {
  errorLog.push({
    tipo,
    mensaje,
    detalles,
    timestamp: new Date()
  });
  log.error(`${tipo}: ${mensaje}`);
}

// Generar RFC válido
function generarRFC(): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  
  let rfc = '';
  for (let i = 0; i < 4; i++) {
    rfc += letras.charAt(Math.floor(Math.random() * letras.length));
  }
  for (let i = 0; i < 6; i++) {
    rfc += numeros.charAt(Math.floor(Math.random() * numeros.length));
  }
  for (let i = 0; i < 3; i++) {
    rfc += letras.charAt(Math.floor(Math.random() * letras.length));
  }
  
  return rfc;
}

// Generar email único
function generarEmailUnico(nombre: string, apellido: string, index: number): string {
  const nombreLimpio = nombre.toLowerCase().replace(/\s+/g, '');
  const apellidoLimpio = apellido.toLowerCase().replace(/\s+/g, '');
  return `${nombreLimpio}.${apellidoLimpio}.${index}@test-erp.local`;
}

// Generar cliente
async function generarCliente(index: number) {
  const nombre = faker.person.firstName();
  const apellido = faker.person.lastName();
  const nombreCorto = `${nombre.split(' ')[0]} ${apellido.split(' ')[0]}`;
  
  const cliente = {
    nombre: `${nombre} ${apellido}`,
    nombre_corto: nombreCorto,
    email: generarEmailUnico(nombre, apellido, index),
    telefono: faker.phone.number('##########'),
    rfc: generarRFC(),
    direccion: faker.location.streetAddress(),
    ciudad: faker.location.city(),
    estado: faker.location.state(),
    codigo_postal: faker.location.zipCode('#####'),
    notas: `Cliente de prueba #${index} generado automáticamente`,
  };

  try {
    const { data, error } = await supabase
      .from('evt_clientes')
      .insert(cliente)
      .select()
      .single();

    if (error) throw error;
    
    log.success(`Cliente creado: ${cliente.nombre}`);
    return data;
  } catch (error: any) {
    registrarError('CLIENTE', `Error al crear cliente ${cliente.nombre}`, error);
    return null;
  }
}

// Generar evento
async function generarEvento(clienteId: string, numeroEvento: number) {
  const fechaEvento = faker.date.between({
    from: new Date('2025-01-01'),
    to: new Date('2025-12-31')
  });

  const numInvitados = faker.number.int({ min: 50, max: 300 });
  const tipoEvento = TIPOS_EVENTOS[Math.floor(Math.random() * TIPOS_EVENTOS.length)];
  
  const evento = {
    cliente_id: clienteId,
    tipo_evento: tipoEvento,
    fecha_evento: fechaEvento.toISOString().split('T')[0],
    hora_evento: `${faker.number.int({ min: 10, max: 22 })}:00`,
    lugar_evento: faker.location.streetAddress(),
    num_invitados: numInvitados,
    estado: ESTADOS_EVENTOS[Math.floor(Math.random() * ESTADOS_EVENTOS.length)],
    presupuesto_estimado: faker.number.float({ min: 50000, max: 500000, precision: 0.01 }),
    notas: `${tipoEvento} - Evento de prueba #${numeroEvento}`,
    requiere_factura: faker.datatype.boolean(),
  };

  try {
    const { data, error } = await supabase
      .from('eventos')
      .insert(evento)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error: any) {
    registrarError('EVENTO', `Error al crear evento ${tipoEvento}`, error);
    return null;
  }
}

// Generar ingreso
async function generarIngreso(eventoId: string, clienteId: string, numeroIngreso: number) {
  const monto = faker.number.float({ min: 5000, max: 100000, precision: 0.01 });
  const iva = monto * 0.16;
  const total = monto + iva;

  const ingreso = {
    evento_id: eventoId,
    cliente_id: clienteId,
    fecha: faker.date.recent({ days: 30 }).toISOString().split('T')[0],
    concepto: `Pago ${numeroIngreso} - ${faker.commerce.productName()}`,
    monto: monto,
    iva: iva,
    total: total,
    forma_pago_sat: FORMAS_PAGO_SAT[Math.floor(Math.random() * FORMAS_PAGO_SAT.length)],
    metodo_pago_sat: METODOS_PAGO_SAT[Math.floor(Math.random() * METODOS_PAGO_SAT.length)],
    uso_cfdi: USOS_CFDI[Math.floor(Math.random() * USOS_CFDI.length)],
    facturado: faker.datatype.boolean(),
    notas: `Ingreso de prueba #${numeroIngreso}`,
  };

  try {
    const { data, error } = await supabase
      .from('ingresos')
      .insert(ingreso)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error: any) {
    registrarError('INGRESO', `Error al crear ingreso para evento ${eventoId}`, error);
    return null;
  }
}

// Generar gasto
async function generarGasto(eventoId: string, numeroGasto: number) {
  const monto = faker.number.float({ min: 100, max: 10000, precision: 0.01 });
  const iva = monto * 0.16;
  const total = monto + iva;

  const gasto = {
    evento_id: eventoId,
    fecha: faker.date.recent({ days: 60 }).toISOString().split('T')[0],
    concepto: `Gasto ${numeroGasto} - ${faker.commerce.product()}`,
    categoria: CATEGORIAS_GASTOS[Math.floor(Math.random() * CATEGORIAS_GASTOS.length)],
    monto: monto,
    iva: iva,
    total: total,
    proveedor: faker.company.name(),
    forma_pago: ['Efectivo', 'Transferencia', 'Tarjeta'][Math.floor(Math.random() * 3)],
    tiene_factura: faker.datatype.boolean(),
    notas: `Gasto de prueba #${numeroGasto}`,
  };

  try {
    const { data, error } = await supabase
      .from('gastos')
      .insert(gasto)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error: any) {
    registrarError('GASTO', `Error al crear gasto para evento ${eventoId}`, error);
    return null;
  }
}

// Función principal
async function ejecutarPruebasIntegrales() {
  console.log('\n');
  log.section('🧪 GENERADOR DE DATOS DE PRUEBA INTEGRAL');
  log.info(`Fecha: ${new Date().toLocaleString('es-MX')}`);
  log.info(`Configuración: ${TEST_CONFIG.NUM_CLIENTES} clientes, ${TEST_CONFIG.EVENTOS_MIN}-${TEST_CONFIG.EVENTOS_MAX} eventos c/u`);
  console.log('\n');

  const estadisticas = {
    clientesCreados: 0,
    eventosCreados: 0,
    ingresosCreados: 0,
    gastosCreados: 0,
    erroresTotal: 0,
    tiempoInicio: Date.now(),
  };

  // Fase 1: Crear clientes
  log.section('📋 FASE 1: Creando Clientes');
  const clientes: any[] = [];
  
  for (let i = 1; i <= TEST_CONFIG.NUM_CLIENTES; i++) {
    log.info(`Creando cliente ${i}/${TEST_CONFIG.NUM_CLIENTES}...`);
    const cliente = await generarCliente(i);
    if (cliente) {
      clientes.push(cliente);
      estadisticas.clientesCreados++;
    }
    
    // Pequeña pausa para no sobrecargar la BD
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log.success(`${estadisticas.clientesCreados} clientes creados correctamente`);

  // Fase 2: Crear eventos, ingresos y gastos por cliente
  log.section('📅 FASE 2: Creando Eventos, Ingresos y Gastos');

  for (const cliente of clientes) {
    const numEventos = faker.number.int({ 
      min: TEST_CONFIG.EVENTOS_MIN, 
      max: TEST_CONFIG.EVENTOS_MAX 
    });

    log.info(`\n${colors.bright}Cliente: ${cliente.nombre}${colors.reset} (${numEventos} eventos)`);

    for (let e = 1; e <= numEventos; e++) {
      // Crear evento
      const evento = await generarEvento(cliente.id, e);
      
      if (evento) {
        estadisticas.eventosCreados++;
        log.success(`  Evento ${e}/${numEventos}: ${evento.tipo_evento}`);

        // Crear ingresos para el evento
        for (let i = 1; i <= TEST_CONFIG.INGRESOS_POR_CLIENTE; i++) {
          const ingreso = await generarIngreso(evento.id, cliente.id, i);
          if (ingreso) {
            estadisticas.ingresosCreados++;
          }
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        log.info(`    → ${TEST_CONFIG.INGRESOS_POR_CLIENTE} ingresos creados`);

        // Crear gastos para el evento
        for (let g = 1; g <= TEST_CONFIG.GASTOS_POR_CLIENTE; g++) {
          const gasto = await generarGasto(evento.id, g);
          if (gasto) {
            estadisticas.gastosCreados++;
          }
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        log.info(`    → ${TEST_CONFIG.GASTOS_POR_CLIENTE} gastos creados`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Calcular tiempo total
  const tiempoTotal = ((Date.now() - estadisticas.tiempoInicio) / 1000).toFixed(2);

  // Generar resumen
  log.section('📊 RESUMEN DE GENERACIÓN DE DATOS');
  
  console.log(`
${colors.bright}Estadísticas Finales:${colors.reset}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${colors.green}✓ Clientes creados:${colors.reset}     ${estadisticas.clientesCreados}
${colors.green}✓ Eventos creados:${colors.reset}      ${estadisticas.eventosCreados}
${colors.green}✓ Ingresos creados:${colors.reset}     ${estadisticas.ingresosCreados}
${colors.green}✓ Gastos creados:${colors.reset}       ${estadisticas.gastosCreados}
${colors.red}✗ Errores detectados:${colors.reset}   ${errorLog.length}

${colors.cyan}⏱ Tiempo total:${colors.reset}         ${tiempoTotal} segundos
  `);

  // Mostrar errores si los hay
  if (errorLog.length > 0) {
    log.section('⚠️  ERRORES DETECTADOS');
    
    const erroresPorTipo = errorLog.reduce((acc, err) => {
      acc[err.tipo] = (acc[err.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Resumen de errores por tipo:\n');
    Object.entries(erroresPorTipo).forEach(([tipo, cantidad]) => {
      console.log(`  ${colors.red}●${colors.reset} ${tipo}: ${cantidad} errores`);
    });

    console.log('\nPrimeros 10 errores:\n');
    errorLog.slice(0, 10).forEach((err, i) => {
      console.log(`${colors.red}${i + 1}.${colors.reset} [${err.tipo}] ${err.mensaje}`);
      console.log(`   ${colors.yellow}→${colors.reset} ${err.detalles.message || JSON.stringify(err.detalles)}\n`);
    });
  }

  // Guardar reporte en archivo
  const reporte = {
    fecha: new Date().toISOString(),
    configuracion: TEST_CONFIG,
    estadisticas,
    tiempoTotal: `${tiempoTotal}s`,
    errores: errorLog,
  };

  const fs = await import('fs');
  const reportePath = './reports/test-data-generation-report.json';
  
  try {
    fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));
    log.success(`Reporte guardado en: ${reportePath}`);
  } catch (error) {
    log.error(`Error al guardar reporte: ${error}`);
  }

  log.section('✅ PROCESO COMPLETADO');
  
  return {
    estadisticas,
    errores: errorLog,
    tiempoTotal,
  };
}

// Ejecutar
ejecutarPruebasIntegrales()
  .then(() => {
    log.success('Script finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    log.error(`Error fatal: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
