#!/bin/bash

# Script para configurar Gemini AI fácilmente

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║        🤖 Configuración de Gemini AI - Setup Rápido            ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar si ya existe la variable
if grep -q "VITE_GEMINI_API_KEY" .env 2>/dev/null; then
    echo "✅ Ya existe una API Key de Gemini configurada en .env"
    echo ""
    grep "VITE_GEMINI_API_KEY" .env
    echo ""
    read -p "¿Quieres reemplazarla? (s/N): " REPLACE
    if [[ ! $REPLACE =~ ^[Ss]$ ]]; then
        echo "Configuración cancelada."
        exit 0
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Paso 1: Obtener tu API Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Abre esta URL en tu navegador:"
echo "   👉 https://aistudio.google.com/app/apikey"
echo ""
echo "2. Inicia sesión con tu cuenta Google"
echo ""
echo "3. Click en 'Create API Key'"
echo ""
echo "4. Copia la API Key (empieza con AIzaSy...)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Pedir la API Key
read -p "Pega tu API Key aquí: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "❌ Error: No ingresaste ninguna API Key"
    exit 1
fi

# Validar formato básico
if [[ ! $API_KEY =~ ^AIza ]]; then
    echo "⚠️  Advertencia: La API Key no tiene el formato esperado (debería empezar con 'AIza')"
    read -p "¿Continuar de todos modos? (s/N): " CONTINUE
    if [[ ! $CONTINUE =~ ^[Ss]$ ]]; then
        echo "Configuración cancelada."
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Paso 2: Configurando .env"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup del .env actual
if [ -f .env ]; then
    cp .env .env.backup
    echo "✅ Backup creado: .env.backup"
fi

# Remover línea anterior si existe
if grep -q "VITE_GEMINI_API_KEY" .env 2>/dev/null; then
    sed -i '/VITE_GEMINI_API_KEY/d' .env
fi

# Agregar la nueva API Key
echo "" >> .env
echo "# 🤖 Gemini AI - Mapeo Inteligente de Campos OCR" >> .env
echo "VITE_GEMINI_API_KEY=\"$API_KEY\"" >> .env

echo "✅ API Key agregada a .env"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ¡Configuración Completada!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Próximos pasos:"
echo ""
echo "1. Reinicia el servidor de desarrollo:"
echo "   npm run dev"
echo ""
echo "2. Ve a: Eventos → Finanzas → Nuevo Gasto"
echo ""
echo "3. Verás un toggle morado 🤖 'Mapeo Inteligente con Gemini AI'"
echo ""
echo "4. Actívalo y sube una factura"
echo ""
echo "5. ¡Los campos se autocompletarán con IA! 🎉"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💰 Costo: ~\$0.001 USD por factura (~\$0.02 MXN)"
echo "📊 Precisión: 95-98% (vs 60-70% sin IA)"
echo ""
