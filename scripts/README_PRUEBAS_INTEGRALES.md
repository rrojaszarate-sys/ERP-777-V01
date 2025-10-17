# 🧪 Sistema de Pruebas Integrales - MADE ERP 77

Sistema completo de pruebas automatizadas para validar la funcionalidad integral del sistema de gestión de eventos.

## 📋 Descripción

Este sistema de pruebas genera automáticamente:

- **20 clientes** con datos completos y válidos
- **15-20 eventos por cliente** (varía aleatoriamente)
- **10 ingresos por evento**
- **50 gastos por evento**

Y ejecuta pruebas exhaustivas de:

- ✅ Verificación de datos
- ✅ Integridad referencial
- ✅ Validaciones de negocio
- ✅ Rendimiento de consultas
- ✅ Cálculos financieros

## 🚀 Uso Rápido

### Ejecución Automática (Recomendado)

```bash
# Dar permisos de ejecución
chmod +x scripts/run-integration-tests.sh

# Ejecutar todo el proceso
./scripts/run-integration-tests.sh
```

Este script ejecutará automáticamente:

1. ✅ Verificación de dependencias
2. ✅ Generación de datos de prueba
3. ✅ Ejecución de pruebas integrales
4. ✅ Generación de reporte consolidado

### Ejecución Manual (Paso a Paso)

#### 1. Instalar Dependencias

```bash
pnpm add -D @faker-js/faker @types/node
# o
npm install --save-dev @faker-js/faker @types/node
```

#### 2. Generar Datos de Prueba

```bash
npx tsx scripts/test-data-generator.ts
```

#### 3. Ejecutar Pruebas

```bash
npx tsx scripts/integration-tests.ts
```

## 📊 Reportes Generados

Todos los reportes se guardan en el directorio `reports/`:

### 1. Reporte Consolidado Principal

```
reports/REPORTE_PRUEBAS_INTEGRAL_YYYY-MM-DD.md
```

Incluye:
- Resumen ejecutivo
- Estadísticas de datos generados
- Resultados detallados de todas las pruebas
- Errores encontrados
- Recomendaciones

### 2. Reporte de Generación de Datos (JSON)

```
reports/test-data-generation-report.json
```

Contiene:
- Cantidad de registros creados por tipo
- Tiempo de generación
- Lista detallada de errores (si los hay)
- Configuración utilizada

### 3. Reporte de Pruebas (JSON)

```
reports/integration-test-report.json
```

Contiene:
- Resultados de todas las suites de pruebas
- Tiempos de ejecución
- Detalles de cada prueba individual
- Resumen de éxito/fallo

### 4. Reporte de Pruebas (Markdown)

```
reports/integration-test-report-YYYY-MM-DD.md
```

Versión legible en Markdown con:
- Tablas de resultados
- Estadísticas
- Detalles de cada prueba

### 5. Logs de Ejecución

```
reports/data-generation.log
reports/integration-tests.log
```

Logs completos de la ejecución de cada fase.

## 🧪 Suites de Pruebas

### Suite 1: Verificación de Datos

Verifica que los datos se hayan generado correctamente:

- ✅ Al menos 20 clientes
- ✅ 15-20 eventos por cliente
- ✅ Ingresos asociados a eventos
- ✅ Gastos asociados a eventos

### Suite 2: Integridad de Datos

Valida la integridad referencial:

- ✅ Todos los eventos tienen cliente válido
- ✅ Todos los ingresos tienen evento válido
- ✅ Cálculos correctos en ingresos (monto + IVA = total)
- ✅ Cálculos correctos en gastos (monto + IVA = total)

### Suite 3: Validaciones de Negocio

Verifica reglas de negocio:

- ✅ RFCs con formato válido (13 caracteres)
- ✅ Emails con formato válido
- ✅ Fechas de eventos válidas
- ✅ Montos mayores a 0

### Suite 4: Rendimiento

Mide tiempos de respuesta:

- ✅ Consulta de clientes < 2s
- ✅ Consulta de eventos con JOIN < 3s

## 📈 Estadísticas Generadas

### Datos de Prueba

Por defecto, se generan:

```
20 clientes × 17.5 eventos promedio = 350 eventos
350 eventos × 10 ingresos = 3,500 ingresos
350 eventos × 50 gastos = 17,500 gastos

Total: ~21,370 registros
```

### Tiempo Estimado

- Generación de datos: ~5-10 minutos
- Ejecución de pruebas: ~30-60 segundos
- **Total: ~6-11 minutos**

## ⚙️ Configuración

### Variables de Entorno

Asegúrate de tener configurado el archivo `.env`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### Personalizar Configuración

Edita `scripts/test-data-generator.ts`:

```typescript
const TEST_CONFIG = {
  NUM_CLIENTES: 20,           // Número de clientes a generar
  EVENTOS_MIN: 15,            // Mínimo de eventos por cliente
  EVENTOS_MAX: 20,            // Máximo de eventos por cliente
  INGRESOS_POR_CLIENTE: 10,   // Ingresos por evento
  GASTOS_POR_CLIENTE: 50,     // Gastos por evento
};
```

## 🐛 Solución de Problemas

### Error: "No se encuentra el módulo @faker-js/faker"

```bash
pnpm add -D @faker-js/faker
```

### Error: "No se encuentra el nombre 'process'"

```bash
pnpm add -D @types/node
```

### Error: "Invalid input syntax for type uuid"

Verifica que las variables de entorno estén configuradas correctamente.

### Pruebas muy lentas

- Reduce el número de clientes en `TEST_CONFIG`
- Verifica la conexión a internet (Supabase)
- Considera usar una base de datos local para pruebas

## 📝 Ejemplo de Salida

### Generación de Datos

```
═══ FASE 1: Creando Clientes ═══

✓ Cliente creado: Juan Pérez García
✓ Cliente creado: María López Hernández
...

═══ FASE 2: Creando Eventos, Ingresos y Gastos ═══

Cliente: Juan Pérez García (18 eventos)
  ✓ Evento 1/18: Boda
    → 10 ingresos creados
    → 50 gastos creados
...

📊 RESUMEN DE GENERACIÓN DE DATOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Clientes creados:     20
✓ Eventos creados:      352
✓ Ingresos creados:     3,520
✓ Gastos creados:       17,600
✗ Errores detectados:   0

⏱ Tiempo total:         437.52 segundos
```

### Ejecución de Pruebas

```
▶ SUITE 1: Verificación de Datos

  ✓ Verificar clientes cargados - 20 clientes encontrados (45ms)
  ✓ Verificar eventos por cliente - Todos los clientes (20) tienen 15-20 eventos. Total: 352 (1234ms)
  ✓ Verificar ingresos - 3520 ingresos encontrados (23ms)
  ✓ Verificar gastos - 17600 gastos encontrados (28ms)

═══════════════════════════════════════════════════════════════
           REPORTE DE PRUEBAS INTEGRALES
═══════════════════════════════════════════════════════════════

Resumen por Suite:

Verificación de Datos (1330ms)
  ✓ PASS: 4  ✗ FAIL: 0  ⚠ WARNING: 0

Integridad de Datos (2456ms)
  ✓ PASS: 4  ✗ FAIL: 0  ⚠ WARNING: 0

Validaciones de Negocio (1823ms)
  ✓ PASS: 4  ✗ FAIL: 0  ⚠ WARNING: 0

Rendimiento (892ms)
  ✓ PASS: 2  ✗ FAIL: 0  ⚠ WARNING: 0

Estadísticas Globales:

  Total de pruebas:    14
  ✓ Exitosas:          14 (100.0%)
  ✗ Fallidas:          0
  ⚠ Advertencias:      0

Estado: ✓ TODAS LAS PRUEBAS PASARON
```

## 🔍 Interpretación de Resultados

### Estados de Prueba

- **✅ PASS**: Prueba exitosa
- **❌ FAIL**: Prueba fallida (requiere corrección)
- **⚠️ WARNING**: Advertencia (revisar pero no crítico)

### Porcentaje de Éxito

- **100%**: Sistema perfecto ✨
- **90-99%**: Excelente, pocos errores menores
- **80-89%**: Bueno, algunos errores a corregir
- **< 80%**: Revisar urgentemente

## 📚 Archivos del Sistema

```
MADE-ERP-77/
├── scripts/
│   ├── test-data-generator.ts           # Generador de datos
│   ├── integration-tests.ts             # Suite de pruebas
│   ├── run-integration-tests.sh         # Script ejecutor
│   └── README_PRUEBAS_INTEGRALES.md     # Esta documentación
│
└── reports/                              # Reportes generados
    ├── REPORTE_PRUEBAS_INTEGRAL_*.md
    ├── test-data-generation-report.json
    ├── integration-test-report.json
    ├── integration-test-report-*.md
    ├── data-generation.log
    └── integration-tests.log
```

## 🤝 Contribuir

Para agregar nuevas pruebas:

1. Edita `scripts/integration-tests.ts`
2. Crea una nueva función `suiteNombre()`
3. Agrega la suite al array `resultados` en `main()`

Ejemplo:

```typescript
async function suiteNuevasPruebas(): Promise<TestSuite> {
  log.suite('SUITE 5: Nuevas Pruebas');
  const pruebas: TestResult[] = [];
  const inicioSuite = Date.now();

  pruebas.push(await ejecutarPrueba(
    'Mi nueva prueba',
    'Descripción de la prueba',
    async () => {
      // Tu lógica aquí
      return { resultado: 'PASS', detalles: 'Todo bien' };
    }
  ));

  return {
    nombre: 'Nuevas Pruebas',
    pruebas,
    tiempoTotal: Date.now() - inicioSuite,
  };
}
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en `reports/*.log`
2. Verifica la configuración en `.env`
3. Consulta la documentación de Supabase
4. Revisa los reportes JSON para detalles de errores

## 🎯 Próximas Mejoras

- [ ] Pruebas de concurrencia
- [ ] Pruebas de seguridad (RLS)
- [ ] Pruebas de UI automatizadas
- [ ] Benchmarks de rendimiento
- [ ] Pruebas de estrés
- [ ] Integración con CI/CD

---

**Creado por:** Sistema de Pruebas Integrales MADE ERP 77  
**Fecha:** 17 de Octubre de 2025  
**Versión:** 1.0.0
