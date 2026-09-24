# Research & Architectural Decisions: Registro y Gestión de Artículos, Categorías y Entidades Participantes

**Feature Branch**: `002-article-product-management`  
**Date**: 2026-09-22  
**Status**: Completed  
**Spec Reference**: [specs/002-article-product-management/spec.md](./spec.md)

---

## 1. Resumen de Investigaciones

Este documento consolida las decisiones arquitectónicas, tecnológicas y de experiencia de usuario requeridas para implementar el módulo de **Artículos y Productos** en MMedic, sentando las bases comerciales para la facturación futura, la gestión de esquemas de precios múltiples, la categorización inmutable y la vinculación de entidades participantes con control porcentual riguroso.

---

## 2. Decisiones Arquitectónicas y Tecnológicas

### Decisión 1: Estructura de Almacenamiento para Esquema de 4 Precios

- **Contexto**: El requerimiento exige "hasta 4 tipos de precios donde cada tipo es un monto posible de venta" por artículo.
- **Alternativas Evaluadas**:
  1. *Tabla relacional separada `article_prices` (1:N)*: Mayor flexibilidad teórica para N precios ilimitados, pero introduce complejidad innecesaria en joins para facturación, overhead de transacciones y queries más lentas.
  2. *Columna JSONB `prices`*: Dificulta validaciones de tipos estrictas a nivel de esquema SQL y operaciones de agregación o indexación de precios.
  3. *Cuatro columnas directas `price1`, `price2`, `price3`, `price4` de tipo `Decimal(12, 2)` en la tabla `articles`*: `price1` obligatorio ($\ge 0$), y `price2`, `price3`, `price4` opcionales (nullable).
- **Decisión**: **Alternativa 3 (Cuatro columnas directas con tipo `Decimal(12, 2)` en `articles`)**.
- **Justificación**:
  - Representa exactamente la regla de negocio solicitada ("hasta 4 tipos de precios").
  - Ofrece máxima velocidad de lectura y escritura en PostgreSQL/Prisma sin sub-consultas ni joins.
  - El uso de `Decimal(12, 2)` garantiza precisión monetaria estricta, evitando errores de punto flotante.
  - Facilita validaciones atómicas inmediatas en DTOs con `@IsNumber()` y `@Min(0)`.

---

### Decisión 2: Inmutabilidad y Persistencia de Categorías de Artículos

- **Contexto**: Las categorías agrupan artículos para reportes y facturación. El requerimiento establece explícitamente: *"no se puede borrar categoria"*.
- **Alternativas Evaluadas**:
  1. *Soft delete con flag `isDeleted`*: Mantiene la opción en API pero oculta registros. Sin embargo, permite confusión y posibles restauraciones no contempladas.
  2. *Inmutabilidad estricta a nivel de API y UI*: No exponer endpoints de eliminación (`DELETE`) y no incluir botones de borrado en ninguna vista. Restricción relacional `onDelete: Restrict` en PostgreSQL.
- **Decisión**: **Alternativa 2 (Inmutabilidad estricta)**.
- **Justificación**:
  - Elimina cualquier superficie de ataque o error operativo que intente borrar categorías.
  - Protege la integridad referencial histórica: si un artículo fue facturado bajo una categoría, dicha categoría jamás podrá ser suprimida de la base de datos.
  - `onDelete: Restrict` en Prisma previene cualquier borrado accidental por base de datos si existen artículos asociados.

---

### Decisión 3: UX y Componente Desplegable de Categorías (Searchable Combobox con Alta en Línea)

- **Contexto**: El usuario debe poder buscar entre categorías existentes o tipear una nueva categoría y crearla directamente desde el mismo desplegable sin salir del formulario.
- **Alternativas Evaluadas**:
  1. *Biblioteca externa pesada de UI (ej. ng-select)*: Añade dependencias externas al monorepo y potenciales conflictos con Angular 19 Signals.
  2. *Componente Standalone personalizado en Angular 19 con Signals y CSS nativo*: Control total de eventos, accesibilidad, filtrado en memoria reactivo y botón integrado `+ Crear "[nombre]"`.
- **Decisión**: **Alternativa 2 (Componente Standalone `CategoryComboboxComponent`)**.
- **Justificación**:
  - Cumple estrictamente el Principio IV (Angular 19 Signals) y las directivas de Vanilla CSS con Design Tokens de la Constitución Técnica.
  - Tamaño compacto (< 150 LOC), cumpliendo la regla de 300 LOC.
  - Proporciona una experiencia de usuario inmediata: al escribir un texto sin coincidencias, aparece la opción de añadirla; al hacer clic, se ejecuta la petición al backend, se actualiza el catálogo reactivo y se asigna el ID al formulario del artículo.

---

### Decisión 4: Modelado de Entidades y Detalle de Participantes con Porcentajes

- **Contexto**: Un artículo puede tener N participantes. Los participantes son entidades (código, nombre, estatus) y cada asignación al artículo tiene un porcentaje de participación cuya suma nunca puede superar el 100%.
- **Alternativas Evaluadas**:
  1. *Guardar participantes como array JSON dentro del artículo*: Incumple normalización relacional, impide auditoría de entidades y bloquea validaciones de clave foránea e integridad referencial.
  2. *Tabla maestra `entities` + Tabla intermedia `article_participants`*:
     - `entities`: `id`, `tenantId`, `code`, `name`, `status`, fechas.
     - `article_participants`: `id`, `tenantId`, `articleId`, `entityId`, `percentage`, fechas.
- **Decisión**: **Alternativa 2 (Modelo Relacional Normalizado)**.
- **Justificación**:
  - Permite reutilizar entidades a lo largo de múltiples artículos y en módulos futuros (liquidación de honorarios, comisiones, pagos a profesionales o convenios).
  - La clave única compuesta `@@unique([articleId, entityId])` garantiza que un mismo participante no se duplique en el mismo artículo.
  - Cumple plenamente con el principio de Multi-Tenancy obligatorio por defecto (`tenantId` con índices dedicados).

---

### Decisión 5: Validación de la Regla de Negocio Porcentual ($\sum \% \le 100.00\%$)

- **Contexto**: "cada fila de participantes, tendra un porcentaje de participacion, donde la suma de participacion nunca sera mayor al 100%".
- **Estrategia de Doble Validación**:
  1. **Frontend (Preventiva / UX reactiva)**:
     - Mediante un `computed()` de Angular Signals, se calcula la suma acumulada de los inputs de porcentaje en tiempo real.
     - Indicador visual:
       - $\sum \% < 100\%$: Barra de progreso / badge informativo con el porcentaje total asignado y el remanente disponible.
       - $\sum \% = 100\%$: Indicador verde ("100% distribuido").
       - $\sum \% > 100\%$: Alerta visual en color de error ("Exceso de distribución: X%") y deshabilitación inmediata del botón "Guardar Artículo".
  2. **Backend (Defensa en Profundidad / Dominio)**:
     - En `ArticlesService`, antes de persistir el artículo y sus participantes en una transacción Prisma, se suma `participants.reduce((acc, p) => acc + p.percentage, 0)`.
     - Si la suma excede 100.00 (tolerancia decimal 0.001), se lanza una `BadRequestException` ("La suma de los porcentajes de participación no puede superar el 100.00%").
     - Se valida además que cada porcentaje individual sea mayor que 0 y menor o igual a 100.

---

### Decisión 6: Flujo Modal para Alta de Entidad No Existente

- **Contexto**: "si el participante no existe... tendremos un boton que abrira un modal y permitira agregar los datos que te comente (codigo, nombre, estatus)".
- **Diseño del Flujo**:
  1. En la tabla de participantes de artículos, se dispone del botón "+ Nueva Entidad".
  2. Se abre un diálogo modal accesible (con trap de foco y cierre con Escape).
  3. Campos: Código (input de texto), Nombre (input de texto) y Estatus (selector: "Activo" o "Inactivo", default "Activo").
  4. Al pulsar "Guardar Entidad":
     - Se valida que el código no exista previamente en el tenant (vía API).
     - Si es válido, se persiste la entidad en la base de datos.
     - El modal se cierra y la nueva entidad se inserta automáticamente como una nueva fila en la tabla de participantes del artículo con foco directo en el campo de porcentaje.

---

### Decisión 7: Arquitectura Mobile-First y Evitación de Overflow Horizontal

- **Contexto**: La Constitución Técnica exige tolerancia cero al desbordamiento horizontal en pantallas móviles (< 640px) y cumplimiento de áreas de toque $\ge 44\times44$px.
- **Implementación**:
  - En pantallas medianas y grandes ($\ge 1024$px): Vista de tabla estructurada con columnas Código, Nombre, Estatus, % Participación y Acciones.
  - En pantallas móviles (< 640px): La tabla muta automáticamente mediante media queries `min-width` a tarjetas individuales apiladas tipo *card*, con inputs fluidos de ancho completo y botón de remover accesible.
  - Modal adaptativo: Ancho 100% en pantallas móviles con padding ergonómico y ancho acotado (`max-width: 480px`) en pantallas de escritorio.

---

## 3. Matriz de Trazabilidad Técnica

| Requisito Spec | Componente API | Modelo BD (Prisma) | Componente UI (Angular) |
|---|---|---|---|
| **FR-001** (Multi-tenant) | `TenantInterceptor` | `tenantId` en todos los modelos | Inyección en cabeceras de sesión |
| **FR-002, FR-003** (Artículo y 4 Precios) | `ArticlesController`, `ArticlesService` | `Article` (`code`, `name`, `price1..4`) | `ArticleFormComponent` |
| **FR-004, FR-005, FR-006** (Categoría Inmutable) | `CategoriesController`, `CategoriesService` | `ArticleCategory` | `CategoryComboboxComponent` |
| **FR-007, FR-010, FR-011** (Entidades y Modal) | `EntitiesController`, `EntitiesService` | `Entity` (`code`, `name`, `status`) | `EntityModalComponent` |
| **FR-008, FR-009, FR-012..16** (Participantes y %) | `ArticlesService` (transacción atómica) | `ArticleParticipant` (`articleId`, `entityId`, `percentage`) | `ParticipantsTableComponent` |
| **FR-017** (Trazabilidad Errores) | `GlobalExceptionFilter` | `SystemErrorLog` | Toaster / Error feedback |
| **FR-018** (Mobile-First) | N/A | N/A | Styles CSS con tokens y media queries `min-width` |
