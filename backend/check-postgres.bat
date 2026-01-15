@echo off
echo 🔍 Diagnostico de PostgreSQL para Payroll System
echo ================================================
echo.

echo 1. Verificando instalacion de PostgreSQL...
where psql >nul 2>nul
if %errorlevel% equ 0 (
    echo    ✅ PostgreSQL instalado
    psql --version
) else (
    echo    ❌ PostgreSQL NO esta instalado
    echo.
    echo    Descarga e instala desde:
    echo    https://www.postgresql.org/download/windows/
    exit /b 1
)

echo.
echo 2. Verificando servicio de PostgreSQL...
sc query postgresql-x64-14 | find "RUNNING" >nul
if %errorlevel% equ 0 (
    echo    ✅ PostgreSQL esta corriendo
) else (
    echo    ❌ PostgreSQL NO esta corriendo
    echo.
    echo    Inicialo desde:
    echo    - Servicios (services.msc) ^> PostgreSQL ^> Iniciar
    echo    O ejecuta como administrador:
    echo    net start postgresql-x64-14
    exit /b 1
)

echo.
echo 3. Verificando conexion a PostgreSQL...
psql -U postgres -d postgres -c "SELECT 1" >nul 2>nul
if %errorlevel% equ 0 (
    echo    ✅ Conexion exitosa
) else (
    echo    ⚠️  No se puede conectar con usuario 'postgres'
    echo.
    echo    Esto es normal si configuraste password.
    echo    Crea un archivo backend\.env con tus credenciales:
    echo.
    echo    DB_HOST=localhost
    echo    DB_PORT=5432
    echo    DB_USERNAME=postgres
    echo    DB_PASSWORD=tu_password
    echo    DB_NAME=payroll_db
)

echo.
echo 4. Verificando base de datos 'payroll_db'...
psql -U postgres -l | find "payroll_db" >nul
if %errorlevel% equ 0 (
    echo    ✅ Base de datos 'payroll_db' existe
) else (
    echo    ❌ Base de datos 'payroll_db' NO existe
    echo.
    echo    Creala con:
    echo    psql -U postgres -c "CREATE DATABASE payroll_db;"
    echo.
    set /p response="¿Quieres que la cree ahora? (s/n): "
    if /i "%response%"=="s" (
        psql -U postgres -c "CREATE DATABASE payroll_db;"
        if %errorlevel% equ 0 (
            echo    ✅ Base de datos creada exitosamente
        ) else (
            echo    ❌ Error al crear base de datos
        )
    )
)

echo.
echo ================================================
echo ✅ Diagnostico completado
echo.
echo Siguiente paso:
echo cd backend ^&^& npm run start:dev
echo.
pause
