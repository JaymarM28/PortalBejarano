#!/bin/bash

echo "🔍 Diagnóstico de PostgreSQL para Payroll System"
echo "================================================"
echo ""

# Verificar si PostgreSQL está instalado
echo "1. Verificando instalación de PostgreSQL..."
if command -v psql &> /dev/null; then
    VERSION=$(psql --version)
    echo "   ✅ PostgreSQL instalado: $VERSION"
else
    echo "   ❌ PostgreSQL NO está instalado"
    echo ""
    echo "   Instala PostgreSQL:"
    echo "   - Mac: brew install postgresql@14"
    echo "   - Linux: sudo apt install postgresql"
    exit 1
fi

echo ""

# Verificar si está corriendo (Mac)
echo "2. Verificando si PostgreSQL está corriendo..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    if brew services list | grep -q "postgresql.*started"; then
        echo "   ✅ PostgreSQL está corriendo"
    else
        echo "   ❌ PostgreSQL NO está corriendo"
        echo ""
        echo "   Iniciarlo con:"
        echo "   brew services start postgresql@14"
        exit 1
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if systemctl is-active --quiet postgresql; then
        echo "   ✅ PostgreSQL está corriendo"
    else
        echo "   ❌ PostgreSQL NO está corriendo"
        echo ""
        echo "   Iniciarlo con:"
        echo "   sudo systemctl start postgresql"
        exit 1
    fi
fi

echo ""

# Verificar conexión
echo "3. Verificando conexión a PostgreSQL..."
if psql -U postgres -d postgres -c "SELECT 1" &> /dev/null; then
    echo "   ✅ Conexión exitosa"
else
    echo "   ⚠️  No se puede conectar con usuario 'postgres' y sin password"
    echo ""
    echo "   Esto es normal si configuraste password."
    echo "   Crea un archivo backend/.env con tus credenciales:"
    echo ""
    echo "   DB_HOST=localhost"
    echo "   DB_PORT=5432"
    echo "   DB_USERNAME=postgres"
    echo "   DB_PASSWORD=tu_password"
    echo "   DB_NAME=payroll_db"
fi

echo ""

# Verificar si existe la base de datos
echo "4. Verificando base de datos 'payroll_db'..."
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw payroll_db; then
    echo "   ✅ Base de datos 'payroll_db' existe"
else
    echo "   ❌ Base de datos 'payroll_db' NO existe"
    echo ""
    echo "   Créala con:"
    echo "   psql -U postgres -c 'CREATE DATABASE payroll_db;'"
    echo ""
    echo "   ¿Quieres que la cree ahora? (s/n)"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        psql -U postgres -c "CREATE DATABASE payroll_db;"
        if [ $? -eq 0 ]; then
            echo "   ✅ Base de datos creada exitosamente"
        else
            echo "   ❌ Error al crear base de datos"
            echo "   Intenta manualmente: psql -U postgres -c 'CREATE DATABASE payroll_db;'"
        fi
    fi
fi

echo ""
echo "================================================"
echo "✅ Diagnóstico completado"
echo ""
echo "Siguiente paso:"
echo "cd backend && npm run start:dev"
echo ""
