# Implementation Plan: Módulo de Gestión de Clientes / Directorio de Pacientes (CRUD Completo y Paridad Dual)

**Branch**: `007-patients-customers-management` | **Date**: 2026-09-24 | **Spec**: [spec.md](file:///d:/Projectos/Codigo/Personal/MMedic/specs/007-patients-customers-management/spec.md)

**Input**: Feature specification from `/specs/007-patients-customers-management/spec.md`

---

## Summary

Implementación integral del módulo de **Gestión de Clientes / Directorio de Pacientes** incorporando paridad CRUD completa (Creación, Lectura, Búsqueda en tiempo real por RIF/Cédula/Nombre, Edición con Retención de Navegación, y Eliminación Segura), integrado en el menú de navegación lateral ("Directorio de Pacientes") con cumplimiento vinculante de Desarrollo Dual y Paridad de Plataformas para la aplicación Web SPA (`apps/web`) y Móvil Nativa Android (`apps/android`).

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (Node.js 20+), Angular 19+, Kotlin 1.9+ (Jetpack Compose)  
**Primary Dependencies**: NestJS, Prisma ORM, Angular Signals, RxJS, Lucide Icons, Jetpack Compose Material3  
**Storage**: PostgreSQL (Supabase) con esquema Multi-Tenant nativo (`tenantId`)  
**Testing**: Jest (API unit/e2e), Karma/Jasmine (Angular), Android JUnit/Compose Test  
**Target Platform**: Web SPA (`apps/web`) y Móvil Nativo Android (`apps/android`)  
**Project Type**: Monorepo empresarial Multi-Tenant (pnpm workspaces / Turborepo)  
**Performance Goals**: Filtros y búsquedas en tiempo real <300ms  
**Constraints**: Regla de Eliminación Segura (*Safe Deletion* con comprobación de facturas vinculadas), Notificaciones Flotantes (Push Toasts), y Retención de Navegación en Edición (Principio V, Subsección 5.4 de la Constitución).  
**Scale/Scope**: Módulo transversal reutilizado por Facturación (`invoices`), Atenciones Médicas e Historias Clínicas.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Principio I (1.1 - 1.3): Multi-Tenant Nativo & Desarrollo Dual Obligatorio**:
   - **PASS**: Todas las consultas a la base de datos están aisladas por `tenantId`. La funcionalidad se especifica y diseña simultáneamente para la Web (`apps/web`) y para Android (`apps/android`).
2. **Principio I (1.2): Contratos Compartidos**:
   - **PASS**: Los DTOs e interfaces de cliente se centralizan en `@mmedic/types` (`packages/types/src/customer.ts`).
3. **Principio III: Regla de Eliminación Segura (Safe Deletion Rule)**:
   - **PASS**: La API NestJS verifica `_count.invoices > 0` antes de autorizar el borrado de un cliente.
4. **Principio V (5.4): Notificaciones Transversales y Retención de Navegación**:
   - **PASS**: Las acciones de guardado emiten toasts flotantes no intrusivos. La edición **preserva la pantalla actual** sin redirección automática.

---

## Project Structure

### Documentation (this feature)

```text
specs/007-patients-customers-management/
├── plan.md              # Este archivo (plan de implementación)
├── research.md          # Registro de decisiones de investigación (Fase 0)
├── data-model.md        # Esquema de datos y modelos (Fase 1)
├── quickstart.md        # Guía de validación end-to-end (Fase 1)
└── contracts/           # Contratos TypeScript de API REST (Fase 1)
    └── customers-api.ts
```

### Source Code Layout

```text
# Backend API (NestJS)
apps/api/src/modules/customers/
├── dto/
│   ├── create-customer.dto.ts
│   └── update-customer.dto.ts
├── customers.controller.ts
├── customers.service.ts
└── customers.module.ts

# Shared Types Package
packages/types/src/
├── customer.ts
└── index.ts

# Frontend Web SPA (Angular 19)
apps/web/src/app/
├── components/
│   ├── sidebar/                     # Opción de menú "Directorio de Pacientes"
│   └── customers/
│       ├── customers-list/
│       │   ├── customers-list.component.ts
│       │   ├── customers-list.component.html
│       │   └── customers-list.component.css
│       └── customer-form-modal/
│           ├── customer-form-modal.component.ts
│           ├── customer-form-modal.component.html
│           └── customer-form-modal.component.css
└── services/
    └── customers.service.ts

# Android Native App (Kotlin Jetpack Compose)
apps/android/app/src/main/java/com/mmedic/app/
├── data/repository/
│   └── CustomerRepository.kt
└── ui/customers/
    ├── CustomersScreen.kt
    └── CustomersViewModel.kt
```

**Structure Decision**: Se sigue la arquitectura estándar desacoplada del monorepo MMedic, expandiendo los componentes existentes en `apps/api`, `apps/web` y `apps/android`.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | Ninguna violación detectada | Estructura completamente alineada con la Constitución v2.6.0 |
