/**
 * Script para generar datos de prueba REALISTAS con eventos mensuales
 * Fecha: 17 de Octubre 2025
 * 
 * Genera:
 * - 20 clientes
 * - 1 evento por mes por cliente (12 eventos por cliente en 2025)
 * - 10 ingresos por evento
 * - 10 gastos por evento
 * - Utilidad variable entre 15% y 30% por evento
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
  EVENTOS_POR_CLIENTE: 12, // 1 evento por mes en 2025
  INGRESOS_POR_EVENTO: 10,
  GASTOS_POR_EVENTO: 10,
  UTILIDAD_MIN: 0.15, // 15% mínimo
  UTILIDAD_MAX: 0.30, // 30% máximo
};

// Meses de 2025
const MESES_2025 = [
  { mes: 1, nombre: 'Enero' },
  { mes: 2, nombre: 'Febrero' },
  { mes: 3, nombre: 'Marzo' },
  { mes: 4, nombre: 'Abril' },
  { mes: 5, nombre: 'Mayo' },
  { mes: 6, nombre: 'Junio' },
  { mes: 7, nombre: 'Julio' },
  { mes: 8, nombre: 'Agosto' },
  { mes: 9, nombre: 'Septiembre' },
  { mes: 10, nombre: 'Octubre' },
  { mes: 11, nombre: 'Noviembre' },
  { mes: 12, nombre: 'Diciembre' },
];

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
  'Seguridad'
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
  detalles: unknown;
  timestamp: Date;
}> = [];

// Función para registrar errores
function registrarError(tipo: string, mensaje: string, detalles: unknown) {
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

// Generar utilidad aleatoria entre 15% y 30%
function generarUtilidadAleatoria(): number {
  return Math.random() * (TEST_CONFIG.UTILIDAD_MAX - TEST_CONFIG.UTILIDAD_MIN) + TEST_CONFIG.UTILIDAD_MIN;
}

// Generar cliente
async function generarCliente(index: number) {
  const nombre = faker.person.firstName();
  const apellido = faker.person.lastName();
  const razonSocial = `${nombre} ${apellido}`;
  const nombreComercial = `${nombre.split(' ')[0]} ${apellido.split(' ')[0]}`;
  
  const cliente = {
    razon_social: razonSocial,
    nombre_comercial: nombreComercial,
    rfc: generarRFC(),
    email: generarEmailUnico(nombre, apellido, index),
    telefono: faker.string.numeric(10),
    direccion_fiscal: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()} ${faker.location.zipCode('#####')}`,
    contacto_principal: nombreComercial,
    telefono_contacto: faker.string.numeric(10),
    email_contacto: generarEmailUnico(nombre, apellido, index),
    regimen_fiscal: '601',
    uso_cfdi: 'G03',
    metodo_pago: 'PUE',
    forma_pago: '01',
    activo: true,
    notas: `Cliente de prueba #${index} - Eventos mensuales en 2025`,
  };

  try {
    const { data, error } = await supabase
      .from('evt_clientes')
      .insert(cliente)
      .select()
      .single();

    if (error) throw error;
    
    log.success(`Cliente creado: ${cliente.razon_social}`);
    return data;
  } catch (error: unknown) {
    registrarError('CLIENTE', `Error al crear cliente ${cliente.razon_social}`, error);
    return null;
  }
}

// Generar evento mensual
async function generarEventoMensual(
  clienteId: string, 
  mes: number, 
  nombreMes: string,
  numeroEvento: number
) {
  // Fecha del evento en el mes correspondiente (día aleatorio entre 1 y 28)
  const dia = faker.number.int({ min: 1, max: 28 });
  const fechaEvento = `2025-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;

  const numInvitados = faker.number.int({ min: 50, max: 300 });
  const tipoEvento = TIPOS_EVENTOS[Math.floor(Math.random() * TIPOS_EVENTOS.length)];
  
  // Generar presupuesto base
  const presupuestoBase = faker.number.float({ min: 50000, max: 500000, multipleOf: 0.01 });
  
  const evento = {
    cliente_id: clienteId,
    tipo_evento: tipoEvento,
    fecha_evento: fechaEvento,
    hora_evento: `${faker.number.int({ min: 10, max: 22 })}:00`,
    lugar_evento: faker.location.streetAddress(),
    num_invitados: numInvitados,
    estado: ESTADOS_EVENTOS[Math.floor(Math.random() * ESTADOS_EVENTOS.length)],
    presupuesto_estimado: presupuestoBase,
    notas: `${tipoEvento} - ${nombreMes} 2025 - Evento #${numeroEvento}`,
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
  } catch (error: unknown) {
    registrarError('EVENTO', `Error al crear evento ${tipoEvento}`, error);
    return null;
  }
}

// Generar ingresos con margen de utilidad
async function generarIngresosConUtilidad(
  eventoId: string, 
  clienteId: string, 
  totalGastos: number,
  utilidadPorcentaje: number
) {
  // Calcular total de ingresos con la utilidad deseada
  // Si gastos = 100 y utilidad = 20%, entonces ingresos = 100 / 0.8 = 125
  const totalIngresos = totalGastos / (1 - utilidadPorcentaje);
  
  // Dividir el total en 10 ingresos de manera desigual (realista)
  const ingresos = [];
  let restante = totalIngresos;
  
  for (let i = 0; i < TEST_CONFIG.INGRESOS_POR_EVENTO; i++) {
    const esUltimo = i === TEST_CONFIG.INGRESOS_POR_EVENTO - 1;
    
    let monto: number;
    if (esUltimo) {
      // El último ingreso toma todo lo restante
      monto = restante;
    } else {
      // Ingresos variables: algunos grandes (anticipo), otros pequeños
      const porcentaje = Math.random() < 0.3 ? 
        faker.number.float({ min: 0.25, max: 0.35 }) : // 30% son anticipos grandes
        faker.number.float({ min: 0.03, max: 0.12 });   // 70% son pagos menores
      
      monto = Math.min(totalIngresos * porcentaje, restante * 0.9);
    }
    
    const iva = monto * 0.16;
    const total = monto + iva;
    restante -= monto;

    const ingreso = {
      evento_id: eventoId,
      cliente_id: clienteId,
      fecha: faker.date.between({
        from: new Date('2025-01-01'),
        to: new Date('2025-12-31')
      }).toISOString().split('T')[0],
      concepto: `Pago ${i + 1}/10 - ${faker.commerce.productName()}`,
      monto: Number(monto.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      forma_pago_sat: FORMAS_PAGO_SAT[Math.floor(Math.random() * FORMAS_PAGO_SAT.length)],
      metodo_pago_sat: METODOS_PAGO_SAT[Math.floor(Math.random() * METODOS_PAGO_SAT.length)],
      uso_cfdi: USOS_CFDI[Math.floor(Math.random() * USOS_CFDI.length)],
      facturado: faker.datatype.boolean(),
      notas: `Ingreso ${i + 1} de 10`,
    };

    try {
      const { data, error } = await supabase
        .from('ingresos')
        .insert(ingreso)
        .select()
        .single();

      if (error) throw error;
      ingresos.push(data);
    } catch (error: unknown) {
      registrarError('INGRESO', `Error al crear ingreso para evento ${eventoId}`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return ingresos;
}

// Generar gastos
async function generarGastos(eventoId: string) {
  const gastos = [];
  let totalGastos = 0;
  
  for (let i = 0; i < TEST_CONFIG.GASTOS_POR_EVENTO; i++) {
    const monto = faker.number.float({ min: 500, max: 15000, multipleOf: 0.01 });
    const iva = monto * 0.16;
    const total = monto + iva;
    totalGastos += monto;

    const gasto = {
      evento_id: eventoId,
      fecha: faker.date.recent({ days: 60 }).toISOString().split('T')[0],
      concepto: `Gasto ${i + 1}/10 - ${faker.commerce.product()}`,
      categoria: CATEGORIAS_GASTOS[Math.floor(Math.random() * CATEGORIAS_GASTOS.length)],
      monto: Number(monto.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      proveedor: faker.company.name(),
      forma_pago: ['Efectivo', 'Transferencia', 'Tarjeta'][Math.floor(Math.random() * 3)],
      tiene_factura: faker.datatype.boolean(),
      notas: `Gasto ${i + 1} de 10`,
    };

    try {
      const { data, error } = await supabase
        .from('gastos')
        .insert(gasto)
        .select()
        .single();

      if (error) throw error;
      gastos.push(data);
    } catch (error: unknown) {
      registrarError('GASTO', `Error al crear gasto para evento ${eventoId}`, error);
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { gastos, totalGastos };
}

// Función principal
async function ejecutarPruebasIntegrales() {
  console.log('\n');
  log.section('🧪 GENERADOR DE DATOS REALISTAS - EVENTOS MENSUALES');
  log.info(`Fecha: ${new Date().toLocaleString('es-MX')}`);
  log.info(`Configuración:`);
  log.info(`  • Usando clientes existentes`);
  log.info(`  • ${TEST_CONFIG.EVENTOS_POR_CLIENTE} eventos por cliente (1 por mes)`);
  log.info(`  • ${TEST_CONFIG.INGRESOS_POR_EVENTO} ingresos por evento`);
  log.info(`  • ${TEST_CONFIG.GASTOS_POR_EVENTO} gastos por evento`);
  log.info(`  • Utilidad: ${(TEST_CONFIG.UTILIDAD_MIN * 100).toFixed(0)}% - ${(TEST_CONFIG.UTILIDAD_MAX * 100).toFixed(0)}%`);
  console.log('\n');

  const estadisticas = {
    clientesUsados: 0,
    eventosCreados: 0,
    ingresosCreados: 0,
    gastosCreados: 0,
    totalIngresos: 0,
    totalGastos: 0,
    utilidadTotal: 0,
    utilidadPorEvento: [] as Array<{evento: string, gastos: number, ingresos: number, utilidad: number, porcentaje: number}>,
    erroresTotal: 0,
    tiempoInicio: Date.now(),
  };

  // Fase 1: Obtener clientes existentes
  log.section('📋 FASE 1: Obteniendo Clientes Existentes');
  
  try {
    const { data: clientesData, error } = await supabase
      .from('evt_clientes')
      .select('id, razon_social, nombre_comercial')
      .eq('activo', true)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    if (!clientesData || clientesData.length === 0) {
      log.error('No se encontraron clientes activos en la base de datos');
      log.warning('Por favor, crea algunos clientes primero o usa el seeder de clientes');
      return {
        estadisticas,
        errores: errorLog,
        tiempoTotal: '0s',
      };
    }

    const clientes = clientesData.map(c => ({
      id: c.id,
      nombre: c.nombre_comercial || c.razon_social
    }));

    estadisticas.clientesUsados = clientes.length;
    log.success(`${clientes.length} clientes encontrados en la base de datos`);
  } catch (error: unknown) {
    log.error('Error al obtener clientes de la base de datos');
    registrarError('CLIENTES', 'Error al consultar clientes existentes', error);
    return {
      estadisticas,
      errores: errorLog,
      tiempoTotal: '0s',
    };
  }

  // Fase 2: Crear eventos mensuales por cliente
  log.section('📅 FASE 2: Creando Eventos Mensuales (con Utilidad Variable)');

  // Obtener clientes de la consulta anterior (ya definido en el try-catch)
  const { data: clientesData } = await supabase
    .from('evt_clientes')
    .select('id, razon_social, nombre_comercial')
    .eq('activo', true)
    .order('created_at', { ascending: true });

  const clientes = (clientesData || []).map(c => ({
    id: c.id,
    nombre: c.nombre_comercial || c.razon_social
  }));

  for (const cliente of clientes) {
    log.info(`\n${colors.bright}Cliente: ${cliente.nombre}${colors.reset} (12 eventos mensuales)`);

    for (let mesIndex = 0; mesIndex < TEST_CONFIG.EVENTOS_POR_CLIENTE; mesIndex++) {
      const mesInfo = MESES_2025[mesIndex];
      
      // Crear evento
      const evento = await generarEventoMensual(
        cliente.id, 
        mesInfo.mes, 
        mesInfo.nombre,
        mesIndex + 1
      );
      
      if (evento) {
        estadisticas.eventosCreados++;
        
        // Generar utilidad aleatoria para este evento (entre 15% y 30%)
        const utilidadPorcentaje = generarUtilidadAleatoria();
        
        log.success(`  Evento ${mesIndex + 1}/12: ${evento.tipo_evento} - ${mesInfo.nombre} (Utilidad objetivo: ${(utilidadPorcentaje * 100).toFixed(1)}%)`);

        // Crear gastos primero para saber el total
        const { gastos, totalGastos } = await generarGastos(evento.id);
        estadisticas.gastosCreados += gastos.length;
        estadisticas.totalGastos += totalGastos;
        
        log.info(`    → 10 gastos creados (Total: $${totalGastos.toFixed(2)})`);

        // Crear ingresos con la utilidad deseada
        const ingresos = await generarIngresosConUtilidad(
          evento.id,
          cliente.id,
          totalGastos,
          utilidadPorcentaje
        );
        
        const totalIngresos = ingresos.reduce((sum, ing) => sum + ing.monto, 0);
        estadisticas.ingresosCreados += ingresos.length;
        estadisticas.totalIngresos += totalIngresos;
        
        const utilidadReal = totalIngresos - totalGastos;
        const utilidadPorcentajeReal = (utilidadReal / totalIngresos) * 100;
        estadisticas.utilidadTotal += utilidadReal;
        
        // Guardar estadísticas por evento
        estadisticas.utilidadPorEvento.push({
          evento: `${evento.tipo_evento} - ${mesInfo.nombre}`,
          gastos: totalGastos,
          ingresos: totalIngresos,
          utilidad: utilidadReal,
          porcentaje: utilidadPorcentajeReal
        });
        
        log.info(`    → 10 ingresos creados (Total: $${totalIngresos.toFixed(2)})`);
        log.success(`    → Utilidad: $${utilidadReal.toFixed(2)} (${utilidadPorcentajeReal.toFixed(2)}%)`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Calcular tiempo total
  const tiempoTotal = ((Date.now() - estadisticas.tiempoInicio) / 1000).toFixed(2);

  // Generar resumen
  log.section('📊 RESUMEN DE GENERACIÓN DE DATOS');
  
  const utilidadPromedio = (estadisticas.utilidadTotal / estadisticas.totalIngresos) * 100;
  
  console.log(`
${colors.bright}Estadísticas Finales:${colors.reset}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${colors.green}Registros Procesados:${colors.reset}
  ✓ Clientes Usados: ${estadisticas.clientesUsados}
  ✓ Eventos:       ${estadisticas.eventosCreados}
  ✓ Ingresos:      ${estadisticas.ingresosCreados}
  ✓ Gastos:        ${estadisticas.gastosCreados}

${colors.cyan}Resumen Financiero:${colors.reset}
  💰 Total Ingresos:   $${estadisticas.totalIngresos.toFixed(2)}
  💸 Total Gastos:     $${estadisticas.totalGastos.toFixed(2)}
  ✨ Utilidad Total:   $${estadisticas.utilidadTotal.toFixed(2)}
  📊 Utilidad Promedio: ${utilidadPromedio.toFixed(2)}%

${colors.yellow}Rango de Utilidad:${colors.reset}
  Mínima: ${Math.min(...estadisticas.utilidadPorEvento.map(e => e.porcentaje)).toFixed(2)}%
  Máxima: ${Math.max(...estadisticas.utilidadPorEvento.map(e => e.porcentaje)).toFixed(2)}%
  Objetivo: ${(TEST_CONFIG.UTILIDAD_MIN * 100).toFixed(0)}% - ${(TEST_CONFIG.UTILIDAD_MAX * 100).toFixed(0)}%

${colors.red}Errores:${colors.reset}
  ✗ Total: ${errorLog.length}

${colors.cyan}Tiempo:${colors.reset}
  ⏱ ${tiempoTotal} segundos
  `);

  // Mostrar algunos ejemplos de eventos con utilidad
  log.section('📈 EJEMPLOS DE UTILIDAD POR EVENTO (Primeros 5)');
  estadisticas.utilidadPorEvento.slice(0, 5).forEach((ev, i) => {
    console.log(`${i + 1}. ${ev.evento}`);
    console.log(`   Ingresos: $${ev.ingresos.toFixed(2)} | Gastos: $${ev.gastos.toFixed(2)}`);
    console.log(`   Utilidad: $${ev.utilidad.toFixed(2)} (${ev.porcentaje.toFixed(2)}%)`);
    console.log('');
  });

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
  }

  // Guardar reporte en archivo
  const reporte = {
    fecha: new Date().toISOString(),
    configuracion: TEST_CONFIG,
    estadisticas,
    utilidadPorEvento: estadisticas.utilidadPorEvento,
    tiempoTotal: `${tiempoTotal}s`,
    errores: errorLog,
  };

  const fs = await import('fs');
  const reportePath = './reports/test-data-monthly-events-report.json';
  
  try {
    if (!fs.existsSync('./reports')) {
      fs.mkdirSync('./reports', { recursive: true });
    }
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
