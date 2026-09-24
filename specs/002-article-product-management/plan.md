# Implementation Plan: Registro y Gestión de Artículos, Categorías y Entidades Participantes

**Branch**: `002-article-product-management` | **Date**: 2026-09-22 | **Spec**: [specs/002-article-product-management/spec.md](./spec.md)

**Input**: Feature specification from `specs/002-article-product-management/spec.md`

---

## Summary

Diseño e implementación del módulo integral de **Artículos y Productos** para la plataforma **MMedic**. El módulo permite registrar el catálogo maestro de artículos que serán facturados en el sistema médico, soportando hasta cuatro (4) esquemas de precios de venta (`price1..4`), categorías dinámicas inmutables con componente de selección y búsqueda en línea (*searchable combobox* con creación inmediata sin recarga), y vinculación de participantes (médicos o entidades) gestionados en una tabla de entidades maestras. Incluye una tabla detalle de participantes con búsqueda por código, una ventana modal para el registro inmediato de entidades no existentes y una regla estricta de validación reactiva en dos capas que garantiza que la suma de porcentajes de participación jamás supere el 100.00% ($\sum \% \le 100\%$). Todo el desarrollo opera bajo aislamiento Multi-Tenant nativo (`tenantId`), diseño Mobile-First sin desbordamiento horizontal y trazabilidad de excepciones en base de datos.

---

## Technical Context

**Language/Version**: TypeScript 5.7+ (Node.js v22+ en Backend, Angular 19+ en Frontend).

**Primary Dependencies**:
- **Backend (`apps/api`)**: NestJS 11, Prisma ORM 6, Passport-JWT, class-validator, class-transformer, `@nestjs/swagger`.
- **Frontend (`apps/web`)**: Angular 19 (Standalone Components, Signals, Reactive Forms, Vanilla CSS con Design Tokens).
- **Tipos Compartidos (`packages/types`)**: `@mmedic/types` (Modelos `Article`, `ArticleCategory`, `Entity`, `ArticleParticipant`, DTOs de entrada y `ApiResponse<T>`).

**Storage**: PostgreSQL en la nube alojado en **Supabase** (conectividad dual con `DATABASE_URL` para runtime y `DIRECT_URL` para migraciones atómicas versionadas de Prisma).

**Testing**: Jest (Unit & Integration tests en NestJS), Jasmine / Angular Testing Library en Web, Supertest para validación de endpoints.

**Target Platform**: Web Responsive (Mobile, Tablet, Desktop) y API REST agnóstica para clientes Web y Móviles nativos (Android Compose / iOS).

**Project Type**: Monorepo empresarial estructurado con Turborepo y pnpm workspaces.

**Performance Goals**:
- Búsqueda reactiva de entidades por código: < 100 ms.
- Creación y persistencia de artículos con participantes: < 250 ms.
- Feedback de validación porcentual en Frontend: Inmediato (< 16 ms, reactividad con Angular Signals).
- Cero desbordamiento horizontal en pantallas móviles (< 640px).

**Constraints**:
- Aislamiento Multi-Tenant obligatorio en todas las tablas y consultas mediante `tenantId` (Constitución 2.3).
- Inmutabilidad estricta de categorías: sin endpoint de borrado ni acción en UI (Requerimiento de Negocio / FR-006).
- Doble validación de suma de participación $\le 100.00\%$ (Frontend con Signals + Backend con validación atómica en servicio).
- Controladores delgados $\le$ 80 LOC y componentes/servicios $\le$ 300 LOC (Constitución 3.2 y 3.3).
- Trazabilidad y persistencia de cualquier excepción en la tabla `system_error_logs` (Constitución 1.4).
- Cero modificaciones manuales de base de datos; evolución atómica vía `prisma migrate dev` (Constitución 1.5).

**Scale/Scope**: Múltiples clínicas/organizaciones con catálogos de cientos de artículos y decenas de especialistas o entidades asociadas.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio Constitucional | Estado | Evidencia y Justificación Técnica |
|---|---|---|
| **Principio I: Stack & Reutilización (1.1, 1.2, 1.3)** | **PASS** | API REST pura en NestJS + Prisma; contratos compartidos en `packages/types` (`@mmedic/types`); desarrollo dual obligatorio con paridad de funcionalidad completa entre Angular 19 (`apps/web`) y Kotlin/Jetpack Compose (`apps/android`). |
| **Principio I: Trazabilidad de Errores en BD (1.4)** | **PASS** | Cualquier excepción en la creación o búsqueda de artículos/entidades es interceptada por `GlobalExceptionFilter` y persistida en `SystemErrorLog`. |
| **Principio I: Control de Migraciones Atómicas (1.5)** | **PASS** | Nuevos modelos `ArticleCategory`, `Entity`, `Article`, `ArticleParticipant` se incorporan a `schema.prisma` y se aplican mediante migración atómica versionada de Prisma. |
| **Principio II: JWT Stateless (2.1)** | **PASS** | Endpoints de artículos, categorías y entidades protegidos con `JwtAuthGuard`. |
| **Principio II: RBAC + PBAC (2.2)** | **PASS** | Acceso al módulo regulado por roles (`ROL_SUPERADMIN`, `ROL_ADMIN`, `ROL_CAJERO`, `ROL_MEDICO`) y permisos específicos de catálogo. |
| **Principio II: Multi-Tenant por Defecto (2.3)** | **PASS** | Las 4 nuevas entidades relacionales poseen `tenantId` con índices dedicados y consultas filtradas por el contexto del usuario autenticado. |
| **Principio III: SOLID & Tiny Controllers (3.1, 3.2, 3.3)** | **PASS** | Controladores compactos (`ArticlesController`, `CategoriesController`, `EntitiesController`) $\le$ 80 LOC cada uno; servicios desacoplados respetando el umbral de 300 LOC. |
| **Principio IV: Reactividad por Signals & Memoria (4.1, 4.3)** | **PASS** | Cálculo en tiempo real de porcentajes con `computed()`; destrucción higiénica con `DestroyRef` y `takeUntilDestroyed()`. |
| **Principio V: UI/UX & Mobile-First (5.1, 5.2, 5.3)** | **PASS** | Tabla de participantes con diseño adaptable: vista tabular en desktop ($\ge 1024$px) y formato tarjeta (*card*) apilado en móvil (< 640px) sin overflow horizontal; modal fluido con targets de toque $\ge 44\times44$px. |

---

## Project Structure

### Documentation (this feature)

```text
specs/002-article-product-management/
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
│           └── index.ts                 # Contratos Article, ArticleCategory, Entity, ArticleParticipant, DTOs
│
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # Modelos ArticleCategory, Entity, Article, ArticleParticipant
│   │   │   └── migrations/              # Migración atómica versionada
│   │   └── src/
│   │       └── modules/
│   │           ├── categories/
│   │           │   ├── categories.controller.ts  # Tiny controller (<= 80 LOC) - GET, POST (sin DELETE)
│   │           │   ├── categories.service.ts
│   │           │   ├── categories.module.ts
│   │           │   └── dto/create-category.dto.ts
│   │           ├── entities/
│   │           │   ├── entities.controller.ts    # Tiny controller (<= 80 LOC) - GET, POST, by-code
│   │           │   ├── entities.service.ts
│   │           │   ├── entities.module.ts
│   │           │   └── dto/create-entity.dto.ts
│   │           └── articles/
│   │               ├── articles.controller.ts    # Tiny controller (<= 80 LOC) - GET, POST, PUT
│   │               ├── articles.service.ts       # Transacción atómica + validación sum(%) <= 100
│   │               ├── articles.module.ts
│   │               └── dto/
│   │                   ├── create-article.dto.ts
│   │                   └── update-article.dto.ts
│   │
│   └── web/
│       └── src/
│           └── app/
│               ├── components/
│               │   └── articles/
│               │       ├── articles-list/            # Catálogo con filtros y listado responsivo
│               │       ├── article-form/             # Formulario de artículo con 4 precios
│               │       ├── category-combobox/        # Searchable select con creación inmediata en línea
│               │       ├── participants-table/       # Detalle de participantes con cálculo reactivo (%)
│               │       └── entity-modal/             # Modal para alta rápida de entidades no existentes
│               ├── services/
│               │   ├── articles.service.ts       # Signal-based articles state & HTTP calls
│               │   ├── categories.service.ts     # Signal-based categories state & HTTP calls
│               │   └── entities.service.ts       # Signal-based entities state & HTTP calls
│               └── app.routes.ts                 # Rutas protegidas para /articles
│
├── apps/android/
│   └── app/src/main/java/com/mmedic/
│       ├── data/
│       │   ├── model/
│       │   │   └── ArticleModels.kt          # Modelos Kotlin y DTOs de Artículos, Categorías y Entidades
│       │   └── api/
│       │       └── ArticlesApiService.kt     # Retrofit endpoints (/articles, /categories, /entities)
│       └── ui/
│           └── articles/
│               ├── ArticlesViewModel.kt      # StateFlow para listado, creación y validación reactiva (sum <= 100%)
│               ├── ArticlesScreen.kt         # Lista responsiva con LazyColumn, búsqueda, chips de categorías y FAB
│               ├── ArticleFormScreen.kt      # Formulario con 4 precios, selector de categoría y tabla de participantes
│               ├── CategoryDialog.kt         # Diálogo emergente nativo para alta rápida de categoría
│               └── EntityDialog.kt           # Diálogo emergente nativo para alta rápida de entidades
```

**Structure Decision**: Monorepo desacoplado estándar de MMedic (`apps/api` con arquitectura modular por dominio, `apps/web` con componentes Standalone basados en Signals, `apps/android` con arquitectura MVVM en Jetpack Compose y `packages/types` como fuente única de verdad).

---

## Complexity Tracking

> **Violaciones a la Constitución**: 0 detectadas. Todos los aspectos del diseño técnico satisfacen los principios de gobernanza.

| Principio Auditado | Estado | Comentario |
|---|---|---|
| Tiny Controllers ($\le$ 80 LOC) | Cumplido | `CategoriesController`, `EntitiesController` y `ArticlesController` están estrictamente acotados a transporte y validación. |
| Regla 300 LOC | Cumplido | Los formularios y tablas se descomponen en componentes atómicos (`category-combobox`, `participants-table`, `entity-modal`). |
| Higiene de Memoria | Cumplido | Manejo de estado con Angular Signals y ciclo de vida limpio con `DestroyRef`. |
| Multi-Tenancy Nativo | Cumplido | Inyección de `tenantId` en Prisma para todas las entidades (`ArticleCategory`, `Entity`, `Article`, `ArticleParticipant`). |
| Mobile-First | Cumplido | Vistas con grillas y tarjetas adaptativas que previenen cualquier scroll horizontal involuntario. |
| Inmutabilidad de Categorías | Cumplido | Exclusión voluntaria de endpoint `DELETE` y directiva `onDelete: Restrict`. |
