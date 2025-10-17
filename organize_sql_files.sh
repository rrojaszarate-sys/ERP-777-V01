#!/bin/bash

# Script para organizar archivos SQL en carpetas clasificadas con fecha y numeración
# Fecha: 2025-10-17

BASE_DIR="/home/rodrichrz/proyectos/Made-Erp-777-ok/MADE-ERP-77"
SQL_ARCHIVE="$BASE_DIR/sql_archive_$(date +%Y%m%d)"
DATE_PREFIX=$(date +%Y%m%d)

echo "📁 Iniciando organización de archivos SQL..."
echo "📂 Directorio base: $BASE_DIR"
echo "📦 Archivo de destino: $SQL_ARCHIVE"
echo ""

# Crear estructura de carpetas
mkdir -p "$SQL_ARCHIVE"/{migraciones,fixes,usuarios,verificaciones,configuracion,otros}

echo "✅ Estructura de carpetas creada"
echo ""

# Contadores para numeración
declare -A counters
counters[migraciones]=1
counters[fixes]=1
counters[usuarios]=1
counters[verificaciones]=1
counters[configuracion]=1
counters[otros]=1

# Función para clasificar y mover archivos SQL
classify_and_move_sql() {
    local file=$1
    local filename=$(basename "$file")
    local category=""
    
    # Clasificación por nombre de archivo
    case "$filename" in
        *migration*|*MIGRACION*|EJECUTAR_MIGRACIONES.sql|*add_*.sql|*alter_*.sql)
            category="migraciones"
            ;;
        FIX_*.sql|*fix_*.sql|PASO_*.sql)
            category="fixes"
            ;;
        *USUARIO*.sql|*user*.sql|CREAR_USUARIO*.sql)
            category="usuarios"
            ;;
        VERIFICAR_*.sql|check_*.sql|DIAGNOSTICO_*.sql|PRUEBAS_*.sql)
            category="verificaciones"
            ;;
        CREAR_POLITICAS*.sql|CREATE_*.sql|ADD_*.sql)
            category="configuracion"
            ;;
        *)
            category="otros"
            ;;
    esac
    
    # Obtener el contador actual para la categoría
    local num=$(printf "%03d" ${counters[$category]})
    
    # Crear nuevo nombre con fecha y numeración
    local new_name="${DATE_PREFIX}_${num}_${filename}"
    local dest_path="$SQL_ARCHIVE/$category/$new_name"
    
    # Copiar archivo
    if [ -f "$file" ]; then
        cp "$file" "$dest_path"
        echo "  ✓ $filename → $category/$new_name"
        
        # Incrementar contador
        counters[$category]=$((${counters[$category]} + 1))
    fi
}

# Procesar archivos .sql en el directorio raíz
echo "📄 Procesando archivos SQL del directorio raíz..."
echo ""

found_files=0
for file in "$BASE_DIR"/*.sql; do
    if [ -f "$file" ]; then
        classify_and_move_sql "$file"
        found_files=$((found_files + 1))
    fi
done

# Procesar migraciones de supabase_old
if [ -d "$BASE_DIR/supabase_old/migrations" ]; then
    echo ""
    echo "📄 Procesando migraciones de supabase_old..."
    echo ""
    for file in "$BASE_DIR/supabase_old/migrations"/*.sql; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            num=$(printf "%03d" ${counters[migraciones]})
            new_name="${DATE_PREFIX}_${num}_${filename}"
            dest_path="$SQL_ARCHIVE/migraciones/$new_name"
            
            cp "$file" "$dest_path"
            echo "  ✓ migrations/$filename → migraciones/$new_name"
            
            counters[migraciones]=$((${counters[migraciones]} + 1))
            found_files=$((found_files + 1))
        fi
    done
fi

echo ""
echo "📊 Resumen de organización SQL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for category in "${!counters[@]}"; do
    count=$((${counters[$category]} - 1))
    if [ $count -gt 0 ]; then
        printf "  %-20s: %3d archivos\n" "$category" "$count"
    fi
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TOTAL: $found_files archivos SQL procesados"
echo ""

# Crear índice SQL
INDEX_FILE="$SQL_ARCHIVE/00_INDICE_SQL.md"
echo "# 📚 Índice de Archivos SQL Archivados" > "$INDEX_FILE"
echo "" >> "$INDEX_FILE"
echo "**Fecha de archivo:** $(date '+%Y-%m-%d %H:%M:%S')" >> "$INDEX_FILE"
echo "**Total de archivos SQL:** $found_files" >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

for category in migraciones fixes usuarios verificaciones configuracion otros; do
    count=$((${counters[$category]} - 1))
    if [ $count -gt 0 ]; then
        echo "## 📁 $(echo $category | tr '[:lower:]' '[:upper:]')" >> "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        echo "Total: $count archivos" >> "$INDEX_FILE"
        echo "" >> "$INDEX_FILE"
        
        # Listar archivos de la categoría
        for file in "$SQL_ARCHIVE/$category"/*.sql; do
            if [ -f "$file" ]; then
                filename=$(basename "$file")
                echo "- [\`$filename\`](./$category/$filename)" >> "$INDEX_FILE"
            fi
        done
        echo "" >> "$INDEX_FILE"
    fi
done

echo "✅ Índice SQL creado: $INDEX_FILE"
echo ""
echo "🎉 ¡Organización de archivos SQL completada!"
echo ""
echo "📂 Los archivos SQL han sido copiados a: $SQL_ARCHIVE"
echo "📋 Consulta el índice en: $INDEX_FILE"
