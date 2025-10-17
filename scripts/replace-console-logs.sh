#!/bin/bash

# Script para reemplazar console.logs con logger en archivos específicos
# Uso: ./scripts/replace-console-logs.sh

echo "🔄 Reemplazando console.logs con logger..."

# Archivos a procesar
FILES=(
  "src/modules/eventos/hooks/useEventStates.ts"
  "src/modules/eventos/hooks/useEvents.ts"
  "src/modules/eventos/hooks/useClients.ts"
  "src/modules/eventos/hooks/useDashboardMetrics.ts"
  "src/modules/eventos/components/documents/DocumentosEvento.tsx"
  "src/modules/eventos/components/events/EventForm.tsx"
)

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creando backups en: $BACKUP_DIR"

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ Backup: $file"
    cp "$file" "$BACKUP_DIR/"
  fi
done

echo ""
echo "⚠️  IMPORTANTE:"
echo "   Este script requiere revisión manual de cada archivo."
echo "   Los backups están en: $BACKUP_DIR"
echo ""
echo "Archivos a revisar manualmente:"
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    count=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
    if [ "$count" -gt 0 ]; then
      echo "  - $file ($count console.logs)"
    fi
  fi
done

echo ""
echo "✅ Backups creados. Proceder con revisión manual."
