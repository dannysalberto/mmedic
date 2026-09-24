# tasks.md — Módulo de Gestión de Categorías Inmutables
# Feature: 004-article-categories-management
# Spec: spec.md | Plan: plan.md | Constitution: v2.6.0

<!--
  ============================================================================
  INSTRUCTIONS FOR SPECKIT-IMPLEMENT:
  Process tasks in order. Mark [/] when in progress, [x] when complete.
  Each phase is independently testable. No tests requested — skip test tasks.
  ============================================================================
-->

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Centralize shared DTOs in `@mmedic/types` and scaffold NestJS module.

- [x] T001 Add `CategoryWithStats`, `DuplicateCategoryGroup`, `MergeCategoriesDto`, `UpdateCategoryDto` interfaces to `packages/types/src/index.ts`
- [x] T002 Scaffold `apps/api/src/modules/categories/` directory with `categories.module.ts`, `categories.controller.ts`, `categories.service.ts` (empty stubs)
- [x] T003 [P] Register `CategoriesModule` inside `apps/api/src/app.module.ts`

---

## Phase 2: Foundational (Backend — Blocking for All User Stories)

**Purpose**: Implement the full NestJS backend (CRUD, Safe Delete, Merge). All UI phases depend on this phase being complete.

> ⚠️ **CRITICAL**: No user story UI work can begin until this phase is complete.

- [x] T004 Implement `CategoriesService.findAll(tenantId)` in `apps/api/src/modules/categories/categories.service.ts` — query `ArticleCategory` with `_count: { articles: true }` and map to `CategoryWithStats[]`; apply `tenantId` filter (Multi-Tenant by default)
- [x] T005 Implement `CategoriesService.findOne(id, tenantId)` in `apps/api/src/modules/categories/categories.service.ts` — return single `CategoryWithStats` or throw 404
- [x] T006 Implement `CategoriesService.create(name, tenantId)` in `apps/api/src/modules/categories/categories.service.ts` — validate name uniqueness within tenant; throw HTTP 400 on duplicate
- [x] T007 Implement `CategoriesService.update(id, dto, tenantId)` in `apps/api/src/modules/categories/categories.service.ts` — update name; validate uniqueness; throw HTTP 400 on duplicate
- [x] T008 Implement `CategoriesService.remove(id, tenantId)` in `apps/api/src/modules/categories/categories.service.ts` — Safe Delete Rule: check `articlesCount > 0`; if so throw HTTP 400 with message "No se puede eliminar la categoría '[Nombre]' porque está vinculada a X artículos. Reasigne o desasocie los artículos previamente"
- [x] T009 Implement `CategoriesService.findDuplicates(tenantId)` in `apps/api/src/modules/categories/categories.service.ts` — normalize names (lowercase, remove accents, collapse whitespace); group candidates with `matchScore`; return `DuplicateCategoryGroup[]`
- [x] T010 Implement `CategoriesService.merge(dto: MergeCategoriesDto, tenantId)` in `apps/api/src/modules/categories/categories.service.ts` — inside `prisma.$transaction`: reassign all articles from `secondaryCategoryId` to `primaryCategoryId`, then delete secondary; throw HTTP 404 if either id not found
- [x] T011 Implement `CategoriesController` in `apps/api/src/modules/categories/categories.controller.ts` (≤ 80 LOC) with routes: GET /api/v1/article-categories, GET /api/v1/article-categories/duplicates, POST /api/v1/article-categories/merge, GET /api/v1/article-categories/:id, POST /api/v1/article-categories, PUT /api/v1/article-categories/:id, DELETE /api/v1/article-categories/:id — delegate all logic to `CategoriesService`; apply `JwtAuthGuard`

**Checkpoint**: API endpoints respond correctly — all UI phases can now start in parallel.

---

## Phase 3: User Story 1 — Navegación y Listado de Categorías (Priority: P1) MVP

**Goal**: Users can navigate to the Categories module from the main menu and see the full list with `articlesCount`, creation date and action buttons.

**Independent Test**: Navigate to "Categorías Inmutables" in Web mega-menu or Android bottom-nav → list renders with Nombre, Artículos (count), Fecha and action buttons. Real-time search filter works.

### Implementation for User Story 1

- [x] T012 [P] [US1] Create Angular `CategoriesService` in `apps/web/src/app/services/categories.service.ts` — Signals-based: `categories = signal<CategoryWithStats[]>([])`, `isLoading`, `error`; methods: `loadAll()`, `search(term)` (client-side filter via `computed()`)
- [x] T013 [P] [US1] Create `CategoriesListComponent` stub shell in `apps/web/src/app/components/categories/categories-list/categories-list.component.ts` and `.html`
- [x] T014 [US1] Add route `/categories` to Angular router in `apps/web/src/app/app.routes.ts` pointing to lazy-loaded `CategoriesListComponent`
- [x] T015 [US1] Add "Categorías de Artículos" link to Web mega-menu in `apps/web/src/app/components/header/header.component.html`
- [x] T016 [US1] Implement `CategoriesListComponent` full UI in `apps/web/src/app/components/categories/categories-list/categories-list.component.ts` (≤ 300 LOC) — table/card with Nombre, Artículos count, Fecha Creación; real-time search input; Edit and Delete action buttons per row
- [x] T017 [P] [US1] Add `CategoriesApiService` Retrofit interface in `apps/android/app/src/main/java/com/mmedic/data/api/CategoriesApiService.kt` — suspend fun getCategories and all CRUD + merge endpoints
- [x] T018 [P] [US1] Add Android DTOs (`CategoryWithStats`, `DuplicateCategoryGroup`, `MergeCategoriesDto`) to `apps/android/app/src/main/java/com/mmedic/data/model/ArticleModels.kt`
- [x] T019 [US1] Create `CategoriesViewModel` in `apps/android/app/src/main/java/com/mmedic/ui/categories/CategoriesViewModel.kt` (≤ 300 LOC) — `StateFlow<List<CategoryWithStats>>` + `uiState`; `loadCategories()`, `search(query)`, `deleteCategory(id)`
- [x] T020 [US1] Create `CategoriesListSection` composable in `apps/android/app/src/main/java/com/mmedic/ui/categories/CategoriesListSection.kt` (≤ 300 LOC) — `LazyColumn` with Nombre, count badge, Fecha; search `TextField`; Edit/Delete icon buttons per item
- [x] T021 [US1] Create `CategoriesScreen` (tabbed: Lista | Duplicados) in `apps/android/app/src/main/java/com/mmedic/ui/categories/CategoriesScreen.kt` (≤ 300 LOC) — integrate `CategoriesListSection` in Tab 1
- [x] T022 [US1] Add `CategoriesScreen` route + "Categorías" menu entry to `apps/android/app/src/main/java/com/mmedic/MainActivity.kt`

**Checkpoint**: US1 fully functional — list visible in both Web and Android.

---

## Phase 4: User Story 2 — Creación y Edición con Notificaciones Push (Priority: P1)

**Goal**: Admins create (redirect to list after toast) and edit (stay on screen after toast) categories directly from the module.

**Independent Test**: Create new category → push toast success → auto-redirect to list. Edit existing → push toast success → stays on form/modal. Duplicate name → push toast error → stays on form.

### Implementation for User Story 2

- [x] T023 [P] [US2] Create `CategoryFormModalComponent` in `apps/web/src/app/components/categories/category-form-modal/category-form-modal.component.ts` (≤ 300 LOC) — reactive form with name field; `isEditMode` input; on CREATE success: emit `NotificationService.success()` then navigate to `/categories`; on UPDATE success: emit `NotificationService.success()` and stay on current screen (Constitution §5.4); on error: emit `NotificationService.error()` and stay
- [x] T024 [US2] Wire "Nueva Categoría" button and "Editar" per-row button in `CategoriesListComponent` to open `CategoryFormModalComponent` in create/edit modes (`apps/web/src/app/components/categories/categories-list/categories-list.component.ts`)
- [x] T025 [US2] Extend Angular `CategoriesService` with `create(name)` and `update(id, dto)` methods calling the API and refreshing `categories` signal on success (`apps/web/src/app/services/categories.service.ts`)
- [x] T026 [P] [US2] Create `CategoryFormDialog` composable in `apps/android/app/src/main/java/com/mmedic/ui/categories/CategoryFormDialog.kt` (≤ 300 LOC) — `AlertDialog` with name `OutlinedTextField`; create mode: on success show banner + pop back to list; edit mode: on success show banner + do NOT navigate (Constitution §5.4); on error: show banner and stay
- [x] T027 [US2] Wire FAB and edit-icon in `CategoriesListSection` to open `CategoryFormDialog`; extend `CategoriesViewModel` with `createCategory(name)` and `updateCategory(id, name)` in `apps/android/app/src/main/java/com/mmedic/ui/categories/CategoriesViewModel.kt`

**Checkpoint**: US2 functional — create/edit with push toasts working on Web and Android.

---

## Phase 5: User Story 3 — Borrado Seguro (Priority: P2)

**Goal**: Admins delete categories with 0 articles; deletion blocked for categories with articles and shows an explanatory notification.

**Independent Test**: Delete category with 0 articles → toast success + removed from list. Click Delete on category with ≥1 articles → toast error with count message → item stays.

### Implementation for User Story 3

- [x] T028 [US3] Implement `delete(id)` in Angular `CategoriesService` (`apps/web/src/app/services/categories.service.ts`) — on HTTP 400 from API emit `NotificationService.error()` with descriptive message; on success emit `NotificationService.success()` and refresh list signal
- [x] T029 [US3] Add confirmation dialog + delete handler to `CategoriesListComponent` in `apps/web/src/app/components/categories/categories-list/categories-list.component.ts` — show custom confirm dialog (not native confirm()); on confirm call `CategoriesService.delete(id)`
- [x] T030 [US3] Extend `CategoriesViewModel.deleteCategory(id)` to handle HTTP 400 response in `apps/android/app/src/main/java/com/mmedic/ui/categories/CategoriesViewModel.kt` — emit error `UiState` so list shows notification banner
- [x] T031 [US3] Add confirmation `AlertDialog` before deletion in `CategoriesListSection` (`apps/android/app/src/main/java/com/mmedic/ui/categories/CategoriesListSection.kt`) — on confirm call `viewModel.deleteCategory(id)`

**Checkpoint**: US3 functional — safe delete enforced on both platforms.

---

## Phase 6: User Story 4 — Detección y Consolidación de Duplicados (Priority: P2)

**Goal**: Auditors view groups of duplicate categories and merge the secondary into the primary (atomic, all articles reassigned).

**Independent Test**: Open Duplicates tab → groups rendered with normalized name key and match score. Select primary, click "Consolidar / Fusionar" → toast success → secondary removed → articles reassigned.

### Implementation for User Story 4

- [x] T032 [P] [US4] Add `loadDuplicates()` and `merge(dto: MergeCategoriesDto)` methods to Angular `CategoriesService` (`apps/web/src/app/services/categories.service.ts`) — `duplicates = signal<DuplicateCategoryGroup[]>([])`
- [x] T033 [US4] Create `CategoryDuplicatesComponent` in `apps/web/src/app/components/categories/category-duplicates/category-duplicates.component.ts` (≤ 300 LOC) — list groups; per group: candidates with radio to pick primary; "Consolidar / Fusionar" button calls `CategoriesService.merge()`; on success: `NotificationService.success()` + reload signals; on error: `NotificationService.error()`
- [x] T034 [US4] Add "Duplicados" tab to `CategoriesListComponent` and wire `CategoryDuplicatesComponent` in `apps/web/src/app/components/categories/categories-list/`
- [x] T035 [P] [US4] Extend `CategoriesViewModel` with `loadDuplicates()` and `mergeCategories(dto)` in `apps/android/app/src/main/java/com/mmedic/ui/categories/CategoriesViewModel.kt` — `duplicates: StateFlow<List<DuplicateCategoryGroup>>`
- [x] T036 [US4] Create `CategoryDuplicatesSection` composable in `apps/android/app/src/main/java/com/mmedic/ui/categories/CategoryDuplicatesSection.kt` (≤ 300 LOC) — `LazyColumn` of duplicate groups; radio/chip to pick primary; "Fusionar" Button; on confirm call `viewModel.mergeCategories()`; show banner on success/error
- [x] T037 [US4] Wire `CategoryDuplicatesSection` into Tab 2 of `CategoriesScreen` in `apps/android/app/src/main/java/com/mmedic/ui/categories/CategoriesScreen.kt`

**Checkpoint**: US4 functional — duplicate detection and merge working on both platforms.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Compilation verification and LOC compliance check.

- [x] T038 [P] Run `pnpm build` from monorepo root and resolve any TypeScript errors — verify `packages/types` exports consumed correctly by `apps/api` and `apps/web`
- [x] T039 [P] Run `.\gradlew.bat compileDebugKotlin` from `apps/android` root and resolve any Kotlin compilation errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Backend)**: Depends on Phase 1 — BLOCKS all UI phases
- **Phase 3 (US1 — List)**: Depends on Phase 2
- **Phase 4 (US2 — Create/Edit)**: Depends on Phase 2; shares Phase 3 UI components
- **Phase 5 (US3 — Safe Delete)**: Depends on Phase 2; hooks into Phase 3 list's delete action
- **Phase 6 (US4 — Duplicates/Merge)**: Depends on Phase 2; shares Phase 3 tabbed screen
- **Phase 7 (Polish)**: Depends on all previous phases

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T012 (Angular service) and T017-T018 (Android DTOs + Retrofit) can run in parallel
- T023 (Web form modal) and T026 (Android dialog) can run in parallel
- T028-T029 (Web delete) and T030-T031 (Android delete) can run in parallel
- T032-T034 (Web duplicates) and T035-T037 (Android duplicates) can run in parallel
- T038 and T039 (build verification) can run in parallel

---

## Parallel Example: User Story 1

```bash
# After Phase 2 complete, launch Web and Android in parallel:

# Web tracks:
Task T012: Create Angular CategoriesService (signals)
Task T013: CategoriesListComponent shell
Task T014: Add /categories route
Task T015: Add mega-menu link
Task T016: Full CategoriesListComponent implementation

# Android tracks (simultaneously):
Task T017: CategoriesApiService Retrofit interface
Task T018: Android DTOs
Task T019: CategoriesViewModel
Task T020: CategoriesListSection composable
Task T021: CategoriesScreen tabbed
Task T022: Route + menu in MainActivity
```

---

## Implementation Strategy

### MVP First (US1 + US2 — both P1)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Backend — all 8 endpoints)
3. Complete Phase 3 (US1 — list + navigation on Web and Android)
4. Complete Phase 4 (US2 — create/edit with push notifications)
5. STOP and VALIDATE — categories listed, created, and edited in both apps
6. Deploy/demo as MVP

### Incremental Delivery

1. Setup + Backend → API ready
2. Add US1 → List visible on both platforms → Demo
3. Add US2 → Create/Edit functional → Demo
4. Add US3 → Safe Delete enforced → Demo
5. Add US4 → Duplicate detection + Merge → Demo
6. Polish → Build verified → Release

---

## Notes

- `[P]` tasks = different files, no cross-task dependency — can run in parallel
- `[USn]` label maps each task to its user story for traceability
- Constitution v2.6.0 §5.4: UPDATE stays on screen; CREATE redirects to list
- Safe Delete Rule: API returns HTTP 400 with descriptive message when `articlesCount > 0`
- Merge is fully atomic via `prisma.$transaction` — no partial reassignment
- All controllers ≤ 80 LOC, all components/services ≤ 300 LOC (Constitution §3.2, §3.3)
- Multi-Tenant: every query must include `tenantId` filter (Constitution §2.3)
