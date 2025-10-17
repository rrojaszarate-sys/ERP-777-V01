#!/bin/bash

# Script para integrar archivos MD restantes en docs_archive_20251017
# Fecha: 17 de Octubre 2025

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  INTEGRACIÓN DE ARCHIVOS MD RESTANTES${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Directorio base
BASE_DIR="/home/rodrichrz/proyectos/Made-Erp-777-ok/MADE-ERP-77"
ARCHIVE_DIR="${BASE_DIR}/docs_archive_20251017"

# Verificar que existe el directorio de archivo
if [ ! -d "$ARCHIVE_DIR" ]; then
    echo -e "${RED}Error: No existe el directorio $ARCHIVE_DIR${NC}"
    exit 1
fi

# Función para obtener el próximo número de una categoría
get_next_number() {
    local category=$1
    local category_dir="${ARCHIVE_DIR}/${category}"
    
    if [ ! -d "$category_dir" ]; then
        echo "001"
        return
    fi
    
    # Buscar el número más alto existente
    local max_num=$(find "$category_dir" -name "*.md" -type f | \
                    grep -o '[0-9]\{3\}_' | \
                    grep -o '[0-9]\{3\}' | \
                    sort -n | \
                    tail -1)
    
    if [ -z "$max_num" ]; then
        echo "001"
    else
        printf "%03d" $((10#$max_num + 1))
    fi
}

# Función para clasificar y mover archivo
classify_and_move() {
    local file=$1
    local basename=$(basename "$file")
    local category=""
    
    # Clasificación por nombre de archivo
    case "$basename" in
        RESUMEN_*|resumen_*)
            category="resumen"
            ;;
        MEJORAS_*|mejoras_*)
            category="implementacion"
            ;;
        FIX_*|fix_*|Fix_*)
            category="fixes"
            ;;
        SOLUCION_*|solucion_*|SOLUCION*)
            category="fixes"
            ;;
        PROPUESTA_*|propuesta_*|PROPUESTAS_*)
            category="otros"
            ;;
        PASO_*|paso_*|PASOS_*)
            category="guias"
            ;;
        CORRECCION_*|CORRECCIONES_*|correccion_*)
            category="correcciones"
            ;;
        DEBUG_*|DEBUGGING_*|debug_*)
            category="debug"
            ;;
        GUIA_*|guia_*|GUIAS_*)
            category="guias"
            ;;
        IMPLEMENTACION_*|implementacion_*)
            category="implementacion"
            ;;
        OCR_*|ocr_*)
            category="ocr"
            ;;
        DIAGNOSTICO_*|diagnostico_*)
            category="debug"
            ;;
        MIGRACION_*|migracion_*|INSTRUCCIONES_MIGRACION_*)
            category="deployment"
            ;;
        SISTEMA_*|sistema_*)
            category="analisis"
            ;;
        CAMBIOS_*|cambios_*)
            category="resumen"
            ;;
        MAPEO_*|mapeo_*)
            category="ocr"
            ;;
        FLUJO_*|flujo_*)
            category="analisis"
            ;;
        CONFIGURADO_*|INSTALL_*|install_*)
            category="configuracion"
            ;;
        DATOS_*|datos_*)
            category="otros"
            ;;
        ERRORES_*|errores_*)
            category="fixes"
            ;;
        CONFIRMACION_*|confirmacion_*)
            category="otros"
            ;;
        RESTRICCION_*|restriccion_*)
            category="otros"
            ;;
        EJECUTAR_*|ejecutar_*)
            category="deployment"
            ;;
        SERVIDOR_*|servidor_*)
            category="configuracion"
            ;;
        *)
            category="otros"
            ;;
    esac
    
    # Crear directorio de categoría si no existe
    local category_dir="${ARCHIVE_DIR}/${category}"
    mkdir -p "$category_dir"
    
    # Obtener el siguiente número
    local next_num=$(get_next_number "$category")
    
    # Generar nuevo nombre con fecha y numeración
    local new_name="20251017_${next_num}_${basename}"
    local dest_file="${category_dir}/${new_name}"
    
    # Copiar archivo
    cp "$file" "$dest_file"
    
    echo -e "${GREEN}✓${NC} Integrado: ${YELLOW}${basename}${NC}"
    echo -e "  → ${category}/${new_name}"
    
    # Retornar información para el índice
    echo "${category}|${new_name}|${basename}"
}

# Buscar archivos MD en el directorio raíz de MADE-ERP-77
echo -e "${BLUE}Buscando archivos MD en directorio raíz...${NC}"
echo ""

# Buscar archivos MD que NO estén ya en el archivo (no tienen prefijo de fecha)
md_files=$(find "$BASE_DIR" -maxdepth 1 -name "*.md" -type f ! -name "20251017_*" | \
           grep -v "RESUMEN_ORGANIZACION_DOCS.md" | \
           grep -v "RESUMEN_FINAL_ORGANIZACION.md" | \
           grep -v "DOCUMENTACION_MAESTRA_SISTEMA.md" || true)

if [ -z "$md_files" ]; then
    echo -e "${YELLOW}No se encontraron archivos MD para integrar.${NC}"
    exit 0
fi

# Contador
total_count=0
declare -A category_counts

# Procesar cada archivo
while IFS= read -r file; do
    if [ -f "$file" ]; then
        result=$(classify_and_move "$file")
        category=$(echo "$result" | cut -d'|' -f1)
        ((total_count++))
        ((category_counts[$category]++))
    fi
done <<< "$md_files"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Integración completada${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total de archivos integrados: ${GREEN}${total_count}${NC}"
echo ""
echo "Distribución por categoría:"
for category in "${!category_counts[@]}"; do
    echo -e "  ${YELLOW}${category}${NC}: ${category_counts[$category]} archivos"
done

echo ""
echo -e "${BLUE}Regenerando índice...${NC}"

# Regenerar índice completo
cat > "${ARCHIVE_DIR}/00_INDICE.md" << 'INDEXEOF'
# 📚 ÍNDICE DE DOCUMENTACIÓN TÉCNICA

**Fecha de archivo:** 17 de Octubre de 2025  
**Última actualización:** 17 de Octubre de 2025

---

## 📊 RESUMEN EJECUTIVO

Este archivo contiene toda la documentación técnica del proyecto MADE ERP 77, organizada en categorías temáticas con numeración secuencial y fechas.

INDEXEOF

# Contar archivos por categoría
for category_dir in "$ARCHIVE_DIR"/*/; do
    if [ -d "$category_dir" ]; then
        category=$(basename "$category_dir")
        count=$(find "$category_dir" -name "*.md" -type f | wc -l)
        
        if [ $count -gt 0 ]; then
            case "$category" in
                analisis) icon="🔍"; desc="Análisis de sistemas y arquitectura" ;;
                correcciones) icon="🔧"; desc="Correcciones aplicadas al sistema" ;;
                debug) icon="🐛"; desc="Procesos de debugging y diagnóstico" ;;
                deployment) icon="🚀"; desc="Guías de despliegue y migración" ;;
                fixes) icon="✅"; desc="Soluciones y correcciones implementadas" ;;
                guias) icon="📖"; desc="Guías de uso e implementación" ;;
                implementacion) icon="⚙️"; desc="Implementaciones y mejoras" ;;
                ocr) icon="📄"; desc="Sistema de OCR y procesamiento" ;;
                resumen) icon="📝"; desc="Resúmenes ejecutivos" ;;
                configuracion) icon="⚙️"; desc="Configuraciones del sistema" ;;
                otros) icon="📋"; desc="Documentos varios" ;;
                *) icon="📁"; desc="Otros documentos" ;;
            esac
            
            echo "" >> "${ARCHIVE_DIR}/00_INDICE.md"
            echo "### $icon $category/ ($count documentos)" >> "${ARCHIVE_DIR}/00_INDICE.md"
            echo "_${desc}_" >> "${ARCHIVE_DIR}/00_INDICE.md"
            echo "" >> "${ARCHIVE_DIR}/00_INDICE.md"
            
            # Listar archivos de la categoría
            find "$category_dir" -name "*.md" -type f | sort | while read -r file; do
                filename=$(basename "$file")
                echo "- [\`$filename\`](./$category/$filename)" >> "${ARCHIVE_DIR}/00_INDICE.md"
            done
        fi
    fi
done

# Agregar estadísticas finales
total_docs=$(find "$ARCHIVE_DIR" -name "*.md" -type f ! -name "00_INDICE.md" ! -name "README.md" | wc -l)

cat >> "${ARCHIVE_DIR}/00_INDICE.md" << INDEXEOF

---

## 📊 ESTADÍSTICAS

- **Total de documentos:** $total_docs
- **Categorías:** 11
- **Formato de nombres:** \`YYYYMMDD_NNN_NOMBRE_ORIGINAL.md\`
- **Fecha de archivo:** 2025-10-17

---

## 🔍 CÓMO USAR ESTE ÍNDICE

1. **Buscar por categoría:** Navega a la sección correspondiente
2. **Buscar por nombre:** Usa Ctrl+F en tu editor
3. **Acceder rápido:** Click en el enlace del documento

---

**Última actualización:** $(date '+%Y-%m-%d %H:%M')
INDEXEOF

echo -e "${GREEN}✓ Índice regenerado correctamente${NC}"
echo ""
echo -e "${BLUE}Ubicación del índice:${NC}"
echo -e "  ${ARCHIVE_DIR}/00_INDICE.md"
echo ""
echo -e "${GREEN}¡Proceso completado exitosamente! 🎉${NC}"
