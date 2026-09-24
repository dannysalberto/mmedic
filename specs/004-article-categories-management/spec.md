# Feature Specification: Módulo de Gestión de Categorías Inmutables (Gestión y Detección de Duplicados)

**Feature Branch**: `004-article-categories-management`  
**Created**: 2026-09-22  
**Status**: Draft  
**Input**: User description: "necesito crear el modulo de gestión de categorias inmutables que tendra las mismas posibilidades del modulo de entidades colaboradores"

---

## Preámbulo y Paridad de Plataformas

De acuerdo con la **Constitución v2.6.0 (Principio I, Subsección 1.3 y Principio V, Subsección 5.4)**, esta especificación aplica de forma vinculante e idéntica a ambas aplicaciones del monorepo:
- **Web SPA (`apps/web`)**: Angular 19+
- **Móvil Nativo (`apps/android`)**: Kotlin / Jetpack Compose

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegación y Listado de Categorías de Artículos (Priority: P1)

Como usuario administrativo o gestor de inventario, quiero acceder al módulo dedicado de **Categorías de Artículos** desde el menú principal para listar, buscar y auditar todas las categorías registradas con el conteo de artículos asociados.

**Why this priority**: Es la vista principal para visualizar las categorías existentes (incluso las creadas rápidamente desde comboboxes) y conocer la densidad de productos/servicios asignados a cada una.

**Independent Test**: Probar navegando a "Categorías Inmutables" en el menú Web o Android, verificando que se muestre la lista con Nombre, Cantidad de Artículos (`articlesCount`), Fecha de Creación y Acciones.

**Acceptance Scenarios**:
1. **Given** que el usuario está en la plataforma, **When** abre el módulo "Categorías Inmutables", **Then** el sistema presenta el listado de categorías mostrando su nombre, total de artículos vinculados (`articlesCount`) y botones de acción.
2. **Given** el listado de categorías, **When** el usuario ingresa un término en el buscador, **Then** la lista filtra en tiempo real las categorías cuyo nombre coincida.

---

### User Story 2 - Creación y Edición Directa con Notificaciones Push (Priority: P1)

Como administrador, quiero crear y modificar nombres de categorías directamente desde la vista del módulo con notificaciones flotantes push.

**Why this priority**: Permite corregir errores ortográficos en categorías o registrar clasificaciones maestras sin necesidad de abrir el formulario de artículos.

**Independent Test**: Crear una nueva categoría (notifica éxito y retorna al listado) y editar una categoría existente (notifica éxito y **permanece en la pantalla actual** cumpliendo la Constitución v2.6.0).

**Acceptance Scenarios**:
1. **Given** la pantalla/modal de edición de una categoría existente, **When** el usuario modifica su nombre y presiona "Guardar Cambios", **Then** el sistema emite una notificación push flotante de éxito, guarda los cambios y **permanece en la pantalla actual**.
2. **Given** el formulario de creación de categoría, **When** ingresa un nombre válido y presiona "Crear Categoría", **Then** emite notificación push de éxito y **regresa automáticamente** a la lista de categorías.
3. **Given** un intento de crear o cambiar el nombre a uno ya existente en el tenant, **When** se envía el formulario, **Then** el sistema bloquea la acción y emite una notificación push de error.

---

### User Story 3 - Borrado Seguro de Categorías (Safe Deletion Rule) (Priority: P2)

Como administrador de inventario, quiero eliminar categorías creadas por error, garantizando que el sistema impida borrar aquellas que posean artículos vinculados.

**Why this priority**: Mantiene la integridad referencial del catálogo y evita que queden artículos huérfanos sin categoría asignada.

**Independent Test**: Intentar eliminar una categoría con `0` artículos (se borra exitosamente) vs intentar eliminar una categoría con 1 o más artículos (se bloquea la acción con un mensaje explicativo).

**Acceptance Scenarios**:
1. **Given** una categoría sin artículos asociados (`articlesCount == 0`), **When** el usuario selecciona "Eliminar" y confirma la acción, **Then** la categoría se elimina físicamente y se emite un toast push de éxito.
2. **Given** una categoría asociada a 1 o más artículos (`articlesCount > 0`), **When** el usuario intenta hacer clic en "Eliminar", **Then** la acción se bloquea mostrando una notificación explicativa: *"No se puede eliminar la categoría '[Nombre]' porque está vinculada a X artículos. Reasigne o desasocie los artículos previamente"*.

---

### User Story 4 - Detección y Consolidación de Categorías Duplicadas (Priority: P2)

Como auditor de datos, quiero que el sistema identifique categorías creadas con nombres similares o con variaciones tipográficas (ej. "Consultas Médicas" vs "CONSULTAS MEDICAS") para poder consolidarlas en una sola categoría maestra.

**Why this priority**: Evita la fragmentación del catálogo cuando múltiples usuarios crean categorías al vuelo desde distintos formularios.

**Independent Test**: Crear dos categorías con nombres similares, abrir la pestaña "Detección de Duplicados", verificar la agrupación sugerida y fusionar la categoría secundaria en la principal (reasignando todos los artículos vinculados).

**Acceptance Scenarios**:
1. **Given** la pestaña "Detección de Duplicados" en Categorías, **When** se analiza el catálogo, **Then** el sistema agrupa las categorías candidatas a duplicadas por nombre normalizado (ignorando mayúsculas, minúsculas, tildes y caracteres especiales).
2. **Given** un grupo de categorías duplicadas sugeridas, **When** el usuario elige la categoría principal (*master*) y presiona "Consolidar / Fusionar", **Then** el backend reasigna transaccionalmente todos los artículos de la secundaria a la principal y elimina la categoría redundante, notificando éxito.

---

## Edge Cases

- **Categorías con 0 artículos pero eliminadas simultáneamente**: El backend verifica mediante transacción que la categoría no haya recibido un artículo justo antes de eliminarla.
- **Fusión de categorías masiva**: Al fusionar, los artículos de la categoría secundaria actualizan su `categoryId` a `primaryCategoryId` en una única transacción atómica `$transaction`.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE incluir la sección "Categorías de Artículos" en la navegación Web (mega-menú) y en Android.
- **FR-002**: El backend (`apps/api`) DEBE proveer los endpoints REST con aislamiento Multi-Tenant (`tenantId`):
  - `GET /api/v1/article-categories` (con `articlesCount`).
  - `GET /api/v1/article-categories/:id`
  - `POST /api/v1/article-categories`
  - `PUT /api/v1/article-categories/:id`
  - `DELETE /api/v1/article-categories/:id`
  - `GET /api/v1/article-categories/duplicates`
  - `POST /api/v1/article-categories/merge`
- **FR-003**: Regla de Borrado Seguro: `DELETE /api/v1/article-categories/:id` DEBE validar que `_count.articles == 0`. Si es $>0$, DEBE lanzar una excepción HTTP 400 Bad Request.
- **FR-004**: Toda operación C/U/D/Merge DEBE emitir notificaciones push flotantes (toast en Web, banner en Android) respetando la Constitución v2.6.0.
- **FR-005**: Al guardar la edición de una categoría existente, la interfaz DEBE permanecer en la pantalla/modal actual sin auto-redirigir al índice. Redirección automática sólo al crear una categoría nueva por primera vez.
- **FR-006**: Todos los controladores ($\le 80$ LOC) y clases/componentes ($\le 300$ LOC) DEBEN cumplir las reglas de métricas constitucionales.

---

## Key Artifacts & Contracts

```typescript
export interface CategoryWithStats extends ArticleCategory {
  articlesCount: number;
}

export interface DuplicateCategoryGroup {
  normalizedName: string;
  categories: CategoryWithStats[];
  matchScore: number;
}

export interface MergeCategoriesDto {
  primaryCategoryId: string;
  secondaryCategoryId: string;
}

export interface UpdateCategoryDto {
  name?: string;
}
```

---

## Verification Plan

### Automated Tests
- `pnpm build`: Validación de tipos compartidos y compilación de NestJS y Angular.
- `.\gradlew.bat compileDebugKotlin`: Validación de compilación en Kotlin para Android.

### Manual Verification
- Probar navegación a "Categorías Inmutables" en Web y Android.
- Probar creación de categoría -> notificación push + retorno al listado.
- Probar edición de categoría -> notificación push + **retención en pantalla** (sin auto-redirigir).
- Probar intento de eliminación con artículos (bloqueo) vs libre (éxito).
- Probar pestaña "Detección de Duplicados" y fusión de categorías redundantes.
