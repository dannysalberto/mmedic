# Implementation Plan: Administración de Usuarios, Roles, Permisos Especiales y Autenticación Multi-Tenant

**Branch**: `001-user-management-auth` | **Date**: 2026-09-20 | **Spec**: [specs/001-user-management-auth/spec.md](./spec.md)

**Input**: Feature specification from `specs/001-user-management-auth/spec.md`

---

## Summary

Implementación integral del sistema de identidad, control de acceso y portal de autenticación para la plataforma **MMedic**. El módulo incorpora una arquitectura **Multi-Tenant nativa por defecto**, un modelo de seguridad híbrido en dos niveles (**RBAC + PBAC**) con roles base (`ROL_SUPERADMIN`, `ROL_ADMIN`, `ROL_MEDICO`, `ROL_CAJERO`, `ROL_GERENCIA`) y permisos especiales asignables a nivel individual de usuario con capacidad de verificación dinámica (`hasPermission`). Incluye además la cuenta semilla del superadministrador (`superadmin` / `superadmin@123#`), un portal con cabecera institucional horizontal y una pantalla de login responsiva Mobile-First con proporción 80% (identidad visual/logo) y 20% (formulario de acceso) en pantallas de escritorio.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (Node.js v22+ en Backend, Angular 19+ en Frontend)

**Primary Dependencies**:
- **Backend (`apps/api`)**: NestJS 11, Prisma ORM 6, Passport-JWT, bcrypt, class-validator, class-transformer.
- **Frontend (`apps/web`)**: Angular 19 (Standalone Components, Signals, Reactive Forms, Vanilla CSS con Design Tokens).
- **Tipos Compartidos (`packages/types`)**: `@mmedic/types` (Modelos, DTOs y `ApiResponse<T>`).

**Storage**: PostgreSQL en la nube alojado en **Supabase** (arquitectura de doble conexión con `DATABASE_URL` para runtime mediante pooler de conexiones y `DIRECT_URL` para ejecución de migraciones con Prisma Migrate; compatible con PostgreSQL local en desarrollo).

**Testing**: Jest (Unit & Integration tests en NestJS), Angular Testing Library / Jasmine en Web, E2E con Supertest y Cypress.

**Target Platform**: Web Responsive (Mobile, Tablet, Desktop) y API REST agnóstica para clientes Web y Móviles nativos (Android Compose / iOS).

**Project Type**: Monorepo empresarial estructurado con Turborepo y pnpm workspaces.

**Performance Goals**:
- Tiempo de resolución de verificación de permisos: < 50 ms.
- Autenticación y retorno de token JWT: < 200 ms.
- Cero desbordamiento horizontal en pantallas móviles (< 640px).

**Constraints**:
- Obligatoriedad de registro de excepciones backend en tabla `system_error_logs` de base de datos (Constitución 1.4).
- Cero alteraciones manuales en base de datos; cada tabla, columna o semilla gestionada con migraciones atómicas de Prisma (Constitución 1.5).
- Aislamiento Multi-Tenant estricto en todas las tablas y consultas vía `tenantId` (Constitución 2.3).
- Controladores delgados $\le$ 80 LOC y componentes/servicios $\le$ 300 LOC (Constitución 3.2 y 3.3).

**Scale/Scope**: Múltiples inquilinos (clínicas), miles de usuarios concurrentes, granularidad ilimitada de permisos especiales.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio Constitucional | Estado | Evidencia y Justificación Técnica |
|---|---|---|
| **Principio I: Stack & Reutilización (1.1, 1.2, 1.3)** | **PASS** | API REST pura y desacoplada en NestJS + Prisma; contratos centralizados en `packages/types` (`@mmedic/types`); soporte futuro para clientes móviles sin cambios en endpoints. |
| **Principio I: Trazabilidad de Errores en BD (1.4)** | **PASS** | Implementación de `SystemErrorLog` en PostgreSQL y filtro global `GlobalExceptionFilter` que persiste fichero, línea, mensaje, descripción, usuario, fecha y tipo de excepción. |
| **Principio I: Control de Migraciones Atómicas (1.5)** | **PASS** | Creación de nuevas tablas (`tenants`, `special_permissions`, `user_special_permissions`, `system_error_logs`) y semillas mediante Prisma Migrate versionado. |
| **Principio II: JWT Stateless (2.1)** | **PASS** | Autenticación basada exclusivamente en tokens JWT con `JwtAuthGuard` por defecto y decorador `@Public()` para login y páginas públicas. |
| **Principio II: RBAC + PBAC (2.2)** | **PASS** | 5 roles base del sistema + permisos especiales atómicos vinculados por usuario, evaluados con `@Roles` y `@RequirePermissions`. |
| **Principio II: Multi-Tenant por Defecto (2.3)** | **PASS** | Todas las entidades y consultas incluyen `tenantId`, resuelto en el contexto JWT del backend; soporte de inquilino maestro para `ROL_SUPERADMIN`. |
| **Principio III: SOLID & Tiny Controllers (3.1, 3.2, 3.3)** | **PASS** | Controladores delgados ($\le$ 80 LOC) que delegan a `AuthService` y `UserService`; archivos modulares respetando el límite universal de 300 LOC. |
| **Principio IV: Reactividad por Signals & Memoria (4.1, 4.3)** | **PASS** | Estado del usuario, sesión activa y verificación de permisos gestionados con `signal()`, `computed()` y limpieza estricta con `DestroyRef` / `takeUntilDestroyed()`. |
| **Principio V: UI/UX & Mobile-First (5.1, 5.2, 5.3)** | **PASS** | Cabecera pública horizontal; pantalla de login con layout 80/20 en desktop ($\ge$ 1024px) y adaptación fluida Mobile-First apilada sin horizontal scroll en pantallas chicas. |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-user-management-auth/
├── spec.md              # Especificación funcional de requerimientos
├── plan.md              # Este documento de planificación técnica
├── research.md          # Fase 0: Decisiones arquitectónicas y justificaciones
├── data-model.md        # Fase 1: Esquema relacional, entidades y modelo de datos
├── quickstart.md        # Fase 1: Guía de ejecución y validación de escenarios
├── contracts/           # Fase 1: Contratos de interfaz y endpoints REST
│   └── api-contracts.md
└── checklists/
    └── requirements.md  # Checklist de validación de calidad del spec
```

### Source Code (repository root)

```text
MMedic/
├── packages/
│   └── types/
│       └── src/
│           └── index.ts                 # Enums de roles, contratos User, Tenant, DTOs y ApiResponse
│
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # Modelos Tenant, User, SpecialPermission, UserSpecialPermission, SystemErrorLog
│   │   │   ├── migrations/              # Migración atómica versionada
│   │   │   └── seed.ts                  # Semilla con tenant default y superadmin inicial
│   │   └── src/
│   │       ├── common/
│   │       │   ├── filters/
│   │       │   │   └── global-exception.filter.ts # Captura y persistencia de errores en BD (1.4)
│   │       │   ├── guards/
│   │       │   │   ├── jwt-auth.guard.ts
│   │       │   │   └── permissions.guard.ts
│   │       │   └── interceptors/
│   │       │       └── tenant.interceptor.ts      # Inyección de TenantContext (2.3)
│   │       └── modules/
│   │           ├── auth/
│   │           │   ├── auth.controller.ts         # Tiny controller (<= 80 LOC)
│   │           │   ├── auth.service.ts
│   │           │   └── jwt.strategy.ts
│   │           ├── users/
│   │           │   ├── users.controller.ts        # Tiny controller (<= 80 LOC)
│   │           │   └── users.service.ts
│   │           └── permissions/
│   │               ├── permissions.controller.ts  # Tiny controller (<= 80 LOC)
│   │               └── permissions.service.ts     # Verificación usuario + permiso
│   │
│   └── web/
│       └── src/
│           ├── app/
│           │   ├── components/
│           │   │   ├── header/                    # Cabecera horizontal (logo.svg + menú informativo)
│           │   │   ├── login/                     # Layout login 80/20 desktop, apilado mobile-first
│           │   │   └── users/                     # CRUD de usuarios, asignación de roles y permisos
│           │   ├── services/
│           │   │   ├── auth.service.ts            # Signal-based session state
│           │   │   ├── users.service.ts
│           │   │   └── permissions.service.ts     # Signal-based permission verification
│           │   ├── app.routes.ts                  # Rutas con Guards de autenticación
│           │   └── app.config.ts
│           └── styles.css                         # Design tokens y media queries mobile-first (min-width)
```

**Structure Decision**: Monorepo desacoplado estándar de MMedic (`apps/api` para backend NestJS, `apps/web` para cliente Angular 19, `packages/types` para fuente única de verdad de contratos).

---

## Complexity Tracking

> **Violaciones a la Constitución**: 0 detectadas. Todos los aspectos del diseño satisfacen los principios de gobernanza.

| Principio Auditado | Estado | Comentario |
|---|---|---|
| Tiny Controllers ($\le$ 80 LOC) | Cumplido | Los controladores solo reciben DTOs y delegan a servicios. |
| Regla 300 LOC | Cumplido | Componentes y servicios segmentados en sub-módulos cohesivos. |
| Higiene de Memoria | Cumplido | Uso exclusivo de Signals y `DestroyRef` en Angular. |
| Multi-Tenancy Nativo | Cumplido | Entidades vinculadas con `tenantId`. |
| Mobile-First | Cumplido | Layout 80/20 en pantallas de escritorio con transición vertical en pantallas móviles. |
