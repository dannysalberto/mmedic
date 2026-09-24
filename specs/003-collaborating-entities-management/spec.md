# Feature Specification: Módulo de Entidades Colaboradoras (Gestión y Detección de Duplicados)

**Feature Branch**: `003-collaborating-entities-management`  
**Created**: 2026-09-22  
**Status**: Draft  
**Input**: User description: "necesito desarrollar el modulo de entidades colaboradores, aunque desde el articulo se crean, necesito que se puedan crear y administrar desde la seccion del menu correspondiente, donde se podran listar todos, actualizar datos, borrarlos siempre y cuando no esten asociados a articulos, acá mismo podriamos ver si por error humano algun usuario ha creado el mismo colaborador o entidad con diferentes codigos"

---

## Preámbulo y Paridad de Plataformas

De acuerdo con la **Constitución v2.6.0 (Principio I, Subsección 1.3 y Principio V, Subsección 5.4)**, esta especificación aplica de forma vinculante e idéntica a ambas aplicaciones del monorepo:
- **Web SPA (`apps/web`)**: Angular 19+
- **Móvil Nativo (`apps/android`)**: Kotlin / Jetpack Compose

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegación y Listado de Entidades Colaboradoras (Priority: P1)

Como administrador o usuario de gestión del sistema, quiero acceder al módulo dedicado de **Entidades Colaboradoras** desde el menú principal para listar, buscar y auditar todos los médicos, laboratorios o aliados comerciales registrados.

**Why this priority**: Es la vista base fundamental para visualizar los colaboradores creados (incluso aquellos creados rápidamente desde el formulario de artículos) y conocer la cantidad de artículos en los que participa cada uno.

**Independent Test**: Se puede probar de forma independiente accediendo al nuevo ítem de menú "Entidades Colaboradoras", verificando que liste las entidades existentes con su código, nombre, estado (ACTIVO / INACTIVO) y número de artículos asociados.

**Acceptance Scenarios**:
1. **Given** que el usuario está autenticado en la plataforma, **When** hace clic en "Entidades Colaboradoras" en la navegación (Web o Android), **Then** el sistema muestra la tabla/lista de entidades con columnas: Código, Nombre, Estado, Cantidad de Artículos Asociados y Acciones.
2. **Given** la lista de entidades cargada, **When** el usuario escribe en la barra de búsqueda por código o por nombre, **Then** la lista filtra reactivamente en tiempo real los colaboradores coincidentes.
3. **Given** la lista de entidades, **When** el usuario filtra por estado ("Todos", "Activos", "Inactivos"), **Then** el sistema presenta únicamente los registros con el estado seleccionado.

---

### User Story 2 - Creación y Actualización Directa de Entidades (Priority: P1)

Como usuario administrativo, quiero crear y actualizar la información de entidades colaboradoras directamente desde su módulo dedicado, recibiendo retroalimentación visual no intrusiva (notificaciones push).

**Why this priority**: Permite corregir nombres mal tipeados, cambiar códigos o crear colaboradores sin necesidad de abrir un formulario de artículo.

**Independent Test**: Probar la creación de una nueva entidad desde el botón "+ Nueva Entidad" (notifica y regresa al listado) y la edición de una existente (notifica éxito y permanece en la pantalla de edición sin auto-navegar al índice, cumpliendo la Constitución v2.6.0).

**Acceptance Scenarios**:
1. **Given** el formulario de edición de un colaborador existente, **When** el usuario modifica el nombre o estado y presiona "Guardar Cambios", **Then** el sistema emite un toast/banner push de éxito, guarda los cambios en base de datos y **permanece en la pantalla actual** preservando el contexto.
2. **Given** el formulario de creación de una nueva entidad colaboradora, **When** ingresa un código único y nombre válido y presiona "Crear Entidad", **Then** emite notificación push de éxito y **redirige automáticamente** a la lista de entidades colaboradoras.
3. **Given** que se intenta registrar una entidad con un código ya existente en el tenant, **When** se envía el formulario, **Then** el sistema bloquea el guardado, emite una notificación push de error y resalta el campo duplicado.

---

### User Story 3 - Borrado Seguro de Entidades (Safe Deletion Rule) (Priority: P2)

Como administrador de inventario, quiero eliminar colaboradores creados por error, garantizando que el sistema impida borrar aquellos que tengan artículos asociados para mantener la integridad referencial de comisiones e historial.

**Why this priority**: Previene la corrupción de datos y la pérdida de asociaciones de distribución porcentual en los artículos médicos.

**Independent Test**: Intentar borrar una entidad con 0 artículos (se borra con notificación push de éxito) vs intentar borrar una entidad vinculada a 1 o más artículos (el sistema rechaza la acción con diálogo/toast explicativo).

**Acceptance Scenarios**:
1. **Given** una entidad colaboradora con `0` artículos asociados, **When** el usuario selecciona la opción "Eliminar" y confirma la acción en el modal de confirmación, **Then** la entidad se elimina físicamente de la base de datos y se muestra un toast push de éxito.
2. **Given** una entidad colaboradora asociada a 1 o más artículos (`articlesCount > 0`), **When** el usuario intenta hacer clic en "Eliminar", **Then** el sistema desactiva o bloquea la eliminación, mostrando una notificación explicativa: *"No se puede eliminar la entidad 'Dr. Pérez' porque está vinculada a X artículos. Desasóciela primero o marque su estado como INACTIVA"*.

---

### User Story 4 - Detección y Consolidación de Entidades Duplicadas (Priority: P2)

Como auditor del sistema, quiero que la plataforma detecte automáticamente registros de colaboradores potencialmente duplicados por error humano (mismo médico con diferente código o variaciones ortográficas) para poder consolidarlos o limpiarlos.

**Why this priority**: Evita la dispersión de datos causada por la creación rápida de colaboradores desde distintas pantallas.

**Independent Test**: Registrar dos entidades con nombres similares (ej. "Dr. Juan Perez" y "Juan Perez"), abrir la pestaña/vista "Detección de Duplicados", verificar que el algoritmo las agrupe como candidato a duplicado y permita fusionarlas (reasignando los artículos al principal y removiendo el duplicado).

**Acceptance Scenarios**:
1. **Given** el módulo de Entidades Colaboradoras, **When** el usuario hace clic en la pestaña "Detección de Duplicados", **Then** el sistema ejecuta la comparación por nombre normalizado (ignorando mayúsculas, acentos, prefijos "Dr."/"Dra.") y muestra los pares/grupos sugeridos con coincidencia $\ge 80\%$.
2. **Given** un grupo de entidades duplicadas sugeridas, **When** el usuario selecciona cuál será la entidad principal (*master*) y presiona "Consolidar / Fusionar", **Then** el backend reasigna de manera atómica todas las participaciones en artículos del secundario al principal y elimina el registro redundante, emitiendo una notificación push de éxito.

---

## Edge Cases

- **Entidad con código modificado mientras tiene artículos asociados**: Si se edita el código de una entidad existente, el sistema debe actualizar la entidad sin romper las relaciones en la tabla pivot `ArticleParticipant` (ya que la relación es por `entityId` uuid).
- **Fusión de dos entidades que participan en el MISMO artículo**: Si el secundario y el principal participan en un mismo artículo, al fusionar el sistema debe sumar sus porcentajes para no generar registros duplicados en el mismo artículo, garantizando que el total no supere 100.00%.
- **Eliminación concurrente**: Si dos usuarios intentan eliminar o asociar la misma entidad simultáneamente, las restricciones FK de PostgreSQL y la transacción Prisma garantizan el fallo controlado con registro de log en BD.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE incluir un ítem de navegación "Entidades Colaboradoras" en la interfaz Web (menú desplegable superior) y en la interfaz Android (sección de navegación principal/más).
- **FR-002**: El backend (`apps/api`) DEBE proveer los endpoints REST con aislamiento Multi-Tenant (`tenantId`):
  - `GET /api/v1/entities` (soporta `search`, `status`, paginación e incluye `articlesCount`).
  - `GET /api/v1/entities/:id`
  - `POST /api/v1/entities`
  - `PUT /api/v1/entities/:id`
  - `DELETE /api/v1/entities/:id`
  - `GET /api/v1/entities/duplicates` (algoritmo de coincidencia por similitud de nombre normalizado).
  - `POST /api/v1/entities/merge` (DTO: `primaryEntityId`, `secondaryEntityId`).
- **FR-003**: Regla de Borrado Seguro: `DELETE /api/v1/entities/:id` DEBE verificar en BD que `_count.articleParticipants == 0`. Si es mayor a 0, DEBE lanzar una excepción HTTP 400 Bad Request persistiendo la traza en la tabla de logs de error en BD.
- **FR-004**: Toda operación de guardado, edición, borrado o fusión DEBE emitir una notificación visual push flotante (toast en Web, banner en Android) de acuerdo con la Constitución v2.6.0.
- **FR-005**: Al guardar la edición de una entidad existente, la interfaz DEBE permanecer en la pantalla/modal actual sin auto-redirigir al índice. Redirección automática al índice sólo ocurre al crear una entidad nueva por primera vez.
- **FR-006**: Todos los componentes de código (controladores $\le 80$ LOC, componentes/servicios $\le 300$ LOC) DEBEN cumplir estrictamente las métricas de la Constitución v2.6.0.

---

## Key Artifacts & Contracts

### 1. DTOs en `@mmedic/types`
```typescript
export interface EntityWithStats extends Entity {
  articlesCount: number;
}

export interface DuplicateEntityGroup {
  normalizedName: string;
  entities: EntityWithStats[];
  matchScore: number;
}

export interface MergeEntitiesDto {
  primaryEntityId: string;
  secondaryEntityId: string;
}
```

---

## Verification Plan

### Automated Tests
- `pnpm build`: Validación de tipos TypeScript compartidos y compilación de Angular/NestJS.
- `.\gradlew.bat compileDebugKotlin`: Validación de compilación en Kotlin para Android.

### Manual Verification
- Probar navegación a "Entidades Colaboradoras" en Web y Android.
- Probar creación de nueva entidad -> verificar notificación push y retorno a la lista.
- Probar edición de entidad -> verificar notificación push y **retención en pantalla** (sin auto-redirigir).
- Probar borrado de entidad libre (éxito) vs entidad vinculada a artículos (bloqueo con mensaje explicativo).
- Probar pestaña "Detección de Duplicados" y fusión de colaborador redundante.
