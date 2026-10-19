# Implementation Plan: Numeración Consecutiva por Categoría y Búsqueda de Artículos

**Branch**: `009-article-category-numbering` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-article-category-numbering/spec.md`

---

## Summary

Implementar la asignación atómica de números correlativos por categoría para artículos médicos (ej: `CONS-001`, `EXAM-001`), mediante una semilla/prefijo configurada en cada categoría y un contador de secuencia protegido por transacciones concurrentes con bloqueo pesimista en PostgreSQL. Adicionalmente, enriquecer el formulario de artículos con búsqueda reactiva por código (mediante teclas `Tab`/`Enter` o botón de lupa interactivo) y conmutación automática al modo edición cuando se detecta un código existente.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (Node.js v20/v22 en backend y Angular 19 en frontend), Kotlin 2.0+ (Android Jetpack Compose)  
**Primary Dependencies**: NestJS 11, Prisma ORM 6.4+, PostgreSQL (Supabase), Angular 19 Standalone Signals, Retrofit 2  
**Storage**: PostgreSQL 16 (tabla `article_categories` con columnas `seed` y `currentSequence`; tabla `articles` con índice único compuesto `[tenantId, code]`)  
**Testing**: Jest / Supertest en API (`apps/api`), Jasmine / Karma en Web (`apps/web`), Compose UI Tests en Android (`apps/android`)  
**Target Platform**: Web Responsive Desktop/Tablet/Mobile (Angular SPA) y Móvil Nativo Android (Jetpack Compose)  
**Project Type**: Monorepo Fullstack Multiplataforma (Turborepo + pnpm workspaces)  
**Performance Goals**: Búsqueda por código en $< 300\text{ ms}$; generación transaccional atómica de consecutivo en $< 150\text{ ms}$; cero colisiones concurrentes  
**Constraints**: Multi-tenancy estricto en todas las consultas; diseño Mobile-First con disposición unicolumna en pantallas móviles; contratos de datos compartidos en `@mmedic/types`  
**Scale/Scope**: Catálogos clínicos con hasta decenas de miles de artículos por tenant distribuidos en categorías independientes

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio Constitucional | Estado | Justificación / Cumplimiento |
| :--- | :---: | :--- |
| **I. Stack Tecnológico & Reutilización Transversal (1.1 - 1.3)** | ✅ Cumple | Los tipos se centralizan en `packages/types` (`@mmedic/types`). Las respuestas se ciñen al envelope `ApiResponse<T>`. Se planifica paridad obligatoria entre Web (`apps/web`) y Android (`apps/android`). |
| **II. Principios Arquitectónicos (2.1 - 2.3)** | ✅ Cumple | Multi-tenancy estricto: todas las consultas filtran por `tenantId`. Semillas y consecutivos únicos por clínica (`@@unique([tenantId, seed])`). Bloqueo transaccional seguro. |
| **III. Estándares de Codificación & Límites (3.1 - 3.4)** | ✅ Cumple | Controladores $\le 80$ LOC. Servicios $\le 300$ LOC delegando submódulos si fuese necesario. Documentación de trazabilidad en `system_error_logs`. |
| **IV. Calidad, Testing & Reglas de Git (4.1 - 4.4)** | ✅ Cumple | Rama `009-article-category-numbering`. Migraciones atómicas versionadas de Prisma. Cobertura de pruebas unitarias y e2e. |
| **V. Estándares UI/UX y Sistema de Diseño Centralizado (5.1 - 5.3)** | ✅ Cumple | Directiva estricta Mobile-First: en móviles las entradas y botones se apilan en 1 columna sin truncamiento. Dimensiones mínimas táctiles de 44px. Tokens de color médicos. |

---

## Project Structure

### Documentation (this feature)

```text
specs/009-article-category-numbering/
├── plan.md              # Este plan de implementación
├── research.md          # Investigación de bloqueo transaccional y UX de búsqueda
├── data-model.md        # Esquema Prisma y contratos de entidades
├── quickstart.md        # Guía de validación y escenarios de prueba
├── contracts/           
│   └── api-contracts.md # Contratos REST de endpoints
└── checklists/
    └── requirements.md  # Checklist de requerimientos aprobado
```

### Source Code Impact

```text
packages/types/
└── src/
    ├── article.types.ts       # DTOs actualizados (code opcional, CreateArticleDto)
    └── category.types.ts      # Seed y currentSequence en ArticleCategory

apps/api/
├── prisma/
│   ├── schema.prisma          # Migración: seed y currentSequence en ArticleCategory
│   └── migrations/            # Nueva migración atómica versionada
└── src/
    └── modules/
        ├── categories/        # Validación y persistencia de seed en categorías
        └── articles/          # Endpoint /code/:code y generación de secuencia transaccional

apps/web/
└── src/app/
    ├── services/
    │   ├── articles.service.ts   # Método findByCode(code)
    │   └── categories.service.ts # Manejo de categorías con semilla
    └── components/articles/
        ├── article-form/         # Selector de categoría, búsqueda Tab/Enter, lupa y modo edición
        ├── category-combobox/    # Visualización y alta con semilla
        └── article-search-modal/ # Modal de búsqueda asistida de artículos

apps/android/
└── app/src/main/java/com/mmedic/
    ├── data/model/               # Modelos Kotlin sincronizados con seed y secuencia
    ├── data/remote/              # Endpoints Retrofit (findByCode, create)
    └── ui/articles/              # Pantalla Compose con selector de categoría y búsqueda con lupa
```

---

## Complexity Tracking

*No se detectan violaciones a la Constitución Técnica. La arquitectura utiliza los patrones estándar de Prisma, NestJS y Angular Signals ya establecidos.*
