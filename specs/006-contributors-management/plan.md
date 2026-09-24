# Implementation Plan: Módulo de Personal y Colaboradores Técnicos/Profesionales

**Branch**: `006-contributors-management` | **Date**: 2026-09-23 | **Spec**: [`spec.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/006-contributors-management/spec.md)

**Input**: Feature specification from `/specs/006-contributors-management/spec.md`

## Summary

Desarrollar el módulo integral de **Personal Técnico y Profesional / Colaboradores** clonando la arquitectura y experiencia de usuario del módulo de entidades colaboradoras, desacoplando los datos a una tabla física dedicada denominada `contributors` (`model Contributor` en Prisma). El módulo garantizará paridad funcional completa entre la aplicación **Web (`apps/web`)** en Angular 19+ y la aplicación **Móvil Android (`apps/android`)** en Kotlin / Jetpack Compose conforme a la **Constitución v2.6.0**. Incluye navegación desde la opción existente "Personal/Profesionales", listado reactivo con búsqueda y filtros, creación/edición con notificaciones push flotantes y retención de pantalla, regla de borrado seguro (*Safe Deletion*) y motor de detección y consolidación atómica de duplicados.

---

## Technical Context

**Language/Version**: TypeScript 5.5+ (NestJS / Angular 19), Kotlin 2.0+ (Android Jetpack Compose)  
**Primary Dependencies**: Turborepo, NestJS, Prisma ORM, Angular Signals, Jetpack Compose, Material3, Retrofit  
**Storage**: PostgreSQL (Supabase) con tabla dedicada `contributors` (`model Contributor` en Prisma)  
**Testing**: Compilación estricta y typecheck sin advertencias (`pnpm build`, `.\gradlew.bat compileDebugKotlin`)  
**Target Platform**: Web Browsers (Responsive Desktop/Mobile) y Android 8.0+ (API 26+)  
**Project Type**: Monorepo Fullstack Multi-Tenant  
**Performance Goals**: Tiempo de respuesta de endpoints $\le 150$ms, respuesta de búsqueda reactiva $\le 500$ms, renderizado UI a 60fps  
**Constraints**: 
- **Constitución v2.6.0**: Tiny Controllers ($\le 80$ LOC), Componentes/Servicios ($\le 300$ LOC), Notificaciones Transversales Push, Retención de Navegación en Edición.
- **Borrado Seguro**: Bloqueo absoluto de borrado de colaboradores que posean vínculos históricos o artículos asociados.
- **Trazabilidad en BD**: Registro obligatorio de excepciones con 7 metadatos estructurados en la base de datos.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Criterio Constitucional | Requisito | Estado | Justificación / Estrategia |
|---|---|---|---|
| **Paridad Web y Android (1.3)** | Mismo conjunto de funcionalidades en Web y Android. | **PASÓ** | Implementación completa de pantallas y servicios en Angular 19+ y Jetpack Compose. |
| **Notificaciones Push y Retención (5.4)** | Notificaciones push flotantes en C/U/D/Merge; permanecer en pantalla al guardar edición. | **PASÓ** | Integrado con `NotificationService` en Web y `NotificationManager` en Android; navegación condicional (sólo redirige en creación nueva). |
| **Tiny Controllers (3.2)** | Controllers $\le 80$ LOC. | **PASÓ** | `ContributorsController` estructurado en menos de 70 LOC delegando orquestación al servicio. |
| **300 LOC Rule (3.3)** | Componentes y Servicios $\le 300$ LOC. | **PASÓ** | Descomposición modular de la UI en subcomponentes (`ContributorsListSection`, `ContributorDuplicatesSection`, `ContributorFormModal`). |
| **Integridad de Contratos (1.2)** | `@mmedic/types` como Single Source of Truth. | **PASÓ** | DTOs y modelos (`Contributor`, `ContributorWithStats`, etc.) definidos exclusivamente en `packages/types`. |
| **Trazabilidad de Errores (1.4)** | Persistencia de errores en BD con 7 campos. | **PASÓ** | Manejo de excepciones centralizado con persistencia asíncrona en tabla de logs del sistema. |
| **Evolución de BD (1.5)** | Migración atómica versionada sin cambios manuales. | **PASÓ** | Migración Prisma para la tabla `contributors` generada y versionada en `apps/api/prisma/migrations`. |

---

## Project Structure

### Documentation (this feature)

```text
specs/006-contributors-management/
├── spec.md              # Especificación funcional de requerimientos
├── plan.md              # Este plan de implementación
├── research.md          # Investigación técnica y algoritmo de duplicados
├── data-model.md        # Esquema Prisma y DTOs tipados en @mmedic/types
├── quickstart.md        # Guía de pruebas de extremo a extremo
├── contracts/           # Contratos API REST
│   └── contributors-api.ts
├── checklists/          # Checklists de calidad
│   └── requirements.md
└── tasks.md             # Tareas de implementación (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/types/src/
├── contributor.ts                               # DTOs y tipos del modelo Contributor
└── index.ts                                     # Exportación centralizada del paquete

apps/api/
├── prisma/
│   ├── schema.prisma                            # Modelo Contributor mapeado a tabla contributors
│   └── migrations/                              # Migración SQL atómica para tabla contributors
└── src/modules/contributors/
    ├── contributors.module.ts                   # Módulo NestJS
    ├── contributors.controller.ts               # Tiny Controller (<= 80 LOC)
    └── contributors.service.ts                  # Servicio con CRUD, Safe Delete y Merge (<= 300 LOC)

apps/web/src/app/
├── services/contributors.service.ts             # Servicio Angular Signals con cliente HTTP tipado
├── components/header/header.component.html      # Enlace "Personal/Profesionales" enrutado a /contributors
└── components/contributors/                     # Módulo UI Web de Colaboradores
    ├── contributors-list/                       # Listado, búsqueda y filtrado por estado
    ├── contributor-form-modal/                  # Modal de creación/edición con notificaciones push
    └── contributor-duplicates/                  # Vista de detección y fusión de duplicados

apps/android/app/src/main/java/com/mmedic/
├── data/
│   ├── api/ContributorsApiService.kt           # Interfaz de llamadas Retrofit
│   └── model/Contributor.kt                     # Modelos de datos para Android
├── ui/contributors/
│   ├── ContributorsViewModel.kt                 # Gestión reactiva de estado StateFlow (<= 300 LOC)
│   ├── ContributorsScreen.kt                    # Pantalla principal con pestañas (<= 300 LOC)
│   ├── ContributorsListSection.kt               # Subcomponente de listado y búsqueda
│   ├── ContributorDuplicatesSection.kt          # Subcomponente de auditoría de duplicados
│   └── ContributorFormDialog.kt                 # Diálogo de alta y edición con retención
└── MainActivity.kt                              # Integración de ruta y menú en la app móvil
```

---

## Complexity Tracking

| Requisito | ¿Por qué es necesario? | Alternativa Rechazada |
|---|---|---|
| Tabla separada `contributors` | El usuario solicitó explícitamente guardar el personal en una tabla llamada `contributors` desacoplada de `entities`. | Reutilizar la tabla `entities` con un discriminador `type: ENTITY \| CONTRIBUTOR` causaría acoplamiento conceptual entre personal interno y organizaciones externas. |
| Motor de Detección de Duplicados | El personal médico frecuentemente se carga con variantes de nombre o prefijos (`Dr.`, `Lic.`) creando registros dispersos. | La unificación manual requeriría auditorías manuales en BD propensas a errores. |
| Fusión Atómica Transaccional (`/merge`) | Permite consolidar historial clínico y participaciones en una sola identidad de forma atómica y segura. | Reasignación manual servicio por servicio; inviable y con riesgo de inconsistencias. |
