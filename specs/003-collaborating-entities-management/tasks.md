# Tasks: Módulo de Entidades Colaboradoras (Gestión y Detección de Duplicados)

**Feature Branch**: `003-collaborating-entities-management` | **Spec**: [`spec.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/003-collaborating-entities-management/spec.md) | **Plan**: [`plan.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/003-collaborating-entities-management/plan.md)

---

## Phase 1: Shared Infrastructure & DTOs

**Purpose**: Definición de tipos de contratos compartidos en `@mmedic/types` para Web y Android.

- [ ] T001 [P] Definir interfaces y DTOs (`EntityWithStats`, `DuplicateEntityGroup`, `MergeEntitiesDto`, `UpdateEntityDto`) en [`packages/types/src/index.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/packages/types/src/index.ts)

---

## Phase 2: Foundational Backend API (`apps/api`)

**Purpose**: Endpoints REST con reglas de negocio, borrado seguro y algoritmo de detección/fusión de duplicados.

- [ ] T002 Actualizar `EntitiesService` en [`apps/api/src/modules/entities/entities.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/entities/entities.service.ts) con métodos `findAll` (con `articlesCount`), `update`, borrado seguro `remove` (bloqueo si `articlesCount > 0`), `findDuplicates` y `merge` transaccional.
- [ ] T003 Actualizar `EntitiesController` en [`apps/api/src/modules/entities/entities.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/entities/entities.controller.ts) exponiendo endpoints REST ($\le 80$ LOC limit).

---

## Phase 3: Web App Implementation (`apps/web`)

**Purpose**: Módulo SPA Angular con Signals, notificaciones push flotantes y navegación adaptativa.

- [ ] T004 [P] Extender `EntitiesService` en [`apps/web/src/app/services/entities.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/services/entities.service.ts) con Signals state para CRUD, duplicados y fusión.
- [ ] T005 [P] Crear `EntitiesListComponent` en [`apps/web/src/app/components/entities/entities-list/entities-list.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/entities/entities-list/entities-list.component.ts) (.html, .css) para tabla de colaboradores con búsqueda, filtro por estado y modal de borrado seguro.
- [ ] T006 [P] Crear `EntityFormModalComponent` en [`apps/web/src/app/components/entities/entity-form-modal/entity-form-modal.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/entities/entity-form-modal/entity-form-modal.component.ts) (.html, .css) para alta/edición (cumpliendo Constitución v2.6.0 con retención en pantalla en edición).
- [ ] T007 [P] Crear `EntityDuplicatesComponent` en [`apps/web/src/app/components/entities/entity-duplicates/entity-duplicates.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/entities/entity-duplicates/entity-duplicates.component.ts) (.html, .css) para vista de auditoría y consolidación de duplicados.
- [ ] T008 Registrar enlace a "Entidades Colaboradoras" en `HeaderComponent` mega-menú [`apps/web/src/app/components/header/header.component.html`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/header/header.component.html) y la ruta `/entities` en [`apps/web/src/app/app.routes.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/app.routes.ts).

---

## Phase 4: Android App Implementation (`apps/android`)

**Purpose**: Módulo móvil nativo Jetpack Compose con paridad funcional total.

- [ ] T009 [P] Crear `EntitiesApiService` en [`apps/android/app/src/main/java/com/mmedic/data/api/EntitiesApiService.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/data/api/EntitiesApiService.kt) y configurar Retrofit en `ApiClient.kt`.
- [ ] T010 [P] Crear `EntitiesViewModel` en [`apps/android/app/src/main/java/com/mmedic/ui/entities/EntitiesViewModel.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/entities/EntitiesViewModel.kt) ($\le 300$ LOC).
- [ ] T011 [P] Crear `EntitiesListSection.kt` y `EntityDuplicatesSection.kt` en [`apps/android/app/src/main/java/com/mmedic/ui/entities/`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/entities/).
- [ ] T012 [P] Crear `EntityFormDialog` en [`apps/android/app/src/main/java/com/mmedic/ui/entities/EntityFormDialog.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/entities/EntityFormDialog.kt) integrado con `NotificationManager`.
- [ ] T013 Crear `EntitiesScreen` composable en [`apps/android/app/src/main/java/com/mmedic/ui/entities/EntitiesScreen.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/entities/EntitiesScreen.kt) con tabs y montar navegación en [`MainActivity.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/MainActivity.kt).

---

## Phase 5: Build & Verification

**Purpose**: Garantizar 0 errores de compilación y validar flujos en ambas plataformas.

- [ ] T014 Ejecutar `pnpm build` en la raíz del monorepo.
- [ ] T015 Ejecutar `.\gradlew.bat compileDebugKotlin` en `apps/android`.
