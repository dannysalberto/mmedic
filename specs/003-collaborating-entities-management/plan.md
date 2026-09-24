# Implementation Plan: Módulo de Entidades Colaboradoras (Gestión y Detección de Duplicados)

**Branch**: `003-collaborating-entities-management` | **Date**: 2026-09-22 | **Spec**: [`spec.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/003-collaborating-entities-management/spec.md)

**Input**: Feature specification from `/specs/003-collaborating-entities-management/spec.md`

## Summary

Desarrollar el módulo integral de **Entidades Colaboradoras** (Médicos, Laboratorios, Aliados) con paridad funcional total entre la aplicación **Web (`apps/web`)** y la aplicación nativa **Android (`apps/android`)**, cumpliendo con la **Constitución v2.6.0**. El módulo permitirá listar, buscar, crear, editar y eliminar entidades de manera segura (impidiendo la eliminación si existen artículos asociados), además de incorporar un motor inteligente de **Detección y Consolidación de Duplicados** para corregir errores de registros creados por múltiples usuarios.

---

## Technical Context

**Language/Version**: TypeScript 5.5+ (NestJS / Angular 19), Kotlin 2.0+ (Android Jetpack Compose)  
**Primary Dependencies**: Turborepo, NestJS, Prisma ORM, Angular Signals, Jetpack Compose, Material3, Retrofit  
**Storage**: PostgreSQL (Supabase) con modelo relacional `Entity` y `ArticleParticipant`  
**Testing**: Compilación estricta sin errores (`pnpm build`, `.\gradlew.bat compileDebugKotlin`)  
**Target Platform**: Web Browsers (Responsive Desktop/Mobile) y Android 8.0+ (API 26+)  
**Project Type**: Monorepo Fullstack Multi-Tenant  
**Performance Goals**: Tiempo de respuesta de endpoints $\le 150$ms, renderizado reactivo a 60fps  
**Constraints**: 
- Constitución v2.6.0 (Tiny Controllers $\le 80$ LOC, Clases/Componentes $\le 300$ LOC, Notificaciones Push, Retención de Navegación en Edición).
- Borrado Seguro: Prohibido eliminar entidades con `articlesCount > 0`.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Criterio Constitucional | Requisito | Estado | Justificación / Estrategia |
|---|---|---|---|
| **Paridad Web y Android** | Mismo set funcional en ambas plataformas. | **PASÓ** | Se construirá la vista completa en Angular y Jetpack Compose. |
| **Notificaciones Push y Navegación (5.4)** | Push Toast/Banner en C/U/D/Merge; permanecer en pantalla al actualizar. | **PASÓ** | Integrado con `NotificationService` en Web y `NotificationManager` en Android. |
| **Tiny Controllers (3.2)** | Controllers $\le 80$ LOC. | **PASÓ** | `EntitiesController` estructurado en max 60 LOC delegando a `EntitiesService`. |
| **300 LOC Rule (3.3)** | Componentes/Servicios $\le 300$ LOC. | **PASÓ** | Modularización de pantallas en subsecciones (ej. `EntitiesListSection`, `EntityDuplicatesSection`). |
| **Integridad de Contratos (1.2)** | `@mmedic/types` como Single Source of Truth. | **PASÓ** | DTOs de `EntityWithStats`, `DuplicateEntityGroup` y `MergeEntitiesDto` centralizados. |

---

## Project Structure

### Documentation (this feature)

```text
specs/003-collaborating-entities-management/
├── plan.md              # Este plan de implementación
├── research.md          # Investigación de algoritmo de normalización y reglas de fusión
├── data-model.md        # Definición de DTOs y esquema de BD
├── quickstart.md        # Guía de prueba paso a paso
└── contracts/           # Contratos API de Entidades
    └── entities-api.ts
```

### Source Code (repository root)

```text
packages/types/src/index.ts                      # Tipos y DTOs de Entidades y Fusión

apps/api/src/modules/entities/
├── entities.module.ts                           # Módulo NestJS
├── entities.controller.ts                       # Tiny Controller (<= 80 LOC)
└── entities.service.ts                          # Servicio con CRUD, Safe Delete y Merge (<= 300 LOC)

apps/web/src/app/
├── services/entities.service.ts                 # Servicio Angular Signals (CRUD + Duplicados + Merge)
├── components/header/header.component.html      # Enlace a Entidades en Mega Menú
└── components/entities/                         # Módulo UI Web de Entidades
    ├── entities-list/                           # Listado, búsqueda y filtrado
    ├── entity-form-modal/                       # Modal de creación / edición con Push Notifications
    └── entity-duplicates/                       # Vista de detección y consolidación de duplicados

apps/android/app/src/main/java/com/mmedic/
├── data/api/EntitiesApiService.kt               # Interfaz Retrofit
├── ui/entities/
│   ├── EntitiesViewModel.kt                     # StateFlow management (<= 300 LOC)
│   ├── EntitiesScreen.kt                        # Pantalla principal tabulada (<= 300 LOC)
│   ├── EntitiesListSection.kt                   # Subcomponente de lista de colaboradores
│   ├── EntityDuplicatesSection.kt               # Subcomponente de análisis de duplicados
│   └── EntityFormDialog.kt                      # Diálogo de creación / edición
└── MainActivity.kt                              # Integración de ruta y menú de navegación
```

---

## Complexity Tracking

| Requisito | ¿Por qué es necesario? | Alternativa Rechazada |
|---|---|---|
| Algoritmo de Detección de Duplicados | Los usuarios registran médicos rápidamente desde distintas pantallas generando códigos duplicados ("CONS-01" vs "DOC-99"). | Dejar duplicados manuales generaría reportes financieros incorrectos y comisiones fragmentadas. |
| Fusión Atómica de Entidades (`/merge`) | Permite consolidar historial sin perder relaciones de participaciones en artículos. | Borrar el secundario a mano requeriría editar cada artículo individualmente. |
