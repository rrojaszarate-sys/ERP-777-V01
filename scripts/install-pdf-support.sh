#!/bin/bash
# Script de instalación para soporte de PDFs con OCR

echo "📦 Instalando dependencias para procesamiento de PDFs..."
echo ""

# Instalar pdfjs-dist
echo "1️⃣ Instalando pdfjs-dist (Mozilla PDF.js)..."
npm install pdfjs-dist --save

echo ""
echo "✅ Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Verifica que .env contenga VITE_GOOGLE_SERVICE_ACCOUNT_KEY"
echo "   2. Asegúrate de que el bucket 'event_docs' existe en Supabase"
echo "   3. Reinicia el servidor de desarrollo (npm run dev)"
echo ""
echo "📚 Lee GUIA_PDF_OCR.md para más información"
echo ""
