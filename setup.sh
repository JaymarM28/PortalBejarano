#!/bin/bash

echo "🚀 Iniciando Sistema de Gestión de Pagos"
echo ""

# Verificar si existe PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado. Por favor instala PostgreSQL primero."
    exit 1
fi

echo "✅ PostgreSQL encontrado"
echo ""

# Crear base de datos
echo "📦 Creando base de datos..."
createdb payroll_db 2>/dev/null || echo "⚠️  La base de datos ya existe"
echo ""

# Backend
echo "🔧 Configurando Backend..."
cd backend

# Crear .env si no existe
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Archivo .env creado. Por favor edita las configuraciones si es necesario."
else
    echo "⚠️  El archivo .env ya existe"
fi

# Crear directorio de uploads
mkdir -p uploads/signed-documents
echo "✅ Directorio de uploads creado"

# Instalar dependencias
echo "📦 Instalando dependencias del backend..."
npm install
echo ""

# Frontend
echo "🔧 Configurando Frontend..."
cd ../frontend

# Instalar dependencias
echo "📦 Instalando dependencias del frontend..."
npm install
echo ""

cd ..

echo "✅ ¡Configuración completada!"
echo ""
echo "📝 Pasos siguientes:"
echo "1. Edita backend/.env con tus configuraciones de base de datos"
echo "2. En una terminal: cd backend && npm run start:dev"
echo "3. En otra terminal: cd frontend && npm start"
echo "4. Crea tu primer Super Admin con:"
echo "   curl -X POST http://localhost:3000/api/auth/register \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@example.com\",\"password\":\"password123\",\"fullName\":\"Admin\"}'"
echo ""
echo "🌐 Luego accede a http://localhost:4200"
