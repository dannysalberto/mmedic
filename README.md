# MMedic - Plataforma Clínica Multiplataforma

Monorepo integral para el sistema médico **MMedic**, diseñado para operar de manera unificada en Web, Dispositivos Móviles (Android) y Servicios de Backend con PostgreSQL.

---

## 🏛️ Arquitectura del Monorepo

```
MMedic/
├── apps/
│   ├── web/         # Frontend Web moderno con Next.js 15, React 19 y App Router
│   ├── api/         # Backend REST con NestJS 11, Prisma ORM 6 y Swagger OpenAPI
│   └── android/     # Aplicación nativa Android en Kotlin con Jetpack Compose y Retrofit
│
├── packages/
│   ├── tsconfig/    # Configuraciones base de TypeScript compartidas
│   └── types/       # Modelos y DTOs comunes entre Web y API (@mmedic/types)
│
├── docker-compose.yml # PostgreSQL 16 + Adminer para desarrollo local
├── .env.example       # Plantilla de variables de entorno
└── turbo.json         # Orquestación de pipelines con Turborepo
```

---

## 🚀 Requisitos Previos

- **Node.js**: v18+ (Recomendado v22+)
- **pnpm**: v9+ / v11+ (`npm install -g pnpm`)
- **Docker & Docker Compose**: Para levantar PostgreSQL localmente
- **JDK 17+** & **Android Studio**: Para compilar o ejecutar el módulo móvil Android

---

## ⚡ Guía de Inicio Rápido

### 1. Clonar e Instalar Dependencias
```bash
# Instalar todas las dependencias del monorepo (Web, API, Tipos)
pnpm install
```

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

### 3. Iniciar la Base de Datos PostgreSQL
Levanta el contenedor de PostgreSQL 16 y Adminer con Docker Compose:
```bash
pnpm db:up
```
- **PostgreSQL**: `localhost:5432` (Usuario: `mmedic`, Password: `mmedic_secure_password`, BD: `mmedic_db`)
- **Adminer (Visualizador Web)**: [http://localhost:8080](http://localhost:8080) (Sistema: *PostgreSQL*, Servidor: *postgres*, Usuario: *mmedic*, BD: *mmedic_db*)

### 4. Generar Cliente Prisma y Migraciones
```bash
# Generar cliente de Prisma
pnpm db:generate

# Ejecutar migraciones iniciales
pnpm db:migrate

# (Opcional) Poblar la base de datos con doctores y pacientes de prueba
pnpm db:seed
```

### 5. Iniciar en Modo Desarrollo (Web + API)
Inicia ambas aplicaciones simultáneamente con Turborepo:
```bash
pnpm dev
```
O de manera individual:
```bash
# Iniciar solo la API NestJS (Puerto 3000)
pnpm dev:api

# Iniciar solo el Frontend Next.js (Puerto 3001)
pnpm dev:web
```

---

## 🌐 Servicios Disponibles

| Servicio | URL Local | Descripción |
|---|---|---|
| **Web Portal** | [http://localhost:3001](http://localhost:3001) | Dashboard clínico Next.js 15 |
| **API REST** | [http://localhost:3000/api/v1](http://localhost:3000/api/v1) | Endpoint base de NestJS |
| **Swagger Docs** | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) | Documentación interactiva de la API |
| **Prisma Studio** | `pnpm db:studio` -> [http://localhost:5555](http://localhost:5555) | Explorador visual de datos de Prisma |
| **Adminer DB** | [http://localhost:8080](http://localhost:8080) | Panel de administración de PostgreSQL |

---

## 📱 Módulo Android (Kotlin + Jetpack Compose)

La aplicación móvil se encuentra en la carpeta [`apps/android`](./apps/android):

1. Abre **Android Studio**.
2. Selecciona **Open** y navega a la carpeta `apps/android`.
3. Deja que Gradle sincronice las dependencias (`build.gradle.kts`).
4. **Conectividad con la API**:
   - Si utilizas el **Emulador Oficial de Android**, la app se conecta automáticamente a `http://10.0.2.2:3000/api/v1`.
   - Si utilizas un **Dispositivo Físico** conectado por Wi-Fi o USB, puedes cambiar la URL directamente desde la interfaz de la app indicando la IP local de tu PC (ej: `http://192.168.1.50:3000/api/v1`).
5. La pantalla principal incluye una prueba de conectividad en tiempo real contra el endpoint `/health` de NestJS.

---

## 📦 Scripts Disponibles en el Root

```bash
pnpm dev          # Inicia Web y API en paralelo con Hot-Reload
pnpm build        # Compila todos los proyectos respetando el grafo de dependencias
pnpm lint         # Ejecuta linter en todo el monorepo
pnpm db:up        # Inicia PostgreSQL y Adminer en Docker
pnpm db:down      # Detiene los contenedores Docker
pnpm db:migrate   # Ejecuta migraciones de Prisma
pnpm db:generate  # Genera el cliente de Prisma
pnpm db:seed      # Siembra datos de prueba
pnpm db:studio    # Abre Prisma Studio en el navegador
```
