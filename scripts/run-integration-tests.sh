#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
#  Script de Ejecución de Pruebas Integrales
#  Fecha: 17 de Octubre 2025
#  
#  Ejecuta:
#  1. Generación de datos de prueba (20 clientes, 15-20 eventos, 10 ingresos, 50 gastos)
#  2. Pruebas funcionales integrales
#  3. Generación de reporte detallado
# ═══════════════════════════════════════════════════════════════════════

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Directorio base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$BASE_DIR")"
REPORTS_DIR="${PROJECT_DIR}/reports"

echo -e "\n"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}     🧪 SISTEMA DE PRUEBAS INTEGRALES - MADE ERP 77${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "\n"
echo -e "${BLUE}📅 Fecha:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo -e "${BLUE}📂 Directorio:${NC} ${PROJECT_DIR}"
echo -e "\n"

# Crear directorio de reportes
mkdir -p "$REPORTS_DIR"

# ═══════════════════════════════════════════════════════════════════════
# FASE 0: Verificar dependencias
# ═══════════════════════════════════════════════════════════════════════

echo -e "${CYAN}${BOLD}▶ FASE 0: Verificando Dependencias${NC}\n"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js: $(node --version)"

# Verificar npm/pnpm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
    echo -e "${GREEN}✓${NC} pnpm: $(pnpm --version)"
elif command -v npm &> /dev/null; then
    PKG_MANAGER="npm"
    echo -e "${GREEN}✓${NC} npm: $(npm --version)"
else
    echo -e "${RED}✗ npm/pnpm no está instalado${NC}"
    exit 1
fi

# Verificar archivo .env
if [ ! -f "${PROJECT_DIR}/.env" ]; then
    echo -e "${RED}✗ Archivo .env no encontrado${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Archivo .env encontrado"

# Verificar dependencias del proyecto
echo -e "\n${BLUE}Verificando dependencias del proyecto...${NC}"

cd "$PROJECT_DIR"

# Instalar @faker-js/faker si no existe
if ! $PKG_MANAGER list @faker-js/faker &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Instalando @faker-js/faker..."
    $PKG_MANAGER add -D @faker-js/faker
    echo -e "${GREEN}✓${NC} @faker-js/faker instalado"
else
    echo -e "${GREEN}✓${NC} @faker-js/faker ya instalado"
fi

# Instalar @types/node si no existe
if ! $PKG_MANAGER list @types/node &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Instalando @types/node..."
    $PKG_MANAGER add -D @types/node
    echo -e "${GREEN}✓${NC} @types/node instalado"
else
    echo -e "${GREEN}✓${NC} @types/node ya instalado"
fi

echo -e "\n${GREEN}✓ Todas las dependencias están instaladas${NC}\n"

# ═══════════════════════════════════════════════════════════════════════
# FASE 1: Generar Datos de Prueba
# ═══════════════════════════════════════════════════════════════════════

echo -e "${CYAN}${BOLD}▶ FASE 1: Generación de Datos de Prueba${NC}\n"

read -p "$(echo -e ${YELLOW}⚠️  Esto creará datos de prueba en la base de datos. ¿Continuar? [s/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    exit 0
fi

echo -e "\n${BLUE}Ejecutando generador de datos...${NC}\n"

# Compilar y ejecutar el script de generación
npx tsx scripts/test-data-generator.ts 2>&1 | tee "${REPORTS_DIR}/data-generation.log"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo -e "\n${RED}✗ Error en la generación de datos${NC}"
    echo -e "${YELLOW}Ver log completo en: ${REPORTS_DIR}/data-generation.log${NC}"
    exit 1
fi

echo -e "\n${GREEN}✓ Datos de prueba generados correctamente${NC}\n"

# ═══════════════════════════════════════════════════════════════════════
# FASE 2: Ejecutar Pruebas Integrales
# ═══════════════════════════════════════════════════════════════════════

echo -e "${CYAN}${BOLD}▶ FASE 2: Ejecutando Pruebas Integrales${NC}\n"

# Compilar y ejecutar el script de pruebas
npx tsx scripts/integration-tests.ts 2>&1 | tee "${REPORTS_DIR}/integration-tests.log"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo -e "\n${RED}✗ Error en las pruebas integrales${NC}"
    echo -e "${YELLOW}Ver log completo en: ${REPORTS_DIR}/integration-tests.log${NC}"
    exit 1
fi

echo -e "\n${GREEN}✓ Pruebas integrales completadas${NC}\n"

# ═══════════════════════════════════════════════════════════════════════
# FASE 3: Generar Reporte Consolidado
# ═══════════════════════════════════════════════════════════════════════

echo -e "${CYAN}${BOLD}▶ FASE 3: Generando Reporte Consolidado${NC}\n"

# Obtener fecha actual para el reporte
FECHA=$(date '+%Y-%m-%d')
REPORTE_FILE="${REPORTS_DIR}/REPORTE_PRUEBAS_INTEGRAL_${FECHA}.md"

# Crear reporte consolidado
cat > "$REPORTE_FILE" << 'EOF'
# 📊 Reporte de Pruebas Integrales - MADE ERP 77

EOF

echo "**Fecha de ejecución:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORTE_FILE"
echo "" >> "$REPORTE_FILE"
echo "---" >> "$REPORTE_FILE"
echo "" >> "$REPORTE_FILE"

# Agregar tabla de contenidos
cat >> "$REPORTE_FILE" << 'EOF'
## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Generación de Datos](#generación-de-datos)
3. [Resultados de Pruebas](#resultados-de-pruebas)
4. [Errores Encontrados](#errores-encontrados)
5. [Recomendaciones](#recomendaciones)

---

## 📈 Resumen Ejecutivo

EOF

# Extraer estadísticas del archivo JSON si existe
if [ -f "${REPORTS_DIR}/integration-test-report.json" ]; then
    echo "" >> "$REPORTE_FILE"
    echo "### Estadísticas de Pruebas" >> "$REPORTE_FILE"
    echo "" >> "$REPORTE_FILE"
    
    # Usar jq si está disponible, sino usar grep/sed
    if command -v jq &> /dev/null; then
        TOTAL=$(jq '.resumen.totalPruebas' "${REPORTS_DIR}/integration-test-report.json")
        EXITOSAS=$(jq '.resumen.exitosas' "${REPORTS_DIR}/integration-test-report.json")
        FALLIDAS=$(jq '.resumen.fallidas' "${REPORTS_DIR}/integration-test-report.json")
        ADVERTENCIAS=$(jq '.resumen.advertencias' "${REPORTS_DIR}/integration-test-report.json")
        PORCENTAJE=$(jq '.resumen.porcentajeExito' "${REPORTS_DIR}/integration-test-report.json")
        
        cat >> "$REPORTE_FILE" << STATS
| Métrica | Valor |
|---------|-------|
| Total de Pruebas | $TOTAL |
| ✅ Exitosas | $EXITOSAS |
| ❌ Fallidas | $FALLIDAS |
| ⚠️ Advertencias | $ADVERTENCIAS |
| Porcentaje de Éxito | ${PORCENTAJE}% |

STATS
    fi
fi

# Agregar sección de generación de datos
cat >> "$REPORTE_FILE" << 'EOF'

---

## 🗄️ Generación de Datos

EOF

if [ -f "${REPORTS_DIR}/test-data-generation-report.json" ]; then
    echo "### Datos Generados" >> "$REPORTE_FILE"
    echo "" >> "$REPORTE_FILE"
    
    if command -v jq &> /dev/null; then
        CLIENTES=$(jq '.estadisticas.clientesCreados' "${REPORTS_DIR}/test-data-generation-report.json")
        EVENTOS=$(jq '.estadisticas.eventosCreados' "${REPORTS_DIR}/test-data-generation-report.json")
        INGRESOS=$(jq '.estadisticas.ingresosCreados' "${REPORTS_DIR}/test-data-generation-report.json")
        GASTOS=$(jq '.estadisticas.gastosCreados' "${REPORTS_DIR}/test-data-generation-report.json")
        TIEMPO_GEN=$(jq -r '.tiempoTotal' "${REPORTS_DIR}/test-data-generation-report.json")
        
        cat >> "$REPORTE_FILE" << DATAGEN
| Tipo | Cantidad |
|------|----------|
| 👥 Clientes | $CLIENTES |
| 📅 Eventos | $EVENTOS |
| 💰 Ingresos | $INGRESOS |
| 📤 Gastos | $GASTOS |

**Tiempo de generación:** $TIEMPO_GEN

DATAGEN
    fi
fi

# Incluir el reporte de pruebas si existe
if [ -f "${REPORTS_DIR}/integration-test-report-${FECHA}.md" ]; then
    echo "" >> "$REPORTE_FILE"
    echo "---" >> "$REPORTE_FILE"
    echo "" >> "$REPORTE_FILE"
    echo "## 🧪 Resultados Detallados de Pruebas" >> "$REPORTE_FILE"
    echo "" >> "$REPORTE_FILE"
    tail -n +2 "${REPORTS_DIR}/integration-test-report-${FECHA}.md" >> "$REPORTE_FILE"
fi

# Agregar sección de errores
cat >> "$REPORTE_FILE" << 'EOF'

---

## ⚠️ Errores Encontrados

EOF

if [ -f "${REPORTS_DIR}/test-data-generation-report.json" ]; then
    if command -v jq &> /dev/null; then
        NUM_ERRORES=$(jq '.errores | length' "${REPORTS_DIR}/test-data-generation-report.json")
        
        if [ "$NUM_ERRORES" -gt 0 ]; then
            echo "Se detectaron **$NUM_ERRORES errores** durante la generación de datos." >> "$REPORTE_FILE"
            echo "" >> "$REPORTE_FILE"
            echo "Ver detalles completos en: \`reports/test-data-generation-report.json\`" >> "$REPORTE_FILE"
        else
            echo "✅ No se detectaron errores durante la generación de datos." >> "$REPORTE_FILE"
        fi
    fi
fi

# Agregar recomendaciones
cat >> "$REPORTE_FILE" << 'EOF'

---

## 💡 Recomendaciones

### Acciones Correctivas

1. **Revisar errores de validación**: Verificar los campos que no cumplen con las validaciones de negocio
2. **Optimizar consultas**: Revisar las consultas que tardan más de 2 segundos
3. **Corregir cálculos**: Asegurar que todos los cálculos de montos sean exactos
4. **Validar relaciones**: Garantizar integridad referencial en todas las tablas

### Próximos Pasos

- [ ] Corregir errores detectados
- [ ] Ejecutar nuevamente las pruebas
- [ ] Documentar soluciones aplicadas
- [ ] Actualizar casos de prueba según sea necesario

---

## 📎 Anexos

### Archivos Generados

EOF

# Listar archivos generados
echo "- [\`test-data-generation-report.json\`](./test-data-generation-report.json)" >> "$REPORTE_FILE"
echo "- [\`integration-test-report.json\`](./integration-test-report.json)" >> "$REPORTE_FILE"
echo "- [\`integration-test-report-${FECHA}.md\`](./integration-test-report-${FECHA}.md)" >> "$REPORTE_FILE"
echo "- [\`data-generation.log\`](./data-generation.log)" >> "$REPORTE_FILE"
echo "- [\`integration-tests.log\`](./integration-tests.log)" >> "$REPORTE_FILE"

echo "" >> "$REPORTE_FILE"
echo "---" >> "$REPORTE_FILE"
echo "" >> "$REPORTE_FILE"
echo "**Reporte generado automáticamente por:** \`run-integration-tests.sh\`" >> "$REPORTE_FILE"
echo "" >> "$REPORTE_FILE"
echo "**Fecha:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORTE_FILE"

echo -e "${GREEN}✓ Reporte consolidado generado: ${REPORTE_FILE}${NC}\n"

# ═══════════════════════════════════════════════════════════════════════
# FASE 4: Resumen Final
# ═══════════════════════════════════════════════════════════════════════

echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}${BOLD}              ✅ PRUEBAS COMPLETADAS${NC}"
echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo -e "\n"

echo -e "${BOLD}📊 Archivos Generados:${NC}\n"
echo -e "  ${GREEN}●${NC} ${REPORTE_FILE}"
echo -e "  ${GREEN}●${NC} ${REPORTS_DIR}/test-data-generation-report.json"
echo -e "  ${GREEN}●${NC} ${REPORTS_DIR}/integration-test-report.json"
echo -e "  ${GREEN}●${NC} ${REPORTS_DIR}/integration-test-report-${FECHA}.md"
echo -e "  ${GREEN}●${NC} ${REPORTS_DIR}/data-generation.log"
echo -e "  ${GREEN}●${NC} ${REPORTS_DIR}/integration-tests.log"

echo -e "\n${BOLD}📂 Ver reportes en:${NC}"
echo -e "  ${BLUE}${REPORTS_DIR}${NC}"

echo -e "\n${BOLD}📖 Leer reporte principal:${NC}"
echo -e "  ${YELLOW}cat ${REPORTE_FILE}${NC}"

echo -e "\n${GREEN}${BOLD}✨ ¡Proceso de pruebas integrales completado exitosamente! ✨${NC}\n"
