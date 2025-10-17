#!/bin/bash

# Script para eliminar archivos .md originales después de verificar el archivo
# ⚠️ USAR CON PRECAUCIÓN - Este script ELIMINA archivos permanentemente
# Fecha: 2025-10-17

BASE_DIR="/home/rodrichrz/proyectos/Made-Erp-777-ok/MADE-ERP-77"
DOCS_ARCHIVE="$BASE_DIR/docs_archive_20251017"

echo "⚠️  ADVERTENCIA: Este script eliminará los archivos .md originales"
echo "📂 Directorio: $BASE_DIR"
echo ""
echo "Presiona CTRL+C para cancelar o ENTER para continuar..."
read

echo ""
echo "🗑️  Eliminando archivos originales..."
echo ""

deleted_count=0

# Solo eliminar archivos .md en el directorio raíz que fueron archivados
for file in "$BASE_DIR"/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Verificar que el archivo existe en el archivo
        found=false
        for category in analisis correcciones deployment guias implementacion ocr configuracion resumen fixes debug otros; do
            if ls "$DOCS_ARCHIVE/$category"/*"$filename" >/dev/null 2>&1; then
                found=true
                break
            fi
        done
        
        if [ "$found" = true ]; then
            echo "  ✓ Eliminando: $filename"
            rm "$file"
            deleted_count=$((deleted_count + 1))
        else
            echo "  ⚠️  Conservando: $filename (no encontrado en archivo)"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Limpieza completada"
echo "   Archivos eliminados: $deleted_count"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Todos los documentos están en: $DOCS_ARCHIVE"
