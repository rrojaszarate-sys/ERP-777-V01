#!/bin/bash

# Script para regenerar tipos de Supabase
# Requiere estar autenticado: npx supabase login

echo "🔄 Regenerando tipos de Supabase..."

# Verificar si supabase CLI está disponible
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado"
    echo "Instalar con: npm install -g supabase"
    exit 1
fi

# Obtener project ID del .env
PROJECT_ID="gomnouwackzvthpwyric"

echo "📦 Generando tipos para proyecto: $PROJECT_ID"

# Generar tipos
npx supabase gen types typescript --project-id "$PROJECT_ID" > src/core/types/database.generated.ts

if [ $? -eq 0 ]; then
    echo "✅ Tipos generados exitosamente en src/core/types/database.generated.ts"
    echo ""
    echo "Próximo paso:"
    echo "1. Revisar el archivo generado"
    echo "2. Actualizar las importaciones si es necesario"
    echo "3. Hacer backup del database.ts actual si es necesario"
else
    echo "❌ Error al generar tipos"
    echo ""
    echo "Posibles soluciones:"
    echo "1. Ejecutar: npx supabase login"
    echo "2. Verificar que el PROJECT_ID es correcto"
    echo "3. Verificar conexión a internet"
    exit 1
fi
