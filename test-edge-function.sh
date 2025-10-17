#!/bin/bash

# Test simple de la Edge Function

echo "🧪 Probando Edge Function de OCR..."
echo ""

# Crear imagen de prueba pequeña en base64 (1x1 pixel blanco)
BASE64_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

echo "📡 Enviando request a Edge Function..."
echo ""

curl -X POST \
  "https://gomnouwackzvthpwyric.supabase.co/functions/v1/ocr-process" \
  -H "Content-Type: application/json" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -d "{\"fileBase64\": \"${BASE64_IMAGE}\", \"fileName\": \"test.png\"}" \
  -w "\n\n⏱️  Tiempo total: %{time_total}s\n" \
  -v

echo ""
echo "✅ Test completado"
