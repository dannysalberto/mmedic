# Tasks: Módulo de Personal y Colaboradores Técnicos/Profesionales

**Feature Branch**: `006-contributors-management` | **Spec**: [`spec.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/006-contributors-management/spec.md) | **Plan**: [`plan.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/006-contributors-management/plan.md)

---

## Phase 1: Setup (Shared Contracts & Types)

**Purpose**: Definición de los contratos de dominio, tipos y DTOs compartidos en `@mmedic/types` para backend NestJS, frontend Angular y móvil Android.

- [x] T001 [P] Crear archivo de tipos y DTOs del colaborador (`Contributor`, `ContributorStatus`, `ContributorWithStats`, `CreateContributorDto`, `UpdateContributorDto`, `DuplicateContributorGroup`, `MergeContributorsDto`, `ContributorFilterQuery`) en [`packages/types/src/contributor.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/packages/types/src/contributor.ts)
- [x] T002 Exportar contratos y tipos de `contributor.ts` en el barrel principal [`packages/types/src/index.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/packages/types/src/index.ts)

---

## Phase 2: Foundational (Database Schema & API Base Structure)

**Purpose**: Infraestructura bloqueante de base de datos y módulo base en `apps/api`. Debe completarse antes de implementar las historias de usuario.

- [x] T003 Agregar modelo `Contributor` con mapeo a tabla `contributors`, clave foránea a `Tenant` e índices `[tenantId]`, `[tenantId, code]`, `[tenantId, name]` en [`apps/api/prisma/schema.prisma`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/prisma/schema.prisma)
- [x] T004 Generar y aplicar la migración SQL atómica para la tabla `contributors` en [`apps/api/prisma/migrations/`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/prisma/migrations/)
- [x] T005 Crear módulo NestJS base `ContributorsModule` en [`apps/api/src/modules/contributors/contributors.module.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.module.ts) y registrarlo en [`apps/api/src/app.module.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/app.module.ts)
- [x] T006 Crear esqueleto del controlador `ContributorsController` ($\le 80$ LOC) con JwtAuthGuard y tenant extraction en [`apps/api/src/modules/contributors/contributors.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.controller.ts)
- [x] T007 Crear esqueleto de servicio `ContributorsService` ($\le 300$ LOC) con inyección de PrismaService y logger en [`apps/api/src/modules/contributors/contributors.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.service.ts)

---

## Phase 3: User Story 1 - Navegación y Listado de Personal/Colaboradores (Priority: P1) 🎯 MVP

**Goal**: Permitir a los usuarios acceder desde el menú principal "Personal/Profesionales" al módulo de colaboradores para listar, filtrar por estado y buscar en tiempo real en Web y Android.

**Independent Test**: Acceder a `/contributors` desde el header de la Web o navegación Android, visualizar la lista de personal con columnas Código, Nombre, Estado y Acciones, y verificar filtros reactivos.

- [x] T008 [US1] Implementar método `findAll(tenantId, query)` con paginación, filtro por estado y búsqueda por código/nombre en [`apps/api/src/modules/contributors/contributors.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.service.ts)
- [x] T009 [US1] Exponer endpoint `GET /api/v1/contributors` en [`apps/api/src/modules/contributors/contributors.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.controller.ts)
- [x] T010 [P] [US1] Crear servicio Angular `ContributorsService` con Signals para carga reactiva de listado y filtros en [`apps/web/src/app/services/contributors.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/services/contributors.service.ts)
- [x] T011 [P] [US1] Crear componente de listado `ContributorsListComponent` (.ts, .html, .css) con buscador en tiempo real y selector de estado en [`apps/web/src/app/components/contributors/contributors-list/contributors-list.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/contributors/contributors-list/contributors-list.component.ts)
- [x] T012 [US1] Actualizar la opción "Personal/Profesionales" en [`apps/web/src/app/components/header/header.component.html`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/header/header.component.html) para enrutar a `/contributors` y registrar ruta en [`apps/web/src/app/app.routes.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/app.routes.ts)
- [x] T013 [P] [US1] Definir modelos de datos Android `Contributor.kt` y llamada Retrofit `getContributors` en [`apps/android/app/src/main/java/com/mmedic/data/api/ContributorsApiService.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/data/api/ContributorsApiService.kt)
- [x] T014 [P] [US1] Implementar `ContributorsViewModel.kt` con StateFlow para lista de colaboradores y búsqueda en [`apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorsViewModel.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorsViewModel.kt)
- [x] T015 [P] [US1] Crear composable `ContributorsListSection.kt` en [`apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorsListSection.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorsListSection.kt) y montar la pantalla `ContributorsScreen.kt` en [`MainActivity.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/MainActivity.kt)

---

## Phase 4: User Story 2 - Registro y Edición con Notificaciones Push y Retención (Priority: P1)

**Goal**: Permitir dar de alta nuevos colaboradores (notifica éxito y redirige) y editar colaboradores existentes preservando la retención en pantalla (Constitución v2.6.0 Principio 5.4).

**Independent Test**: Crear un colaborador desde "+ Nuevo Colaborador" (notifica y vuelve al índice) y editar uno existente cambiando nombre/estado (notifica éxito y permanece en el formulario sin auto-navegar).

- [x] T016 [US2] Implementar métodos `create(tenantId, dto)` con validación de código único y `update(tenantId, id, dto)` en [`apps/api/src/modules/contributors/contributors.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.service.ts)
- [x] T017 [US2] Exponer endpoints `POST /api/v1/contributors`, `PUT /api/v1/contributors/:id` y `GET /api/v1/contributors/:id` en [`apps/api/src/modules/contributors/contributors.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.controller.ts)
- [x] T018 [P] [US2] Extender `ContributorsService` en Angular con métodos `createContributor` y `updateContributor` en [`apps/web/src/app/services/contributors.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/services/contributors.service.ts)
- [x] T019 [P] [US2] Crear modal de formulario `ContributorFormModalComponent` (.ts, .html, .css) con validación de código, integración de `NotificationService` y retención de pantalla en edición en [`apps/web/src/app/components/contributors/contributor-form-modal/contributor-form-modal.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/contributors/contributor-form-modal/contributor-form-modal.component.ts)
- [x] T020 [P] [US2] Agregar llamadas `createContributor` y `updateContributor` a [`apps/android/app/src/main/java/com/mmedic/data/api/ContributorsApiService.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/data/api/ContributorsApiService.kt)
- [x] T021 [P] [US2] Crear diálogo composable `ContributorFormDialog.kt` con validación, notificación banner Material3 y retención de diálogo en edición en [`apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorFormDialog.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorFormDialog.kt)

---

## Phase 5: User Story 3 - Borrado Seguro de Colaboradores (Safe Deletion Rule) (Priority: P2)

**Goal**: Garantizar la integridad histórica y contable impidiendo el borrado de colaboradores que tengan vínculos o participaciones activas.

**Independent Test**: Intentar borrar un colaborador con participaciones (el sistema rechaza la acción con mensaje explicativo) frente a borrar un colaborador libre de vínculos (borrado físico con notificación push de confirmación).

- [x] T022 [US3] Implementar método de borrado seguro `remove(tenantId, id)` en [`apps/api/src/modules/contributors/contributors.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.service.ts) que verifique dependencias y lance `BadRequestException` con log en BD si existen asociaciones
- [x] T023 [US3] Exponer endpoint `DELETE /api/v1/contributors/:id` en [`apps/api/src/modules/contributors/contributors.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.controller.ts)
- [x] T024 [P] [US3] Integrar diálogo de confirmación de borrado seguro y manejo de respuestas en [`apps/web/src/app/components/contributors/contributors-list/contributors-list.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/contributors/contributors-list/contributors-list.component.ts)
- [x] T025 [P] [US3] Integrar confirmación de borrado seguro y manejo de errores 400 en [`apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorsListSection.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorsListSection.kt)

---

## Phase 6: User Story 4 - Detección y Fusión de Duplicados (Priority: P2)

**Goal**: Detectar personal médico o técnico registrado con variaciones tipográficas o prefijos y consolidar sus registros de manera atómica hacia un perfil maestro.

**Independent Test**: Crear dos colaboradores semejantes, navegar a la pestaña "Detección de Duplicados", verificar el agrupamiento por similitud ($\ge 80\%$) y ejecutar la fusión transaccional hacia el perfil maestro.

- [x] T026 [US4] Implementar algoritmo de normalización y detección de duplicados `findDuplicates(tenantId)` en [`apps/api/src/modules/contributors/contributors.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.service.ts)
- [x] T027 [US4] Implementar método de fusión atómica transaccional `merge(tenantId, dto)` con Prisma `$transaction` en [`apps/api/src/modules/contributors/contributors.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.service.ts)
- [x] T028 [US4] Exponer endpoints `GET /api/v1/contributors/duplicates` y `POST /api/v1/contributors/merge` en [`apps/api/src/modules/contributors/contributors.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/contributors/contributors.controller.ts)
- [x] T029 [P] [US4] Crear componente Angular `ContributorDuplicatesComponent` (.ts, .html, .css) para auditoría y fusión con notificaciones push en [`apps/web/src/app/components/contributors/contributor-duplicates/contributor-duplicates.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/contributors/contributor-duplicates/contributor-duplicates.component.ts)
- [x] T030 [P] [US4] Agregar pestaña "Detección de Duplicados" y vinculación de componentes en [`apps/web/src/app/components/contributors/contributors-list/contributors-list.component.html`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/contributors/contributors-list/contributors-list.component.html)
- [x] T031 [P] [US4] Agregar llamadas `getDuplicates` y `mergeContributors` en [`apps/android/app/src/main/java/com/mmedic/data/api/ContributorsApiService.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/data/api/ContributorsApiService.kt)
- [x] T032 [P] [US4] Crear composable `ContributorDuplicatesSection.kt` y vincular pestaña en [`apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorDuplicatesSection.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/contributors/ContributorDuplicatesSection.kt)

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validación de compilación, verificación de límites arquitectónicos LOC y aseguramiento de calidad final en ambas plataformas.

- [x] T033 Ejecutar compilación y typechecking del monorepo (`pnpm build`) para verificar contratos TypeScript en `@mmedic/types`, `apps/api` y `apps/web`
- [x] T034 [P] Ejecutar compilación de depuración de Kotlin (`.\gradlew.bat compileDebugKotlin`) en `apps/android` para validar paridad móvil
- [x] T035 [P] Auditar límites de código de la Constitución v2.6.0 (`ContributorsController` $\le 80$ LOC, componentes/servicios $\le 300$ LOC)
- [x] T036 Ejecutar escenarios de validación manual descritos en [`quickstart.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/006-contributors-management/quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

```mermaid
graph TD
    Phase1[Phase 1: Setup & Shared Types] --> Phase2[Phase 2: Foundational DB & Base API]
    Phase2 --> Phase3[Phase 3: US1 - Navegación y Listado (P1 MVP)]
    Phase3 --> Phase4[Phase 4: US2 - Creación y Edición (P1)]
    Phase2 --> Phase5[Phase 5: US3 - Borrado Seguro (P2)]
    Phase2 --> Phase6[Phase 6: US4 - Duplicados y Fusión (P2)]
    Phase4 --> Phase7[Phase 7: Polish & Verification]
    Phase5 --> Phase7
    Phase6 --> Phase7
```

### Parallel Opportunities

- **Phase 1**: `T001` y su exportación en `T002`.
- **Phase 3**: `T010` (Web Service), `T011` (Web List UI), `T013` (Android API), `T014` (Android ViewModel) y `T015` (Android UI) pueden implementarse en paralelo una vez expuestos los endpoints en `T008`-`T009`.
- **Phase 4**: `T018`-`T019` (Angular Form Modal) y `T020`-`T021` (Android Form Dialog) pueden desarrollarse en paralelo tras completar `T016`-`T017`.
- **Phase 6**: `T029`-`T030` (Web Duplicates UI) y `T031`-`T032` (Android Duplicates UI) pueden ejecutarse simultáneamente tras completar `T026`-`T028`.
- **Phase 7**: `T034` y `T035` pueden validarse en paralelo.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Completar Fase 1 (Setup) y Fase 2 (Foundational DB & Base API).
2. Implementar Fase 3 (US1: Navegación desde Menú y Listado de Colaboradores).
3. **Validar MVP**: Navegar desde "Personal/Profesionales", listar colaboradores y verificar filtros reactivos.

### Entrega Incremental
1. Añadir Fase 4 (US2: Creación y Edición con retención de pantalla).
2. Añadir Fase 5 (US3: Borrado seguro).
3. Añadir Fase 6 (US4: Detección y fusión de duplicados).
4. Ejecutar Fase 7 (Polish, compilación cruzada `pnpm build` y Gradle Android).
