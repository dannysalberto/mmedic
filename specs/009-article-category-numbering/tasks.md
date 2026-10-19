# Tasks: Numeración Consecutiva por Categoría y Búsqueda de Artículos

**Branch**: `009-article-category-numbering` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1: Setup (Shared Contracts & Types)

**Purpose**: Actualizar contratos compartidos en `@mmedic/types` para soportar semillas en categorías y códigos opcionales en artículos.

- [X] T001 [P] Actualizar interfaces `ArticleCategory`, `CreateArticleCategoryDto` y `UpdateArticleCategoryDto` con campos `seed` y `currentSequence` en packages/types/src/category.types.ts
- [X] T002 [P] Actualizar interfaz `CreateArticleDto` haciendo el campo `code` opcional en packages/types/src/article.types.ts
- [X] T003 Compilar y empaquetar librerías compartidas mediante `pnpm --filter @mmedic/types build` desde la raíz del monorepo

---

## Phase 2: Foundational (Database Schema & API Base)

**Purpose**: Infraestructura bloqueante en base de datos y backend que debe completarse antes de cualquier historia de usuario.

**⚠️ CRITICAL**: Ninguna tarea de historia de usuario puede comenzar hasta que esta fase esté completada y migrada.

- [X] T004 Modificar modelo `ArticleCategory` en apps/api/prisma/schema.prisma agregando `seed String`, `currentSequence Int @default(0)` y la restricción `@@unique([tenantId, seed])`
- [X] T005 Ejecutar generación de cliente y migración en apps/api mediante `pnpm db:generate` y migración Prisma
- [X] T006 Actualizar DTOs de categoría en apps/api/src/modules/categories/dto/create-category.dto.ts y update-category.dto.ts validando formato `^[A-Z0-9]{2,6}$` y transformación a mayúsculas
- [X] T007 Actualizar servicio de categorías en apps/api/src/modules/categories/categories.service.ts para persistir la semilla y validar unicidad por tenant

**Checkpoint**: Base de datos y contratos listos. Las historias de usuario pueden desarrollarse secuencial o paralelamente.

---

## Phase 3: User Story 1 - Consecutivo Automático Atómico por Categoría (Priority: P1) 🎯 MVP

**Goal**: Permitir que al guardar un artículo bajo una categoría, el sistema asigne y persista atómicamente el consecutivo exacto (`SEMILLA-NNN`) usando bloqueo transaccional por tenant sin colisiones concurrentes.

**Independent Test**: Crear una categoría con semilla `CONS`, guardar un artículo sin ingresar código manual y verificar que se genera y persiste exactamente `CONS-001`, y que el contador de la categoría pasa a `1`.

### Implementation for User Story 1

- [X] T008 [US1] Actualizar apps/api/src/modules/articles/dto/create-article.dto.ts para declarar `code` como `@IsOptional()`
- [X] T009 [US1] Implementar en apps/api/src/modules/articles/articles.service.ts la transacción interactiva de incremento atómico de secuencia sobre la categoría y generación formateada `${seed}-${String(sequence).padStart(3, '0')}`
- [X] T010 [US1] Actualizar apps/web/src/app/services/articles.service.ts para admitir creación con código opcional según contrato compartido
- [X] T011 [US1] Modificar apps/web/src/app/components/articles/article-form/article-form.component.html y apps/web/src/app/components/articles/article-form/article-form.component.ts para posicionar la selección de categoría como determinante de serie y mostrar preview del código correlativo

**Checkpoint**: A este punto, el User Story 1 (MVP) está completamente funcional y garantiza generación atómica sin colisiones.

---

## Phase 4: User Story 2 - Búsqueda Rápida por Tab/Enter y Activación Automática de Modo Edición (Priority: P2)

**Goal**: Permitir escribir un código en el formulario y, al presionar `Tab`, `Enter` o perder el foco, buscar el artículo; si existe, cargar todos sus datos y conmutar automáticamente a Modo Edición.

**Independent Test**: Entrar a `/articles/new`, tipear un código existente (ej. `CONS-001`) y pulsar `Enter`. El formulario debe cambiar su título a "Editar Artículo o Producto", poblar todos los campos y habilitar el botón "Actualizar Artículo".

### Implementation for User Story 2

- [X] T012 [US2] Implementar endpoint `GET /api/v1/articles/code/:code` en apps/api/src/modules/articles/articles.controller.ts y método `findByCode` con filtro por tenantId en apps/api/src/modules/articles/articles.service.ts
- [X] T013 [US2] Agregar método `findByCode(code: string)` en apps/web/src/app/services/articles.service.ts consumiendo el nuevo endpoint
- [X] T014 [US2] Enlazar eventos `(keydown.enter)`, `(keydown.tab)` y `(blur)` en el campo de código en apps/web/src/app/components/articles/article-form/article-form.component.html
- [X] T015 [US2] Implementar método de búsqueda por código y lógica de conmutación a Modo Edición (`isEditMode.set(true)`, precarga de precios y participantes) en apps/web/src/app/components/articles/article-form/article-form.component.ts
- [X] T016 [US2] Agregar botón accesible "Nuevo Registro / Limpiar" en apps/web/src/app/components/articles/article-form/article-form.component.html para permitir restablecer el formulario a modo creación

**Checkpoint**: User Stories 1 y 2 funcionan de manera integrada e independiente.

---

## Phase 5: User Story 3 - Búsqueda Asistida con Botón de Lupa (Priority: P3)

**Goal**: Proveer un botón de lupa interactivo junto al campo de código que abra una ventana modal con catálogo interactivo y filtro en tiempo real para seleccionar y editar un artículo.

**Independent Test**: Hacer clic en el icono de lupa junto al input de código, filtrar por nombre de artículo en el modal, hacer clic en un resultado y verificar que el modal se cierra y el artículo se carga en Modo Edición.

### Implementation for User Story 3

- [X] T017 [P] [US3] Crear componente de modal de búsqueda apps/web/src/app/components/articles/article-search-modal/article-search-modal.component.ts y su plantilla apps/web/src/app/components/articles/article-search-modal/article-search-modal.component.html con input de filtro y lista interactiva
- [X] T018 [P] [US3] Crear estilos Mobile-First y glassmorphism para el modal en apps/web/src/app/components/articles/article-search-modal/article-search-modal.component.css cumpliendo lineamientos de la Constitución
- [X] T019 [US3] Incorporar botón con icono de lupa (🔍) en el wrapper del input de código en apps/web/src/app/components/articles/article-form/article-form.component.html y conectar evento de selección con el modal en apps/web/src/app/components/articles/article-form/article-form.component.ts

**Checkpoint**: Catálogo con búsqueda manual directa y asistida visualmente terminado en la versión Web.

---

## Phase 6: User Story 4 - Paridad en Aplicación Móvil Android (Priority: P4)

**Goal**: Garantizar la paridad obligatoria de la Constitución Técnica en la aplicación nativa Android en Kotlin / Jetpack Compose.

**Independent Test**: En la app Android, ingresar al formulario de artículo, seleccionar categoría con semilla, verificar consecutivo y utilizar el botón de búsqueda con lupa para conmutar a edición.

### Implementation for User Story 4

- [X] T020 [P] [US4] Actualizar data classes `Article.kt` y `ArticleCategory.kt` con campos `seed` y `currentSequence` en apps/android/app/src/main/java/com/mmedic/data/model/
- [X] T021 [P] [US4] Agregar endpoint `getArticleByCode` en interfaz Retrofit en apps/android/app/src/main/java/com/mmedic/data/remote/
- [X] T022 [US4] Actualizar pantalla composable de artículos en apps/android/app/src/main/java/com/mmedic/ui/ incorporando trailing icon de búsqueda en el campo de código y selector de categoría

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verificación global, pruebas de compilación y validación cruzada.

- [X] T023 Compilar monorepo completo ejecutando `pnpm build` para asegurar cero errores de TypeScript y linting
- [X] T024 Ejecutar escenarios de prueba end-to-end según la guía en specs/009-article-category-numbering/quickstart.md
- [X] T025 [P] Actualizar documentación de endpoints en Swagger OpenAPI verificando etiquetas y esquemas en apps/api/src/main.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias iniciales.
- **Foundational (Phase 2)**: Depende de Phase 1. Bloquea todas las historias de usuario.
- **User Stories (Phase 3+)**: Dependen de Phase 2.
  - US1 (P1): Puede desarrollarse de inmediato tras Phase 2.
  - US2 (P2): Depende del endpoint backend de US1 y Phase 2.
  - US3 (P3): Depende de US2 para la carga en modo edición.
  - US4 (P4): Depende de los endpoints de backend completados en US1 y US2.
- **Polish (Phase 7)**: Depende de la finalización de las historias de usuario.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Completar Phase 1 (Contratos y tipos).
2. Completar Phase 2 (Migración de BD y Categories).
3. Completar Phase 3 (Generación atómica en backend y frontend).
4. **Validar MVP**: Crear artículos y confirmar formato `CONS-001`, `CONS-002` sin fallas.

### Entrega Incremental
1. MVP listo (US1).
2. Agregar US2 (Búsqueda por Tab/Enter y auto-switch a Modo Edición).
3. Agregar US3 (Modal de búsqueda asistida con lupa).
4. Agregar US4 (Paridad Android Compose).
5. Pulido final y validación con quickstart.md.
