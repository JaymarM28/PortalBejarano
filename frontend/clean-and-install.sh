#!/bin/bash

echo "🧹 Limpiando proyecto Angular..."

# Ir al directorio del frontend
cd "$(dirname "$0")"

# Eliminar node_modules
echo "📦 Eliminando node_modules..."
rm -rf node_modules

# Eliminar .angular (caché)
echo "🗑️ Eliminando caché de Angular..."
rm -rf .angular

# Eliminar dist
echo "🗑️ Eliminando build anterior..."
rm -rf dist

# Reinstalar dependencias
echo "📥 Reinstalando dependencias..."
npm install

echo ""
echo "✅ ¡Limpieza completada!"
echo ""
echo "Ahora ejecuta:"
echo "  npm start"
echo ""
