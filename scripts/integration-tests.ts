/**
 * Script de Pruebas Funcionales Integrales
 * Fecha: 17 de Octubre 2025
 * 
 * Ejecuta pruebas completas del sistema y genera reporte detallado
 */

import { createClient } from '@supabase/supabase-js';

// Configuración
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
  nombre: string;
  descripcion: string;
  resultado: 'PASS' | 'FAIL' | 'WARNING';
  detalles: string;
  tiempo: number;
  error?: unknown;
}

interface TestSuite {
  nombre: string;
  pruebas: TestResult[];
  tiempoTotal: number;
}

const resultados: TestSuite[] = [];

// Colores
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  suite: (msg: string) => console.log(`\n${c.cyan}${c.bright}▶ ${msg}${c.reset}`),
  test: (msg: string) => console.log(`  ${c.blue}○${c.reset} ${msg}`),
  pass: (msg: string) => console.log(`  ${c.green}✓${c.reset} ${msg}`),
  fail: (msg: string) => console.log(`  ${c.red}✗${c.reset} ${msg}`),
  warn: (msg: string) => console.log(`  ${c.yellow}⚠${c.reset} ${msg}`),
  info: (msg: string) => console.log(`  ${c.blue}ℹ${c.reset} ${msg}`),
};

// Ejecutar prueba individual
async function ejecutarPrueba(
  nombre: string,
  descripcion: string,
  fn: () => Promise<{ resultado: 'PASS' | 'FAIL' | 'WARNING'; detalles: string }>
): Promise<TestResult> {
  const inicio = Date.now();
  log.test(nombre);

  try {
    const { resultado, detalles } = await fn();
    const tiempo = Date.now() - inicio;

    if (resultado === 'PASS') {
      log.pass(`${nombre} - ${detalles} (${tiempo}ms)`);
    } else if (resultado === 'WARNING') {
      log.warn(`${nombre} - ${detalles} (${tiempo}ms)`);
    } else {
      log.fail(`${nombre} - ${detalles} (${tiempo}ms)`);
    }

    return { nombre, descripcion, resultado, detalles, tiempo };
  } catch (error) {
    const tiempo = Date.now() - inicio;
    log.fail(`${nombre} - ERROR: ${error}`);
    
    return {
      nombre,
      descripcion,
      resultado: 'FAIL',
      detalles: `Error: ${error}`,
      tiempo,
      error,
    };
  }
}

// ============================================================================
// SUITE 1: VERIFICACIÓN DE DATOS
// ============================================================================

async function suiteVerificacionDatos(): Promise<TestSuite> {
  log.suite('SUITE 1: Verificación de Datos');
  const pruebas: TestResult[] = [];
  const inicioSuite = Date.now();

  // Prueba 1.1: Verificar clientes
  pruebas.push(await ejecutarPrueba(
    'Verificar clientes cargados',
    'Verifica que existan al menos 20 clientes en la BD',
    async () => {
      const { data, error, count } = await supabase
        .from('evt_clientes')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      
      if (count && count >= 20) {
        return { resultado: 'PASS', detalles: `${count} clientes encontrados` };
      } else {
        return { resultado: 'FAIL', detalles: `Solo ${count} clientes encontrados (esperados: ≥20)` };
      }
    }
  ));

  // Prueba 1.2: Verificar eventos
  pruebas.push(await ejecutarPrueba(
    'Verificar eventos por cliente',
    'Verifica que cada cliente tenga entre 15-20 eventos',
    async () => {
      const { data: clientes } = await supabase
        .from('evt_clientes')
        .select('id');

      if (!clientes || clientes.length === 0) {
        return { resultado: 'FAIL', detalles: 'No se encontraron clientes' };
      }

      let clientesFueraRango = 0;
      let totalEventos = 0;

      for (const cliente of clientes) {
        const { count } = await supabase
          .from('eventos')
          .select('*', { count: 'exact', head: true })
          .eq('cliente_id', cliente.id);

        if (count) {
          totalEventos += count;
          if (count < 15 || count > 20) {
            clientesFueraRango++;
          }
        }
      }

      if (clientesFueraRango === 0) {
        return { 
          resultado: 'PASS', 
          detalles: `Todos los clientes (${clientes.length}) tienen 15-20 eventos. Total: ${totalEventos}` 
        };
      } else {
        return { 
          resultado: 'WARNING', 
          detalles: `${clientesFueraRango} clientes fuera del rango 15-20 eventos` 
        };
      }
    }
  ));

  // Prueba 1.3: Verificar ingresos
  pruebas.push(await ejecutarPrueba(
    'Verificar ingresos',
    'Verifica que existan ingresos asociados a eventos',
    async () => {
      const { count } = await supabase
        .from('ingresos')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        return { resultado: 'PASS', detalles: `${count} ingresos encontrados` };
      } else {
        return { resultado: 'FAIL', detalles: 'No se encontraron ingresos' };
      }
    }
  ));

  // Prueba 1.4: Verificar gastos
  pruebas.push(await ejecutarPrueba(
    'Verificar gastos',
    'Verifica que existan gastos asociados a eventos',
    async () => {
      const { count } = await supabase
        .from('gastos')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        return { resultado: 'PASS', detalles: `${count} gastos encontrados` };
      } else {
        return { resultado: 'FAIL', detalles: 'No se encontraron gastos' };
      }
    }
  ));

  return {
    nombre: 'Verificación de Datos',
    pruebas,
    tiempoTotal: Date.now() - inicioSuite,
  };
}

// ============================================================================
// SUITE 2: INTEGRIDAD DE DATOS
// ============================================================================

async function suiteIntegridadDatos(): Promise<TestSuite> {
  log.suite('SUITE 2: Integridad de Datos');
  const pruebas: TestResult[] = [];
  const inicioSuite = Date.now();

  // Prueba 2.1: Verificar relaciones cliente-evento
  pruebas.push(await ejecutarPrueba(
    'Verificar relaciones cliente-evento',
    'Todos los eventos deben tener un cliente válido',
    async () => {
      const { data: eventosSinCliente } = await supabase
        .from('eventos')
        .select('id')
        .is('cliente_id', null);

      if (eventosSinCliente && eventosSinCliente.length === 0) {
        return { resultado: 'PASS', detalles: 'Todos los eventos tienen cliente asignado' };
      } else {
        return { 
          resultado: 'FAIL', 
          detalles: `${eventosSinCliente?.length} eventos sin cliente asignado` 
        };
      }
    }
  ));

  // Prueba 2.2: Verificar relaciones evento-ingreso
  pruebas.push(await ejecutarPrueba(
    'Verificar relaciones evento-ingreso',
    'Todos los ingresos deben tener un evento válido',
    async () => {
      const { data: ingresosSinEvento } = await supabase
        .from('ingresos')
        .select('id')
        .is('evento_id', null);

      if (ingresosSinEvento && ingresosSinEvento.length === 0) {
        return { resultado: 'PASS', detalles: 'Todos los ingresos tienen evento asignado' };
      } else {
        return { 
          resultado: 'FAIL', 
          detalles: `${ingresosSinEvento?.length} ingresos sin evento asignado` 
        };
      }
    }
  ));

  // Prueba 2.3: Verificar cálculos de ingresos
  pruebas.push(await ejecutarPrueba(
    'Verificar cálculos de ingresos',
    'Monto + IVA debe ser igual a Total',
    async () => {
      const { data: ingresos } = await supabase
        .from('ingresos')
        .select('id, monto, iva, total');

      if (!ingresos) {
        return { resultado: 'FAIL', detalles: 'No se pudieron obtener ingresos' };
      }

      const errores = ingresos.filter(ing => {
        const calculado = Number((ing.monto + ing.iva).toFixed(2));
        const almacenado = Number(ing.total.toFixed(2));
        return Math.abs(calculado - almacenado) > 0.01;
      });

      if (errores.length === 0) {
        return { 
          resultado: 'PASS', 
          detalles: `Todos los ${ingresos.length} ingresos tienen cálculos correctos` 
        };
      } else {
        return { 
          resultado: 'FAIL', 
          detalles: `${errores.length}/${ingresos.length} ingresos con errores de cálculo` 
        };
      }
    }
  ));

  // Prueba 2.4: Verificar cálculos de gastos
  pruebas.push(await ejecutarPrueba(
    'Verificar cálculos de gastos',
    'Monto + IVA debe ser igual a Total',
    async () => {
      const { data: gastos } = await supabase
        .from('gastos')
        .select('id, monto, iva, total');

      if (!gastos) {
        return { resultado: 'FAIL', detalles: 'No se pudieron obtener gastos' };
      }

      const errores = gastos.filter(gasto => {
        const calculado = Number((gasto.monto + gasto.iva).toFixed(2));
        const almacenado = Number(gasto.total.toFixed(2));
        return Math.abs(calculado - almacenado) > 0.01;
      });

      if (errores.length === 0) {
        return { 
          resultado: 'PASS', 
          detalles: `Todos los ${gastos.length} gastos tienen cálculos correctos` 
        };
      } else {
        return { 
          resultado: 'FAIL', 
          detalles: `${errores.length}/${gastos.length} gastos con errores de cálculo` 
        };
      }
    }
  ));

  return {
    nombre: 'Integridad de Datos',
    pruebas,
    tiempoTotal: Date.now() - inicioSuite,
  };
}

// ============================================================================
// SUITE 3: VALIDACIONES DE NEGOCIO
// ============================================================================

async function suiteValidacionesNegocio(): Promise<TestSuite> {
  log.suite('SUITE 3: Validaciones de Negocio');
  const pruebas: TestResult[] = [];
  const inicioSuite = Date.now();

  // Prueba 3.1: Validar RFCs
  pruebas.push(await ejecutarPrueba(
    'Validar formato de RFCs',
    'Los RFCs deben tener formato válido (13 caracteres)',
    async () => {
      const { data: clientes } = await supabase
        .from('evt_clientes')
        .select('id, rfc');

      if (!clientes) {
        return { resultado: 'FAIL', detalles: 'No se pudieron obtener clientes' };
      }

      const rfcsInvalidos = clientes.filter(c => 
        !c.rfc || c.rfc.length !== 13 || !/^[A-Z]{4}\d{6}[A-Z\d]{3}$/.test(c.rfc)
      );

      if (rfcsInvalidos.length === 0) {
        return { resultado: 'PASS', detalles: `Todos los ${clientes.length} RFCs son válidos` };
      } else {
        return { 
          resultado: 'WARNING', 
          detalles: `${rfcsInvalidos.length}/${clientes.length} RFCs con formato inválido` 
        };
      }
    }
  ));

  // Prueba 3.2: Validar emails
  pruebas.push(await ejecutarPrueba(
    'Validar emails de clientes',
    'Los emails deben tener formato válido',
    async () => {
      const { data: clientes } = await supabase
        .from('evt_clientes')
        .select('id, email');

      if (!clientes) {
        return { resultado: 'FAIL', detalles: 'No se pudieron obtener clientes' };
      }

      const emailInvalidos = clientes.filter(c => 
        !c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)
      );

      if (emailInvalidos.length === 0) {
        return { resultado: 'PASS', detalles: `Todos los ${clientes.length} emails son válidos` };
      } else {
        return { 
          resultado: 'FAIL', 
          detalles: `${emailInvalidos.length}/${clientes.length} emails inválidos` 
        };
      }
    }
  ));

  // Prueba 3.3: Validar fechas de eventos
  pruebas.push(await ejecutarPrueba(
    'Validar fechas de eventos',
    'Las fechas de eventos deben ser válidas',
    async () => {
      const { data: eventos } = await supabase
        .from('eventos')
        .select('id, fecha_evento');

      if (!eventos) {
        return { resultado: 'FAIL', detalles: 'No se pudieron obtener eventos' };
      }

      const fechasInvalidas = eventos.filter(e => {
        if (!e.fecha_evento) return true;
        const fecha = new Date(e.fecha_evento);
        return isNaN(fecha.getTime());
      });

      if (fechasInvalidas.length === 0) {
        return { resultado: 'PASS', detalles: `Todas las ${eventos.length} fechas son válidas` };
      } else {
        return { 
          resultado: 'FAIL', 
          detalles: `${fechasInvalidas.length}/${eventos.length} fechas inválidas` 
        };
      }
    }
  ));

  // Prueba 3.4: Validar montos positivos
  pruebas.push(await ejecutarPrueba(
    'Validar montos positivos',
    'Todos los montos deben ser mayores a 0',
    async () => {
      const { data: ingresos } = await supabase
        .from('ingresos')
        .select('id')
        .lte('total', 0);

      const { data: gastos } = await supabase
        .from('gastos')
        .select('id')
        .lte('total', 0);

      const totalInvalidos = (ingresos?.length || 0) + (gastos?.length || 0);

      if (totalInvalidos === 0) {
        return { resultado: 'PASS', detalles: 'Todos los montos son positivos' };
      } else {
        return { 
          resultado: 'FAIL', 
          detalles: `${totalInvalidos} registros con montos ≤ 0` 
        };
      }
    }
  ));

  return {
    nombre: 'Validaciones de Negocio',
    pruebas,
    tiempoTotal: Date.now() - inicioSuite,
  };
}

// ============================================================================
// SUITE 4: RENDIMIENTO
// ============================================================================

async function suiteRendimiento(): Promise<TestSuite> {
  log.suite('SUITE 4: Rendimiento');
  const pruebas: TestResult[] = [];
  const inicioSuite = Date.now();

  // Prueba 4.1: Tiempo de consulta de clientes
  pruebas.push(await ejecutarPrueba(
    'Consulta de clientes',
    'Debe completarse en menos de 2 segundos',
    async () => {
      const inicio = Date.now();
      const { data, error } = await supabase
        .from('evt_clientes')
        .select('*');
      const tiempo = Date.now() - inicio;

      if (error) throw error;

      if (tiempo < 2000) {
        return { resultado: 'PASS', detalles: `Consulta completada en ${tiempo}ms` };
      } else {
        return { resultado: 'WARNING', detalles: `Consulta tardó ${tiempo}ms (>2s)` };
      }
    }
  ));

  // Prueba 4.2: Tiempo de consulta de eventos con joins
  pruebas.push(await ejecutarPrueba(
    'Consulta de eventos con cliente',
    'Debe completarse en menos de 3 segundos',
    async () => {
      const inicio = Date.now();
      const { data, error } = await supabase
        .from('eventos')
        .select('*, evt_clientes(nombre, email)')
        .limit(100);
      const tiempo = Date.now() - inicio;

      if (error) throw error;

      if (tiempo < 3000) {
        return { resultado: 'PASS', detalles: `Consulta completada en ${tiempo}ms` };
      } else {
        return { resultado: 'WARNING', detalles: `Consulta tardó ${tiempo}ms (>3s)` };
      }
    }
  ));

  return {
    nombre: 'Rendimiento',
    pruebas,
    tiempoTotal: Date.now() - inicioSuite,
  };
}

// ============================================================================
// GENERAR REPORTE
// ============================================================================

async function generarReporte(suites: TestSuite[]) {
  console.log('\n');
  console.log(`${c.cyan}${c.bright}═══════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.cyan}${c.bright}           REPORTE DE PRUEBAS INTEGRALES${c.reset}`);
  console.log(`${c.cyan}${c.bright}═══════════════════════════════════════════════════════════════${c.reset}`);
  console.log('\n');

  let totalPruebas = 0;
  let totalPass = 0;
  let totalFail = 0;
  let totalWarning = 0;

  // Estadísticas por suite
  console.log(`${c.bright}Resumen por Suite:${c.reset}\n`);
  
  suites.forEach(suite => {
    const pass = suite.pruebas.filter(p => p.resultado === 'PASS').length;
    const fail = suite.pruebas.filter(p => p.resultado === 'FAIL').length;
    const warn = suite.pruebas.filter(p => p.resultado === 'WARNING').length;

    totalPruebas += suite.pruebas.length;
    totalPass += pass;
    totalFail += fail;
    totalWarning += warn;

    console.log(`${c.bright}${suite.nombre}${c.reset} (${suite.tiempoTotal}ms)`);
    console.log(`  ${c.green}✓ PASS:${c.reset} ${pass}  ${c.red}✗ FAIL:${c.reset} ${fail}  ${c.yellow}⚠ WARNING:${c.reset} ${warn}`);
    console.log('');
  });

  // Estadísticas globales
  const porcentajeExito = ((totalPass / totalPruebas) * 100).toFixed(1);
  
  console.log(`${c.bright}Estadísticas Globales:${c.reset}\n`);
  console.log(`  Total de pruebas:    ${totalPruebas}`);
  console.log(`  ${c.green}✓ Exitosas:${c.reset}          ${totalPass} (${porcentajeExito}%)`);
  console.log(`  ${c.red}✗ Fallidas:${c.reset}          ${totalFail}`);
  console.log(`  ${c.yellow}⚠ Advertencias:${c.reset}      ${totalWarning}`);
  console.log('');

  // Estado final
  const estadoFinal = totalFail === 0 ? 
    `${c.green}${c.bright}✓ TODAS LAS PRUEBAS PASARON${c.reset}` :
    `${c.red}${c.bright}✗ ${totalFail} PRUEBAS FALLARON${c.reset}`;

  console.log(`${c.bright}Estado:${c.reset} ${estadoFinal}`);
  console.log('');

  // Guardar reporte JSON
  const reporte = {
    fecha: new Date().toISOString(),
    suites,
    resumen: {
      totalPruebas,
      exitosas: totalPass,
      fallidas: totalFail,
      advertencias: totalWarning,
      porcentajeExito: parseFloat(porcentajeExito),
    },
  };

  const fs = await import('fs');
  const path = './reports/integration-test-report.json';
  
  try {
    // Crear directorio si no existe
    if (!fs.existsSync('./reports')) {
      fs.mkdirSync('./reports', { recursive: true });
    }
    
    fs.writeFileSync(path, JSON.stringify(reporte, null, 2));
    console.log(`${c.green}✓${c.reset} Reporte JSON guardado: ${path}`);
    
    // Generar reporte markdown
    const reporteMD = generarReporteMarkdown(suites, reporte.resumen);
    const pathMD = `./reports/integration-test-report-${new Date().toISOString().split('T')[0]}.md`;
    fs.writeFileSync(pathMD, reporteMD);
    console.log(`${c.green}✓${c.reset} Reporte MD guardado: ${pathMD}`);
    
  } catch (error) {
    console.log(`${c.red}✗${c.reset} Error al guardar reporte: ${error}`);
  }
}

function generarReporteMarkdown(suites: TestSuite[], resumen: Record<string, unknown>): string {
  let md = `# 📊 Reporte de Pruebas Integrales\n\n`;
  md += `**Fecha:** ${new Date().toLocaleString('es-MX')}\n\n`;
  md += `---\n\n`;
  
  md += `## 📈 Resumen Ejecutivo\n\n`;
  md += `| Métrica | Valor |\n`;
  md += `|---------|-------|\n`;
  md += `| Total de Pruebas | ${resumen.totalPruebas} |\n`;
  md += `| ✅ Exitosas | ${resumen.exitosas} |\n`;
  md += `| ❌ Fallidas | ${resumen.fallidas} |\n`;
  md += `| ⚠️ Advertencias | ${resumen.advertencias} |\n`;
  md += `| Porcentaje de Éxito | ${resumen.porcentajeExito}% |\n\n`;

  suites.forEach(suite => {
    md += `## ${suite.nombre}\n\n`;
    md += `**Tiempo total:** ${suite.tiempoTotal}ms\n\n`;
    
    md += `| # | Prueba | Resultado | Tiempo | Detalles |\n`;
    md += `|---|--------|-----------|--------|----------|\n`;
    
    suite.pruebas.forEach((prueba, i) => {
      const icon = prueba.resultado === 'PASS' ? '✅' : 
                   prueba.resultado === 'WARNING' ? '⚠️' : '❌';
      md += `| ${i + 1} | ${prueba.nombre} | ${icon} ${prueba.resultado} | ${prueba.tiempo}ms | ${prueba.detalles} |\n`;
    });
    
    md += `\n`;
  });

  return md;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n');
  console.log(`${c.cyan}${c.bright}═══════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`${c.cyan}${c.bright}  🧪 SISTEMA DE PRUEBAS INTEGRALES - MADE ERP 77${c.reset}`);
  console.log(`${c.cyan}${c.bright}═══════════════════════════════════════════════════════════════${c.reset}`);
  console.log(`\n${c.blue}Fecha:${c.reset} ${new Date().toLocaleString('es-MX')}\n`);

  const inicioTotal = Date.now();

  // Ejecutar todas las suites
  const suite1 = await suiteVerificacionDatos();
  resultados.push(suite1);

  const suite2 = await suiteIntegridadDatos();
  resultados.push(suite2);

  const suite3 = await suiteValidacionesNegocio();
  resultados.push(suite3);

  const suite4 = await suiteRendimiento();
  resultados.push(suite4);

  const tiempoTotal = Date.now() - inicioTotal;

  // Generar reporte
  await generarReporte(resultados);

  console.log(`\n${c.cyan}⏱ Tiempo total:${c.reset} ${(tiempoTotal / 1000).toFixed(2)}s`);
  console.log('\n');
}

// Ejecutar
main()
  .then(() => {
    console.log(`${c.green}✓ Pruebas completadas${c.reset}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${c.red}✗ Error fatal:${c.reset}`, error);
    process.exit(1);
  });
