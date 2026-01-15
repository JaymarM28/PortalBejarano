# Backend - Sistema de Pagos

## ✅ Backend Completo y Funcional

Incluye TODOS los módulos:
- ✅ Autenticación JWT
- ✅ Usuarios
- ✅ Empleadas
- ✅ Pagos (con PDF y firma digital)
- ✅ Categorías
- ✅ Gastos de Mercado

---

## 🚀 Instalación Rápida (3 pasos)

```bash
# 1. Instalar
npm install

# 2. Crear base de datos
psql -U postgres -c "CREATE DATABASE payroll_db;"

# 3. Iniciar
npm run start:dev
```

**Deberías ver:**
```
✅ [TypeOrmModule] dependencies initialized
✅ [AppModule] dependencies initialized  
✅ Nest application successfully started
```

---

## ⚙️ Configuración (Opcional)

Si tu password de PostgreSQL NO es "postgres":

```bash
# Copiar plantilla
cp .env.example .env

# Editar .env con tus credenciales
DB_PASSWORD=tu_password
```

---

## 🔍 Verificar que Funciona

```bash
# Login con usuario inicial
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin123"}'
```

Debería devolver un token JWT ✅

---

## 🔐 Usuario Inicial

```
Email: admin@admin.com
Password: admin123
```

⚠️ Cambia esta contraseña después del primer login

---

## 📁 Estructura

```
backend/
├── .env.example          ← Plantilla de configuración
├── .gitignore            ← Archivos ignorados
├── package.json          ← Dependencias
└── src/
    ├── auth/             ← Autenticación
    ├── users/            ← Usuarios
    ├── employees/        ← Empleadas
    ├── payments/         ← Pagos + PDF
    ├── categories/       ← Categorías
    └── market-expenses/  ← Gastos de mercado
```

---

## 🐛 Solución de Problemas

### "Unable to connect to database"
```bash
# Verificar PostgreSQL
brew services list | grep postgresql  # Mac
systemctl status postgresql           # Linux

# Crear base de datos
psql -U postgres -c "CREATE DATABASE payroll_db;"
```

### "password authentication failed"
```bash
# Configurar password en .env
cp .env.example .env
# Editar: DB_PASSWORD=tu_password
```

---

## 📊 Endpoints Principales

- `POST /auth/login` - Login
- `GET /users` - Usuarios (Super Admin)
- `GET /employees` - Empleadas
- `GET /payments` - Pagos
- `GET /payments/:id/pdf` - Descargar PDF
- `POST /payments/:id/sign` - Firmar pago
- `GET /categories` - Categorías (Super Admin)
- `GET /market-expenses` - Gastos de mercado

---

## ✅ Checklist

- [ ] npm install sin errores
- [ ] PostgreSQL corriendo
- [ ] Base de datos creada
- [ ] Backend inicia sin errores
- [ ] Login funciona

---

¡Listo para usar! 🚀
