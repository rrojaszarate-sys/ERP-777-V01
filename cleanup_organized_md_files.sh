#!/bin/bash

# Script para eliminar archivos MD originales que ya fueron copiados
# Fecha: 17 de Octubre 2025
# PRECAUCIÓN: Este script elimina archivos permanentemente

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  LIMPIEZA DE ARCHIVOS MD ORGANIZADOS${NC}"
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

# Archivos a preservar (no eliminar)
PRESERVE_FILES=(
    "RESUMEN_ORGANIZACION_DOCS.md"
    "RESUMEN_FINAL_ORGANIZACION.md"
    "DOCUMENTACION_MAESTRA_SISTEMA.md"
)

echo -e "${YELLOW}⚠️  ADVERTENCIA: Este script eliminará archivos permanentemente${NC}"
echo ""
echo "Archivos que se preservarán:"
for file in "${PRESERVE_FILES[@]}"; do
    echo -e "  ${GREEN}✓${NC} $file"
done
echo ""

# Buscar archivos MD en el directorio raíz
md_files=$(find "$BASE_DIR" -maxdepth 1 -name "*.md" -type f)

# Contadores
checked=0
deleted=0
skipped=0
not_found=0

echo -e "${BLUE}Verificando archivos...${NC}"
echo ""

while IFS= read -r file; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    basename=$(basename "$file")
    
    # Saltar archivos preservados
    skip=false
    for preserve in "${PRESERVE_FILES[@]}"; do
        if [ "$basename" = "$preserve" ]; then
            echo -e "${YELLOW}⊘${NC} Preservado: ${basename}"
            ((skipped++))
            skip=true
            break
        fi
    done
    
    if [ "$skip" = true ]; then
        ((checked++))
        continue
    fi
    
    # Buscar el archivo en el archivo (sin el prefijo de fecha)
    base_name="${basename%.md}"
    found=$(find "$ARCHIVE_DIR" -name "*_${base_name}.md" -type f | head -1)
    
    if [ -n "$found" ]; then
        # El archivo existe en el archivo, eliminarlo
        rm "$file"
        echo -e "${GREEN}✓${NC} Eliminado: ${basename}"
        echo -e "  → Existe en archivo como: $(basename "$found")"
        ((deleted++))
    else
        echo -e "${RED}✗${NC} NO ENCONTRADO en archivo: ${basename}"
        ((not_found++))
    fi
    
    ((checked++))
    
done <<< "$md_files"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Limpieza completada${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Archivos verificados: ${BLUE}${checked}${NC}"
echo -e "Archivos eliminados:  ${GREEN}${deleted}${NC}"
echo -e "Archivos preservados: ${YELLOW}${skipped}${NC}"
echo -e "No encontrados:       ${RED}${not_found}${NC}"
echo ""

if [ $not_found -gt 0 ]; then
    echo -e "${RED}⚠️  ADVERTENCIA: Algunos archivos no se encontraron en el archivo${NC}"
    echo -e "${RED}   Revisa manualmente estos archivos antes de eliminarlos${NC}"
    echo ""
fi

# Verificar archivos restantes
remaining=$(find "$BASE_DIR" -maxdepth 1 -name "*.md" -type f | wc -l)
echo -e "Archivos MD restantes en raíz: ${BLUE}${remaining}${NC}"
echo ""

if [ $remaining -eq 3 ]; then
    echo -e "${GREEN}✓ Perfecto! Solo quedan los 3 documentos de resumen${NC}"
else
    echo -e "${YELLOW}⚠️  Quedan $remaining archivos MD en el directorio raíz${NC}"
    echo ""
    echo "Archivos restantes:"
    find "$BASE_DIR" -maxdepth 1 -name "*.md" -type f | while read -r f; do
        echo "  - $(basename "$f")"
    done
fi

echo ""
echo -e "${GREEN}¡Limpieza completada! 🎉${NC}"
