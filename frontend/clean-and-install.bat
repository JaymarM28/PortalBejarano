@echo off
echo 🧹 Limpiando proyecto Angular...
echo.

echo 📦 Eliminando node_modules...
rmdir /s /q node_modules 2>nul

echo 🗑️ Eliminando caché de Angular...
rmdir /s /q .angular 2>nul

echo 🗑️ Eliminando build anterior...
rmdir /s /q dist 2>nul

echo 📥 Reinstalando dependencias...
call npm install

echo.
echo ✅ ¡Limpieza completada!
echo.
echo Ahora ejecuta:
echo   npm start
echo.
pause
