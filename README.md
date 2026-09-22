# MMedic - Plataforma Clínica Multiplataforma & Multi-Tenant

Monorepo integral para el sistema médico **MMedic**, diseñado para operar de manera unificada en Web (Mobile-First responsive), Dispositivos Móviles (Android) y Servicios de Backend con PostgreSQL en **Supabase** bajo arquitectura multi-tenant estricta.

---

## 🏛️ Arquitectura del Monorepo

```
MMedic/
├── apps/
│   ├── web/         # Frontend Web con Angular 19 (Standalone, Signals, Mobile-First CSS)
│   ├── api/         # Backend REST con NestJS 11, Prisma ORM 6, Passport JWT y Swagger OpenAPI
│   └── android/     # Aplicación nativa Android en Kotlin con Jetpack Compose y Retrofit
│
├── packages/
│   ├── tsconfig/    # Configuraciones base de TypeScript compartidas
│   └── types/       # Modelos y DTOs comunes entre Web y API (@mmedic/types)
│
├── docker-compose.yml # PostgreSQL 16 local (alternativo a Supabase)
├── .env.example       # Plantilla de variables de entorno
└── turbo.json         # Orquestación de pipelines con Turborepo
```

---

## 🔑 Credenciales de Acceso Inicial

El sistema incluye una cuenta raíz de administración precargada vía seed:

| Campo | Valor |
|---|---|
| **Usuario** | `superadmin` |
| **Contraseña** | `superadmin@123#` |
| **Rol** | `ROL_SUPERADMIN` |
| **Permisos** | Acceso irrestricto y absoluto (`*`) |

### Cuentas de Personal Clínico de Demostración:
- **Cajero:** `cajero_carlos` / `Cajero@123#` (Posee permiso especial `FACTURA_ANULAR`)
- **Médico:** `dr_morales` / `Doctor@123#` (`ROL_MEDICO`)
- **Administrador:** `admin_clinica` / `Admin@123#` (`ROL_ADMIN`)

---

## 🛡️ Roles y Permisos Dinámicos

### Roles Base del Sistema:
1. `ROL_SUPERADMIN`: Control total del sistema y gestión transversal de tenants.
2. `ROL_ADMIN`: Administrador de clínica local.
3. `ROL_MEDICO`: Personal médico asistencial.
4. `ROL_CAJERO`: Emisión, cobro y gestión de facturación en caja.
5. `ROL_GERENCIA`: Consulta de reportes y analítica ejecutiva.

### Permisos Especiales Atómicos:
Permisos asignables y revocables de forma dinámica por usuario:
- `FACTURA_ANULAR`: Permite autorizar la anulación de comprobantes emitidos.
- `HISTORIA_CLINICA_EXPORTAR`: Autoriza la descarga y exportación de historias clínicas.
- `PACIENTES_ELIMINAR`: Permite dar de baja registros de pacientes.
- `REPORTES_FINANCIEROS_VER`: Habilita reportes de balance financiero.

> **Verificación Dinámica**: Disponible en el endpoint `POST /api/v1/permissions/check` y comprobable visualmente en la vista `/billing-demo`.

---

## 🚀 Requisitos Previos

- **Node.js**: v18+ (Recomendado v22+)
- **pnpm**: v9+ / v11+ (`npm install -g pnpm`)
- **Supabase PostgreSQL** o Docker local
- **JDK 17+** & **Android Studio**: Para el módulo móvil Android

---

## ⚡ Guía de Inicio Rápido

### 1. Clonar e Instalar Dependencias
```bash
pnpm install
```

### 2. Configurar Variables de Entorno (Supabase)
MMedic utiliza Supabase Cloud PostgreSQL con soporte dual para Connection Pooling y Migraciones Directas:
```bash
cp .env.example .env
```
Asegúrate de configurar en `.env`:
```env
# URL con Connection Pooling (Puerto 6543) para consultas en runtime
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL de conexión directa (Puerto 5432) para Prisma Migrate
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

JWT_SECRET="mmedic_jwt_secret_super_secure_key_2026_clinical_systems_platform_token"
```

### 3. Generar Cliente Prisma y Migraciones
```bash
# Generar cliente de Prisma
pnpm db:generate

# Ejecutar migraciones
pnpm db:migrate

# Sembrar inquilino por defecto, usuarios de prueba y permisos
pnpm db:seed
```

### 4. Iniciar en Modo Desarrollo (Web + API)
```bash
pnpm dev
```
O de manera individual:
```bash
pnpm dev:api   # API NestJS en http://localhost:3000
pnpm dev:web   # Web Angular en http://localhost:3001
```

---

## 🌐 Servicios y Rutas Web

| Servicio / Pantalla | Ruta | Descripción |
|---|---|---|
| **Portal de Login** | `http://localhost:3001/login` | Acceso con layout 80/20 y cabecera institucional |
| **Administración de Usuarios** | `http://localhost:3001/users` | CRUD de usuarios, asignación de roles y permisos especiales |
| **Demo Verificación de Permisos** | `http://localhost:3001/billing-demo` | Prueba interactiva del botón condicional "Anular Factura" |
| **API REST** | `http://localhost:3000/api/v1` | Endpoints REST protegidos con JWT y multi-tenancy |
| **Documentación Swagger** | `http://localhost:3000/api/docs` | Documentación interactiva OpenAPI |
| **Prisma Studio** | `pnpm db:studio` | Explorador gráfico de base de datos |

---

## 📱 Módulo Android (Kotlin + Jetpack Compose)

Ubicado en [`apps/android`](./apps/android):
- Arquitectura limpia con Jetpack Compose y Retrofit.
- Conexión al emulador vía `http://10.0.2.2:3000/api/v1` o IP de red local para dispositivos físicos.

---

## 📜 Cumplimiento Constitucional

- **Trazabilidad en BD (1.4)**: Todo error en endpoints backend se persiste en `system_error_logs` con archivo, línea, mensaje, usuario y tipo de error.
- **Migraciones Atómicas (1.5)**: Cada cambio de esquema cuenta con su migración versionada en Prisma.
- **Mobile-First (2.2)**: Layouts responsivos diseñados desde dispositivos móviles apilados hacia escritorio (80% identidad visual / 20% login en pantallas amplias).
- **Multi-Tenant por Defecto (2.3)**: Aislamiento estricto de datos filtrando automáticamente por `tenantId`.
- **Límites de Líneas de Código (3.2 & 3.3)**: Controladores $\le 80$ líneas de código y componentes/servicios $\le 300$ líneas.
