# Implementation Plan: Módulo de Gestión de Categorías Inmutables (Gestión y Detección de Duplicados)

**Branch**: `004-article-categories-management` | **Date**: 2026-09-22 | **Spec**: [`spec.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/004-article-categories-management/spec.md)

**Input**: Feature specification from `/specs/004-article-categories-management/spec.md`

## Summary

Desarrollar el módulo dedicado de **Gestión de Categorías Inmutables** con paridad funcional completa en la aplicación **Web (`apps/web`)** y en la aplicación nativa **Android (`apps/android`)**, en estricto cumplimiento de la **Constitución v2.6.0**. El módulo permitirá listar, buscar, crear, editar y eliminar categorías de forma segura (bloqueando la eliminación si existen artículos vinculados), e incorporará un motor inteligente de **Detección y Consolidación de Duplicados** (`/merge`) para corregir redundancias creadas por múltiples usuarios.

---

## Technical Context

**Language/Version**: TypeScript 5.5+ (NestJS / Angular 19), Kotlin 2.0+ (Android Jetpack Compose)  
**Primary Dependencies**: Turborepo, NestJS, Prisma ORM, Angular Signals, Jetpack Compose, Material3, Retrofit  
**Storage**: PostgreSQL (Supabase) con modelos `ArticleCategory` y `Article`  
**Testing**: Compilación estricta sin errores (`pnpm build`, `.\gradlew.bat compileDebugKotlin`)  
**Target Platform**: Web Browsers (Responsive Desktop/Mobile) y Android 8.0+ (API 26+)  
**Project Type**: Monorepo Fullstack Multi-Tenant  
**Performance Goals**: Tiempo de respuesta de endpoints $\le 150$ms, renderizado reactivo a 60fps  
**Constraints**: 
- Constitución v2.6.0 (Tiny Controllers $\le 80$ LOC, Clases/Componentes $\le 300$ LOC, Notificaciones Push, Retención de Navegación en Edición).
- Borrado Seguro: Prohibido eliminar categorías con `articlesCount > 0`.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Criterio Constitucional | Requisito | Estado | Justificación / Estrategia |
|---|---|---|---|
| **Paridad Web y Android** | Mismo set funcional en ambas plataformas. | **PASÓ** | Se desarrollará la vista completa en Angular y Jetpack Compose. |
| **Notificaciones Push y Navegación (5.4)** | Push Toast/Banner en C/U/D/Merge; permanecer en pantalla al actualizar. | **PASÓ** | Integrado con `NotificationService` en Web y `NotificationManager` en Android. |
| **Tiny Controllers (3.2)** | Controllers $\le 80$ LOC. | **PASÓ** | `CategoriesController` estructurado en max 60 LOC delegando a `CategoriesService`. |
| **300 LOC Rule (3.3)** | Componentes/Servicios $\le 300$ LOC. | **PASÓ** | Modularización de pantallas en subsecciones (ej. `CategoriesListSection`, `CategoryDuplicatesSection`). |
| **Integridad de Contratos (1.2)** | `@mmedic/types` como Single Source of Truth. | **PASÓ** | DTOs de `CategoryWithStats`, `DuplicateCategoryGroup` y `MergeCategoriesDto` centralizados. |

---

## Project Structure

### Documentation (this feature)

```text
specs/004-article-categories-management/
├── plan.md              # Este plan de implementación
├── research.md          # Investigación del algoritmo de normalización y fusión de categorías
├── data-model.md        # Definición de DTOs y esquema relacional
├── quickstart.md        # Guía de prueba paso a paso
└── contracts/           # Contratos API de Categorías
    └── categories-api.ts
```

### Source Code (repository root)

```text
packages/types/src/index.ts                      # Tipos y DTOs de Categorías y Fusión

apps/api/src/modules/categories/
├── categories.module.ts                         # Módulo NestJS
├── categories.controller.ts                     # Tiny Controller (<= 80 LOC)
└── categories.service.ts                        # Servicio con CRUD, Safe Delete y Merge (<= 300 LOC)

apps/web/src/app/
├── services/categories.service.ts               # Servicio Angular Signals (CRUD + Duplicados + Merge)
├── components/header/header.component.html      # Enlace a Categorías en Mega Menú
└── components/categories/                       # Módulo UI Web de Categorías
    ├── categories-list/                         # Listado, búsqueda y borrado seguro
    ├── category-form-modal/                     # Modal de creación / edición con Push Notifications
    └── category-duplicates/                     # Vista de detección y consolidación de duplicados

apps/android/app/src/main/java/com/mmedic/
├── data/api/CategoriesApiService.kt             # Interfaz Retrofit
├── ui/categories/
│   ├── CategoriesViewModel.kt                   # StateFlow management (<= 300 LOC)
│   ├── CategoriesScreen.kt                      # Pantalla principal tabulada (<= 300 LOC)
│   ├── CategoriesListSection.kt                 # Subcomponente de lista de categorías
│   ├── CategoryDuplicatesSection.kt             # Subcomponente de análisis de duplicados
│   └── CategoryFormDialog.kt                    # Diálogo de creación / edición
└── MainActivity.kt                              # Integración de ruta y menú de navegación
```

---

## Complexity Tracking

| Requisito | ¿Por qué es necesario? | Alternativa Rechazada |
|---|---|---|
| Algoritmo de Detección de Duplicados | Los usuarios registran categorías rápidamente desde comboboxes generando redundancias ("Consultas" vs "CONSULTAS MEDICAS"). | La dispersión de categorías genera catálogos desordenados e incoherentes. |
| Fusión Atómica de Categorías (`/merge`) | Permite consolidar categorías sin perder artículos vinculados. | Reasignar artículo por artículo requeriría edición manual masiva. |
