#!/bin/bash

# Script para integrar archivos SQL y MD restantes en los archivos organizados
# Fecha: 2025-10-17
# Versión: 2.0 - Incluye directorios adicionales

BASE_DIR="/home/rodrichrz/proyectos/Made-Erp-777-ok"
MADE_DIR="$BASE_DIR/MADE-ERP-77"
SQL_ARCHIVE="$MADE_DIR/sql_archive_20251017"
DOCS_ARCHIVE="$MADE_DIR/docs_archive_20251017"
DATE_PREFIX=$(date +%Y%m%d)

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║     🔄 INTEGRACIÓN DE ARCHIVOS ADICIONALES                   ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📂 Buscando archivos SQL y MD en directorios adicionales..."
echo ""

# Contadores
declare -A sql_counters
declare -A md_counters

# Obtener contadores actuales de SQL
for category in migraciones fixes usuarios verificaciones configuracion otros; do
    count=$(ls -1 "$SQL_ARCHIVE/$category" 2>/dev/null | wc -l)
    sql_counters[$category]=$((count + 1))
done

# Obtener contadores actuales de MD
for category in analisis correcciones deployment guias implementacion ocr configuracion resumen fixes debug otros; do
    count=$(ls -1 "$DOCS_ARCHIVE/$category" 2>/dev/null | wc -l)
    md_counters[$category]=$((count + 1))
done

# Función para clasificar y mover archivos SQL adicionales
classify_and_move_additional_sql() {
    local file=$1
    local filename=$(basename "$file")
    local category=""
    
    case "$filename" in
        *migration*|*add_*.sql|*alter_*.sql|*insert_*.sql)
            category="migraciones"
            ;;
        *)
            category="configuracion"
            ;;
    esac
    
    local num=$(printf "%03d" ${sql_counters[$category]})
    local new_name="${DATE_PREFIX}_${num}_${filename}"
    local dest_path="$SQL_ARCHIVE/$category/$new_name"
    
    if [ -f "$file" ]; then
        cp "$file" "$dest_path"
        echo "  ✓ SQL: $filename → $category/$new_name"
        sql_counters[$category]=$((${sql_counters[$category]} + 1))
        return 0
    fi
    return 1
}

# Función para clasificar y mover archivos MD adicionales
classify_and_move_additional_md() {
    local file=$1
    local filename=$(basename "$file")
    local category=""
    
    case "$filename" in
        README*.md)
            category="otros"
            ;;
        *GUIDE*.md|*GUIA*.md|*INSTRUCTIONS*.md)
            category="guias"
            ;;
        *)
            category="otros"
            ;;
    esac
    
    local num=$(printf "%03d" ${md_counters[$category]})
    local new_name="${DATE_PREFIX}_${num}_${filename}"
    local dest_path="$DOCS_ARCHIVE/$category/$new_name"
    
    if [ -f "$file" ]; then
        cp "$file" "$dest_path"
        echo "  ✓ MD: $filename → $category/$new_name"
        md_counters[$category]=$((${md_counters[$category]} + 1))
        return 0
    fi
    return 1
}

# Procesar archivos SQL adicionales
echo "📄 Procesando archivos SQL adicionales..."
echo ""

sql_found=0

# Buscar en directorio supabase
if [ -d "$BASE_DIR/supabase" ]; then
    for file in "$BASE_DIR/supabase"/*.sql; do
        if [ -f "$file" ]; then
            classify_and_move_additional_sql "$file" && sql_found=$((sql_found + 1))
        fi
    done
fi

# Buscar en directorio database
if [ -d "$BASE_DIR/database" ]; then
    for file in $(find "$BASE_DIR/database" -type f -name "*.sql" 2>/dev/null); do
        if [ -f "$file" ]; then
            classify_and_move_additional_sql "$file" && sql_found=$((sql_found + 1))
        fi
    done
fi

# Buscar en raíz del proyecto
for file in "$BASE_DIR"/*.sql; do
    if [ -f "$file" ]; then
        classify_and_move_additional_sql "$file" && sql_found=$((sql_found + 1))
    fi
done

echo ""
echo "📄 Procesando archivos MD adicionales..."
echo ""

md_found=0

# Buscar en directorio supabase
if [ -d "$BASE_DIR/supabase" ]; then
    for file in "$BASE_DIR/supabase"/*.md; do
        if [ -f "$file" ]; then
            classify_and_move_additional_md "$file" && md_found=$((md_found + 1))
        fi
    done
fi

# Buscar en directorio database
if [ -d "$BASE_DIR/database" ]; then
    for file in $(find "$BASE_DIR/database" -type f -name "*.md" 2>/dev/null); do
        if [ -f "$file" ]; then
            classify_and_move_additional_md "$file" && md_found=$((md_found + 1))
        fi
    done
fi

# Buscar en raíz del proyecto
for file in "$BASE_DIR"/*.md; do
    if [ -f "$file" ]; then
        classify_and_move_additional_md "$file" && md_found=$((md_found + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMEN DE INTEGRACIÓN:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📁 Archivos SQL integrados: $sql_found"
echo "  📁 Archivos MD integrados:  $md_found"
echo ""
echo "  📦 Total procesados: $((sql_found + md_found))"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $sql_found -gt 0 ] || [ $md_found -gt 0 ]; then
    echo ""
    echo "✅ Archivos integrados exitosamente"
    echo ""
    echo "📂 Ubicaciones:"
    echo "   SQL: $SQL_ARCHIVE"
    echo "   MD:  $DOCS_ARCHIVE"
    
    # Actualizar índices
    if [ $sql_found -gt 0 ]; then
        echo ""
        echo "🔄 Actualizando índice SQL..."
        
        INDEX_FILE="$SQL_ARCHIVE/00_INDICE_SQL.md"
        echo "# 📚 Índice de Archivos SQL Archivados" > "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        echo "**Fecha de actualización:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$INDEX_FILE"
        
        total_sql=0
        for category in migraciones fixes usuarios verificaciones configuracion otros; do
            count=$((${sql_counters[$category]} - 1))
            total_sql=$((total_sql + count))
        done
        
        echo "**Total de archivos SQL:** $total_sql" >> "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        
        for category in migraciones fixes usuarios verificaciones configuracion otros; do
            count=$((${sql_counters[$category]} - 1))
            if [ $count -gt 0 ]; then
                echo "## 📁 $(echo $category | tr '[:lower:]' '[:upper:]')" >> "$INDEX_FILE"
                echo "" >> "$INDEX_FILE"
                echo "Total: $count archivos" >> "$INDEX_FILE"
                echo "" >> "$INDEX_FILE"
                
                for file in "$SQL_ARCHIVE/$category"/*.sql; do
                    if [ -f "$file" ]; then
                        filename=$(basename "$file")
                        echo "- [\`$filename\`](./$category/$filename)" >> "$INDEX_FILE"
                    fi
                done
                echo "" >> "$INDEX_FILE"
            fi
        done
        
        echo "   ✅ Índice SQL actualizado"
    fi
    
    if [ $md_found -gt 0 ]; then
        echo "🔄 Actualizando índice MD..."
        
        INDEX_FILE="$DOCS_ARCHIVE/00_INDICE.md"
        echo "# 📚 Índice de Documentación Archivada" > "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        echo "**Fecha de actualización:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$INDEX_FILE"
        
        total_md=0
        for category in analisis correcciones deployment guias implementacion ocr configuracion resumen fixes debug otros; do
            count=$((${md_counters[$category]} - 1))
            total_md=$((total_md + count))
        done
        
        echo "**Total de documentos:** $total_md" >> "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        
        for category in analisis correcciones deployment guias implementacion ocr configuracion resumen fixes debug otros; do
            count=$((${md_counters[$category]} - 1))
            if [ $count -gt 0 ]; then
                echo "## 📁 $(echo $category | tr '[:lower:]' '[:upper:]')" >> "$INDEX_FILE"
                echo "" >> "$INDEX_FILE"
                echo "Total: $count documentos" >> "$INDEX_FILE"
                echo "" >> "$INDEX_FILE"
                
                for file in "$DOCS_ARCHIVE/$category"/*.md; do
                    if [ -f "$file" ]; then
                        filename=$(basename "$file")
                        echo "- [\`$filename\`](./$category/$filename)" >> "$INDEX_FILE"
                    fi
                done
                echo "" >> "$INDEX_FILE"
            fi
        done
        
        echo "   ✅ Índice MD actualizado"
    fi
else
    echo ""
    echo "ℹ️  No se encontraron archivos adicionales para integrar"
fi

echo ""
echo "🎉 Proceso completado"
echo ""
