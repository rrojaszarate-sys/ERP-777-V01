#!/bin/bash

# Script para organizar documentos .md en carpetas clasificadas con fecha y numeración
# Fecha: 2025-10-17

BASE_DIR="/home/rodrichrz/proyectos/Made-Erp-777-ok/MADE-ERP-77"
DOCS_ARCHIVE="$BASE_DIR/docs_archive_$(date +%Y%m%d)"
DATE_PREFIX=$(date +%Y%m%d)

echo "📁 Iniciando organización de documentos..."
echo "📂 Directorio base: $BASE_DIR"
echo "📦 Archivo de destino: $DOCS_ARCHIVE"
echo ""

# Crear estructura de carpetas
mkdir -p "$DOCS_ARCHIVE"/{analisis,correcciones,deployment,guias,implementacion,ocr,configuracion,resumen,fixes,debug,otros}

echo "✅ Estructura de carpetas creada"
echo ""

# Contadores para numeración
declare -A counters
counters[analisis]=1
counters[correcciones]=1
counters[deployment]=1
counters[guias]=1
counters[implementacion]=1
counters[ocr]=1
counters[configuracion]=1
counters[resumen]=1
counters[fixes]=1
counters[debug]=1
counters[otros]=1

# Función para clasificar y mover archivos
classify_and_move() {
    local file=$1
    local filename=$(basename "$file")
    local category=""
    
    # Clasificación por nombre de archivo
    case "$filename" in
        ANALISIS_*.md)
            category="analisis"
            ;;
        CORRECCION_*.md|CORRECCIONES_*.md|ERRORES_*.md)
            category="correcciones"
            ;;
        DEPLOYMENT_*.md|DEPLOY_*.md|PASOS_DEPLOY_*.md)
            category="deployment"
            ;;
        GUIA_*.md|INSTRUCCIONES_*.md|INICIO_RAPIDO_*.md|COMO_*.md)
            category="guias"
            ;;
        IMPLEMENTACION_*.md|INTEGRACION_*.md)
            category="implementacion"
            ;;
        *OCR*.md|MAPEO_*.md|MEJORAS_EXTRACCION_*.md)
            category="ocr"
            ;;
        CONFIGURAR_*.md|*CONFIG*.md)
            category="configuracion"
            ;;
        RESUMEN_*.md|LISTA_*.md)
            category="resumen"
            ;;
        FIX_*.md|SOLUCION_*.md|PROBLEMA_*.md)
            category="fixes"
            ;;
        DEBUG_*.md|DIAGNOSTICO_*.md|DEBUGGING_*.md)
            category="debug"
            ;;
        README.md|COTIZACION_*.md|PLAN_*.md|PROPUESTA_*.md|CHECKLIST_*.md|VALIDATION_*.md|FLUJO_*.md)
            category="otros"
            ;;
        *)
            category="otros"
            ;;
    esac
    
    # Obtener el contador actual para la categoría
    local num=$(printf "%03d" ${counters[$category]})
    
    # Crear nuevo nombre con fecha y numeración
    local new_name="${DATE_PREFIX}_${num}_${filename}"
    local dest_path="$DOCS_ARCHIVE/$category/$new_name"
    
    # Mover archivo
    if [ -f "$file" ]; then
        cp "$file" "$dest_path"
        echo "  ✓ $filename → $category/$new_name"
        
        # Incrementar contador
        counters[$category]=$((${counters[$category]} + 1))
    fi
}

# Procesar archivos .md en el directorio raíz (excluyendo subdirectorios ya organizados)
echo "📄 Procesando archivos..."
echo ""

found_files=0
for file in "$BASE_DIR"/*.md; do
    if [ -f "$file" ]; then
        classify_and_move "$file"
        found_files=$((found_files + 1))
    fi
done

echo ""
echo "📊 Resumen de organización:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for category in "${!counters[@]}"; do
    count=$((${counters[$category]} - 1))
    if [ $count -gt 0 ]; then
        printf "  %-20s: %3d archivos\n" "$category" "$count"
    fi
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TOTAL: $found_files archivos procesados"
echo ""

# Crear índice
INDEX_FILE="$DOCS_ARCHIVE/00_INDICE.md"
echo "# 📚 Índice de Documentación Archivada" > "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**Fecha de archivo:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$INDEX_FILE"
echo "**Total de documentos:** $found_files" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

for category in analisis correcciones deployment guias implementacion ocr configuracion resumen fixes debug otros; do
    count=$((${counters[$category]} - 1))
    if [ $count -gt 0 ]; then
        echo "## 📁 $(echo $category | tr '[:lower:]' '[:upper:]')" >> "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        echo "Total: $count documentos" >> "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        
        # Listar archivos de la categoría
        for file in "$DOCS_ARCHIVE/$category"/*.md; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                echo "- [\`$filename\`](./$category/$filename)" >> "$INDEX_FILE"
            fi
        done
        echo "" >> "$INDEX_FILE"
    fi
done

echo "✅ Índice creado: $INDEX_FILE"
echo ""
echo "🎉 ¡Organización completada exitosamente!"
echo ""
echo "📂 Los documentos han sido copiados a: $DOCS_ARCHIVE"
echo "📋 Consulta el índice en: $INDEX_FILE"
echo ""
echo "⚠️  NOTA: Los archivos originales NO han sido eliminados."
echo "   Revisa el contenido del archivo y elimina los originales manualmente si es necesario."
