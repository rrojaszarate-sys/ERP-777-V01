#!/bin/bash

# Script DIRECTO para eliminar archivos MD ya organizados
# Fecha: 17 de Octubre 2025

set -e

BASE_DIR="/home/rodrichrz/proyectos/Made-Erp-777-ok/MADE-ERP-77"
ARCHIVE_DIR="${BASE_DIR}/docs_archive_20251017"

echo "🗑️  ELIMINANDO ARCHIVOS MD ORGANIZADOS"
echo "=========================================="
echo ""

deleted=0
preserved=0

cd "$BASE_DIR"

# Eliminar todos los archivos MD EXCEPTO los 3 documentos de resumen
for file in *.md; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Preservar estos 3 archivos
    if [ "$file" = "RESUMEN_ORGANIZACION_DOCS.md" ] || \
       [ "$file" = "RESUMEN_FINAL_ORGANIZACION.md" ] || \
       [ "$file" = "DOCUMENTACION_MAESTRA_SISTEMA.md" ]; then
        echo "✓ Preservado: $file"
        ((preserved++))
        continue
    fi
    
    # Verificar que existe en el archivo antes de eliminar
    basename_no_ext="${file%.md}"
    if find "$ARCHIVE_DIR" -name "*_${basename_no_ext}.md" -type f | grep -q .; then
        rm "$file"
        echo "🗑️  Eliminado: $file"
        ((deleted++))
    else
        echo "⚠️  NO ENCONTRADO en archivo: $file"
    fi
done

echo ""
echo "=========================================="
echo "✅ LIMPIEZA COMPLETADA"
echo "=========================================="
echo ""
echo "Archivos eliminados: $deleted"
echo "Archivos preservados: $preserved"
echo ""

remaining=$(ls -1 *.md 2>/dev/null | wc -l)
echo "Archivos MD restantes: $remaining"
echo ""

if [ $remaining -eq 3 ]; then
    echo "✅ PERFECTO! Solo quedan los 3 documentos de resumen:"
    ls -1 *.md
else
    echo "⚠️  Archivos restantes:"
    ls -1 *.md
fi
