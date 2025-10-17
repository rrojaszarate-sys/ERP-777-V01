/**
 * 🎯 GENERADOR DE EVENTOS MENSUALES CON UTILIDAD VARIABLE
 * =======================================================
 * Fecha: 17 de Octubre 2025
 * 
 * Características:
 * - Usa CLIENTES EXISTENTES de la base de datos
 * - Genera 1 EVENTO POR MES por cliente (12 eventos en 2025)
 * - 10 INGRESOS por evento
 * - 10 GASTOS por evento  
 * - UTILIDAD VARIABLE entre 15% y 30% por evento
 * - Usa las tablas correctas: evt_eventos, evt_ingresos, evt_gastos
 */

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

// Configuración
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const CONFIG = {
  MESES_2025: 12, // 1 evento por mes
  INGRESOS_POR_EVENTO: 10,
  GASTOS_POR_EVENTO: 10,
  UTILIDAD_MIN: 0.15, // 15%
  UTILIDAD_MAX: 0.30, // 30%
};

// Tipos de eventos (IDs reales de la base de datos)
const TIPOS_EVENTO = [21, 22, 23, 24, 25]; // Boda, XV Años, Corporativo, Social, Graduación
const ESTADOS = [1, 2, 3, 4, 5, 6, 7]; // IDs de estados reales
const CATEGORIAS_GASTOS = [6, 7, 8, 9, 10]; // SPs, RH, Materiales, Combustible, Provisiones

// Colores para logging
const log = {
  info: (msg: string) => console.log(`\x1b[34mℹ\x1b[0m ${msg}`),
  success: (msg: string) => console.log(`\x1b[32m✓\x1b[0m ${msg}`),
  error: (msg: string) => console.log(`\x1b[31m✗\x1b[0m ${msg}`),
  section: (msg: string) => console.log(`\n\x1b[36m\x1b[1m═══ ${msg} ═══\x1b[0m\n`),
};

// Estadísticas
const stats = {
  clientes: 0,
  eventos: 0,
  ingresos: 0,
  gastos: 0,
  totalIngresos: 0,
  totalGastos: 0,
  errores: 0,
  utilidadPorEvento: [] as Array<{
    cliente: string;
    mes: string;
    ingresos: number;
    gastos: number;
    utilidad: number;
    porcentaje: number;
  }>,
};

/**
 * Genera una utilidad aleatoria entre 15% y 30%
 */
function generarUtilidadAleatoria(): number {
  return Math.random() * (CONFIG.UTILIDAD_MAX - CONFIG.UTILIDAD_MIN) + CONFIG.UTILIDAD_MIN;
}

/**
 * Obtiene clientes activos de la base de datos
 */
async function obtenerClientes() {
  const { data, error } = await supabase
    .from('evt_clientes')
    .select('id, razon_social, nombre_comercial, sufijo')
    .eq('activo', true)
    .order('created_at');

  if (error) throw error;
  return data || [];
}

/**
 * Genera una clave única para el evento basada en el sufijo del cliente
 */
async function generarClaveEvento(clienteId: number, sufijo: string): Promise<string> {
  const year = new Date().getFullYear();
  const sufijoUpper = (sufijo || 'EVT').toUpperCase();

  // Contar eventos con el mismo sufijo y año
  const { count } = await supabase
    .from('evt_eventos')
    .select('*', { count: 'exact', head: true })
    .like('clave_evento', `${sufijoUpper}${year}-%`);

  const nextNumber = (count || 0) + 1;
  return `${sufijoUpper}${year}-${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Crea un evento mensual
 */
async function crearEvento(
  clienteId: number,
  mes: number,
  nombreCliente: string,
  sufijo: string
) {
  const fecha = `2025-${mes.toString().padStart(2, '0')}-15`;
  
  // Generar clave única
  const clave_evento = await generarClaveEvento(clienteId, sufijo);
  
  const eventoData = {
    clave_evento,
    cliente_id: clienteId,
    nombre_proyecto: `Evento ${nombreCliente} - ${getMesNombre(mes)} 2025`,
    descripcion: `Evento mensual generado automáticamente`,
    tipo_evento_id: TIPOS_EVENTO[Math.floor(Math.random() * TIPOS_EVENTO.length)],
    estado_id: ESTADOS[Math.floor(Math.random() * ESTADOS.length)],
    fecha_evento: fecha,
    presupuesto_estimado: faker.number.float({ min: 50000, max: 500000, multipleOf: 100 }),
    activo: true,
  };

  const { data, error } = await supabase
    .from('evt_eventos')
    .insert(eventoData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Crea gastos para un evento
 */
async function crearGastos(eventoId: number) {
  const gastos = [];
  let totalGastos = 0;

  for (let i = 0; i < CONFIG.GASTOS_POR_EVENTO; i++) {
    const subtotal = faker.number.float({ min: 1000, max: 15000, multipleOf: 0.01 });
    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    totalGastos += subtotal;

    const gastoData = {
      evento_id: eventoId,
      categoria_id: CATEGORIAS_GASTOS[Math.floor(Math.random() * CATEGORIAS_GASTOS.length)],
      concepto: `Gasto ${i + 1}/10 - ${faker.commerce.productName()}`,
      cantidad: 1,
      precio_unitario: subtotal,
      subtotal: subtotal,
      iva_porcentaje: 16,
      iva: iva,
      total: total,
      fecha_gasto: `2025-${faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0')}-${faker.number.int({ min: 1, max: 28 }).toString().padStart(2, '0')}`,
      proveedor: faker.company.name(),
      activo: true,
    };

    gastos.push(gastoData);
  }

  const { data, error } = await supabase
    .from('evt_gastos')
    .insert(gastos)
    .select();

  if (error) throw error;

  return { gastos: data || [], totalGastos };
}

/**
 * Crea ingresos con utilidad deseada
 */
async function crearIngresos(
  eventoId: number,
  totalGastos: number,
  utilidadDeseada: number
) {
  // Calcular total de ingresos necesario para obtener la utilidad deseada
  // Utilidad = Ingresos - Gastos
  // Utilidad% = (Ingresos - Gastos) / Ingresos
  // Entonces: Ingresos = Gastos / (1 - Utilidad%)
  const totalIngresos = totalGastos / (1 - utilidadDeseada);

  const ingresos = [];
  let restante = totalIngresos;

  for (let i = 0; i < CONFIG.INGRESOS_POR_EVENTO; i++) {
    const esUltimo = i === CONFIG.INGRESOS_POR_EVENTO - 1;

    let subtotal: number;
    if (esUltimo) {
      subtotal = restante;
    } else {
      // Distribuir de manera variable (algunos ingresos grandes, otros pequeños)
      const porcentaje = Math.random() < 0.3 
        ? faker.number.float({ min: 0.20, max: 0.30 }) // 30% son anticipos grandes
        : faker.number.float({ min: 0.05, max: 0.15 }); // 70% son pagos menores

      subtotal = Math.min(totalIngresos * porcentaje, restante * 0.9);
    }

    const iva = subtotal * 0.16;
    const total = subtotal + iva;
    restante -= subtotal;

    const ingresoData = {
      evento_id: eventoId,
      concepto: `Pago ${i + 1}/10 - ${faker.commerce.productName()}`,
      cantidad: 1,
      precio_unitario: subtotal,
      subtotal: subtotal,
      iva_porcentaje: 16,
      iva: iva,
      total: total,
      fecha_ingreso: `2025-${faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0')}-${faker.number.int({ min: 1, max: 28 }).toString().padStart(2, '0')}`,
      facturado: faker.datatype.boolean(),
      cobrado: faker.datatype.boolean(),
      activo: true,
    };

    ingresos.push(ingresoData);
  }

  const { data, error } = await supabase
    .from('evt_ingresos')
    .insert(ingresos)
    .select();

  if (error) throw error;

  return {
    ingresos: data || [],
    totalIngresos: ingresos.reduce((sum, ing) => sum + ing.subtotal, 0),
  };
}

/**
 * Obtiene el nombre del mes
 */
function getMesNombre(mes: number): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mes - 1];
}

/**
 * Función principal
 */
async function main() {
  const tiempoInicio = Date.now();

  log.section('🎯 GENERADOR DE EVENTOS MENSUALES CON UTILIDAD VARIABLE');
  log.info(`Fecha: ${new Date().toLocaleString('es-MX')}`);
  log.info(`Configuración:`);
  log.info(`  • Clientes: Usando existentes`);
  log.info(`  • Eventos: 12 por cliente (1 por mes en 2025)`);
  log.info(`  • Ingresos: ${CONFIG.INGRESOS_POR_EVENTO} por evento`);
  log.info(`  • Gastos: ${CONFIG.GASTOS_POR_EVENTO} por evento`);
  log.info(`  • Utilidad objetivo: ${(CONFIG.UTILIDAD_MIN * 100).toFixed(0)}% - ${(CONFIG.UTILIDAD_MAX * 100).toFixed(0)}%`);

  try {
    // 1. Obtener clientes
    log.section('📋 FASE 1: Obteniendo Clientes');
    const clientes = await obtenerClientes();
    stats.clientes = clientes.length;
    log.success(`${clientes.length} clientes encontrados`);

    if (clientes.length === 0) {
      log.error('No hay clientes activos. Por favor, crea algunos clientes primero.');
      process.exit(1);
    }

    // 2. Crear eventos por mes
    log.section('📅 FASE 2: Generando Eventos Mensuales');

    for (const cliente of clientes) {
      const nombreCliente = cliente.nombre_comercial || cliente.razon_social;
      log.info(`\nCliente: ${nombreCliente} (${CONFIG.MESES_2025} eventos)`);

      for (let mes = 1; mes <= CONFIG.MESES_2025; mes++) {
        try {
          // Crear evento
          const evento = await crearEvento(cliente.id, mes, nombreCliente, cliente.sufijo || 'EVT');
          stats.eventos++;

          // Generar utilidad aleatoria para este evento
          const utilidadDeseada = generarUtilidadAleatoria();

          // Crear gastos
          const { gastos, totalGastos } = await crearGastos(evento.id);
          stats.gastos += gastos.length;
          stats.totalGastos += totalGastos;

          // Crear ingresos con utilidad deseada
          const { ingresos, totalIngresos } = await crearIngresos(
            evento.id,
            totalGastos,
            utilidadDeseada
          );
          stats.ingresos += ingresos.length;
          stats.totalIngresos += totalIngresos;

          // Calcular utilidad real
          const utilidadReal = totalIngresos - totalGastos;
          const utilidadPorcentaje = (utilidadReal / totalIngresos) * 100;

          stats.utilidadPorEvento.push({
            cliente: nombreCliente,
            mes: getMesNombre(mes),
            ingresos: totalIngresos,
            gastos: totalGastos,
            utilidad: utilidadReal,
            porcentaje: utilidadPorcentaje,
          });

          log.success(
            `  ${getMesNombre(mes)}: $${totalIngresos.toFixed(2)} - $${totalGastos.toFixed(2)} = $${utilidadReal.toFixed(2)} (${utilidadPorcentaje.toFixed(1)}%)`
          );

          // Pequeña pausa para no saturar la base de datos
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          stats.errores++;
          const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
          log.error(`  Error en ${getMesNombre(mes)}: ${errorMsg}`);
        }
      }
    }

    // 3. Resumen
    log.section('📊 RESUMEN FINAL');

    const utilidadTotal = stats.totalIngresos - stats.totalGastos;
    const utilidadPromedio = (utilidadTotal / stats.totalIngresos) * 100;

    console.log(`
Registros Creados:
  ✓ Clientes procesados: ${stats.clientes}
  ✓ Eventos creados:     ${stats.eventos}
  ✓ Ingresos creados:    ${stats.ingresos}
  ✓ Gastos creados:      ${stats.gastos}

Resumen Financiero:
  💰 Total Ingresos:     $${stats.totalIngresos.toFixed(2)}
  💸 Total Gastos:       $${stats.totalGastos.toFixed(2)}
  ✨ Utilidad Total:     $${utilidadTotal.toFixed(2)}
  📊 Utilidad Promedio:  ${utilidadPromedio.toFixed(2)}%

Rango de Utilidad:
  Mínima:  ${Math.min(...stats.utilidadPorEvento.map(e => e.porcentaje)).toFixed(2)}%
  Máxima:  ${Math.max(...stats.utilidadPorEvento.map(e => e.porcentaje)).toFixed(2)}%
  Objetivo: ${(CONFIG.UTILIDAD_MIN * 100).toFixed(0)}% - ${(CONFIG.UTILIDAD_MAX * 100).toFixed(0)}%

Errores: ${stats.errores}
Tiempo: ${((Date.now() - tiempoInicio) / 1000).toFixed(2)}s
    `);

    // Mostrar ejemplos
    log.section('📈 EJEMPLOS DE UTILIDAD (Primeros 5)');
    stats.utilidadPorEvento.slice(0, 5).forEach((ev, i) => {
      console.log(`${i + 1}. ${ev.cliente} - ${ev.mes}`);
      console.log(`   Ingresos: $${ev.ingresos.toFixed(2)} | Gastos: $${ev.gastos.toFixed(2)}`);
      console.log(`   Utilidad: $${ev.utilidad.toFixed(2)} (${ev.porcentaje.toFixed(2)}%)\n`);
    });

    log.success('✅ Proceso completado exitosamente');
    process.exit(0);
  } catch (error) {
    log.error(`Error fatal: ${error}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
main();
