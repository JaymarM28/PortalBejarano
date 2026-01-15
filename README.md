# Sistema de Gestión de Pagos

Sistema completo para gestionar comprobantes de pago de empleadas domésticas con generación de PDFs, firma digital y administración de usuarios.

## 🚀 Características

- ✅ **Gestión de Empleadas**: Alta, baja, modificación de empleadas
- ✅ **Registro de Pagos**: Creación de comprobantes con salarios, bonificaciones y deducciones
- ✅ **Generación de PDFs**: Comprobantes profesionales descargables
- ✅ **Firma Digital**: Opción de firma digital o carga de documento firmado físicamente
- ✅ **Historial Completo**: Registro detallado de todos los pagos realizados
- ✅ **Sistema de Usuarios**: Roles de Super Admin y Admin
- ✅ **Autenticación JWT**: Sistema de login seguro

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 12+
- npm o yarn

## 🛠️ Instalación

### 1. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb payroll_db

# O usando psql
psql -U postgres
CREATE DATABASE payroll_db;
\q
```

### 2. Backend (NestJS)

```bash
# Ir al directorio del backend
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus configuraciones
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=postgres
# DB_PASSWORD=tu_password
# DB_NAME=payroll_db
# JWT_SECRET=tu-secreto-super-seguro

# Crear carpeta para archivos subidos
mkdir -p uploads/signed-documents

# Iniciar el servidor de desarrollo
npm run start:dev
```

El backend estará corriendo en `http://localhost:3000`

### 3. Frontend (Angular)

```bash
# Ir al directorio del frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npm start
```

El frontend estará corriendo en `http://localhost:4200`

## 👤 Primer Uso

### Crear Super Admin

Para crear el primer usuario Super Admin, usa este endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "fullName": "Administrador Principal"
  }'
```

Este primer usuario será automáticamente Super Admin.

## 🔐 Roles de Usuario

- **Super Admin**: 
  - Puede crear nuevos usuarios administradores
  - Acceso completo a todas las funcionalidades
  
- **Admin**: 
  - Puede gestionar empleadas
  - Puede crear y gestionar pagos
  - No puede crear usuarios

## 📖 Uso de la Aplicación

### Login
1. Accede a `http://localhost:4200`
2. Ingresa tus credenciales
3. Serás redirigido al dashboard

### Gestión de Empleadas
1. Navega a la pestaña "Empleadas"
2. Haz clic en "+ Nueva Empleada"
3. Completa el formulario con los datos
4. Guarda para crear la empleada

### Crear Comprobante de Pago
1. Navega a la pestaña "Pagos"
2. Haz clic en "+ Nuevo Pago"
3. Selecciona la empleada
4. Ingresa la fecha de pago
5. Define salario base, bonificaciones y deducciones
6. El total se calcula automáticamente
7. Agrega notas si es necesario
8. Guarda el comprobante

### Generar PDF
1. En la lista de pagos, haz clic en el ícono 📄
2. El PDF se descargará automáticamente
3. El PDF incluye todos los detalles del pago

### Gestión de Usuarios (Solo Super Admin)
1. Navega a la pestaña "Usuarios"
2. Haz clic en "+ Nuevo Usuario"
3. Completa el formulario
4. El nuevo usuario será Admin (no Super Admin)

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/me` - Obtener usuario actual

### Empleadas
- `GET /api/employees` - Listar empleadas
- `GET /api/employees/:id` - Obtener empleada
- `POST /api/employees` - Crear empleada
- `PATCH /api/employees/:id` - Actualizar empleada
- `DELETE /api/employees/:id` - Eliminar empleada

### Pagos
- `GET /api/payments` - Listar pagos
- `GET /api/payments/:id` - Obtener pago
- `POST /api/payments` - Crear pago
- `POST /api/payments/:id/sign` - Firmar digitalmente
- `POST /api/payments/:id/upload-signed` - Subir documento firmado
- `GET /api/payments/:id/pdf` - Descargar PDF

### Usuarios (Solo Super Admin)
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `POST /api/users` - Crear usuario
- `PATCH /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

## 🏗️ Estructura del Proyecto

```
payroll-system/
├── backend/
│   ├── src/
│   │   ├── auth/          # Módulo de autenticación
│   │   ├── users/         # Módulo de usuarios
│   │   ├── employees/     # Módulo de empleadas
│   │   ├── payments/      # Módulo de pagos
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── uploads/           # Archivos subidos
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── auth/          # Autenticación
    │   │   ├── dashboard/     # Dashboard principal
    │   │   ├── employees/     # Servicios de empleadas
    │   │   ├── payments/      # Servicios de pagos
    │   │   ├── users/         # Servicios de usuarios
    │   │   ├── core/          # Servicios core
    │   │   └── shared/        # Modelos compartidos
    │   ├── environments/
    │   └── index.html
    └── package.json
```

## 🚀 Deployment

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
# Los archivos compilados estarán en dist/
```

## 🔒 Seguridad

- Las contraseñas se hashean con bcrypt
- Autenticación mediante JWT
- Validación de datos con class-validator
- Guards para proteger rutas
- CORS habilitado para el frontend

## 🛠️ Tecnologías Utilizadas

### Backend
- NestJS - Framework Node.js
- TypeORM - ORM para PostgreSQL
- PostgreSQL - Base de datos
- Passport JWT - Autenticación
- PDFKit - Generación de PDFs
- Bcrypt - Hashing de contraseñas

### Frontend
- Angular 17 - Framework frontend
- TypeScript - Lenguaje
- RxJS - Programación reactiva
- Standalone Components - Arquitectura moderna

## 📝 Notas Importantes

- Este sistema NO cumple requisitos legales específicos de ningún país
- Es una herramienta de gestión interna simplificada
- Asegúrate de cambiar el JWT_SECRET en producción
- Realiza backups regulares de la base de datos
- Los archivos subidos se guardan en `uploads/signed-documents`

## 🤝 Contribución

Este es un proyecto interno. Para mejoras o sugerencias, contacta al administrador del sistema.

## 📄 Licencia

Uso interno únicamente.
