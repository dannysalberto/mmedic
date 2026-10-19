# Research: Numeración Consecutiva por Categoría y Búsqueda de Artículos

**Feature**: `009-article-category-numbering`  
**Status**: Completed  
**Date**: 2026-10-19

---

## Decisiones Técnicas y de Diseño

### 1. Mecanismo de Bloqueo Transaccional y Garantía de Consecutivos sin Huecos ni Colisiones

- **Contexto**: Cuando dos usuarios crean un artículo en la misma categoría simultáneamente en una clínica (tenant), ambos no deben recibir el mismo número consecutivo ni saltarse números correlativos.
- **Decisión**: Utilizar una transacción interactiva con Prisma (`prisma.$transaction`) combinada con un incremento atómico y bloqueo pesimista a nivel de fila (`SELECT ... FOR UPDATE` o `update({ where: { id }, data: { currentSequence: { increment: 1 } } })`) sobre la fila de la categoría dentro de PostgreSQL.
- **Rationale**: 
  - Prisma soporta `data: { currentSequence: { increment: 1 } }`, el cual ejecuta un `UPDATE article_categories SET current_sequence = current_sequence + 1 WHERE id = $1 RETURNING ...`. En PostgreSQL, esta sentencia bloquea la fila de la categoría en modo exclusivo a nivel de fila hasta que la transacción se confirma (`COMMIT`), garantizando que la siguiente transacción concurrente espere y lea el valor estrictamente posterior.
  - El código resultante se formatea inmediatamente en memoria como `${category.seed}-${String(updatedCategory.currentSequence).padStart(3, '0')}` (ejemplo: `CONS-001`, `CONS-002`) y se asigna al artículo a insertar dentro de la misma transacción.
- **Alternativas consideradas**:
  - *PostgreSQL Native Sequences (`CREATE SEQUENCE`)*: Requiere crear secuencias dinámicas DDL por cada categoría y tenant. Viola el aislamiento declarativo del esquema de Prisma y dificulta migraciones y tenants dinámicos.
  - *Cálculo de `COUNT(*)` o `MAX(code)` al vuelo*: Es susceptible a condiciones de carrera ("race conditions") bajo concurrencia y no previene colisiones sin bloqueos manuales complejos.

---

### 2. Formato de Semilla y Representación del Consecutivo

- **Contexto**: La semilla debe identificar la categoría y servir de prefijo visualmente claro en facturación y reportes.
- **Decisión**:
  - `seed`: Cadena de 2 a 6 caracteres alfanuméricos, siempre convertida a mayúsculas (`UPPER`), sin espacios ni caracteres especiales (ej. `CONS`, `EXAM`, `LAB`, `RX`).
  - Restricción de unicidad: `@@unique([tenantId, seed])` en Prisma para asegurar que ninguna otra categoría en la misma clínica repita la semilla.
  - `currentSequence`: Entero no negativo (`Int @default(0)`).
  - Formato de código de artículo: `${seed}-${pad(currentSequence, 3)}` para secuencias $\le 999$. Si supera los 3 dígitos (ej: 1000), se expande naturalmente (`CONS-1000`) preservando el orden numérico.
- **Rationale**: Es el estándar de facturación médica hospitalaria. Proporciona orden visual estandarizado.

---

### 3. Búsqueda Rápida en el Formulario y Conmutación Automática a Modo Edición

- **Contexto**: El usuario solicita escribir un código en el input y al pulsar `Tab` o `Enter` (o al hacer clic en una lupa) realizar la búsqueda. Si existe, activar el modo edición.
- **Decisión**:
  - **Endpoint Backend**: Exponer `GET /api/v1/articles/code/:code` con filtro estricto por `tenantId`. Retorna `200 OK` con el artículo completo (precios, categoría, participantes) o `404 Not Found` si no existe.
  - **Comportamiento en Frontend (Angular Web)**:
    - Escuchar eventos `(keydown.enter)`, `(keydown.tab)` y `(blur)` en el campo `articleCode`.
    - Al dispararse, si el código tiene valor, invocar `articlesService.findByCode(code)`.
    - Si existe un registro con ese código:
      - Cargar todos los signals del formulario (`name`, `categoryId`, `price1`...`price4`, `appliesVat`, `isActive`, `participantRows`).
      - Establecer `isEditMode.set(true)` y `articleId.set(foundArticle.id)`.
      - Cambiar el título a "Editar Artículo o Producto" y actualizar el botón a "Actualizar Artículo".
      - Mostrar badge o banner de notificación: "Artículo existente cargado en modo edición".
    - Si no existe: Notificar brevemente que el código está disponible y mantener modo nuevo artículo.
    - Se agrega botón con icono de lupa (🔍) al lado del campo de código para abrir un modal de búsqueda asistida con catálogo paginado.
  - **Comportamiento en Android (Jetpack Compose)**:
    - Campo `OutlinedTextField` con `trailingIcon` que contiene el botón de lupa.
    - `KeyboardActions(onSearch = { ... })` para disparar la búsqueda en teclado móvil.
    - Modal `AlertDialog` / `BottomSheet` de búsqueda asistida.
- **Rationale**: Brinda una experiencia de usuario sumamente fluida y rápida para secretarias y cajeros, sin obligarlos a navegar hacia atrás al catálogo general.

---

### 4. Flujo de Creación con Categoría Primero

- **Contexto**: El usuario indicó que *"lógicamente se debe seleccionar primero la categoría, se asigna el valor semilla y el consecutivo se genera al momento de guardar"*.
- **Decisión**:
  - En la UI, el campo "Categoría del Artículo" se resalta como el selector de serie.
  - Cuando se selecciona una categoría:
    - Si el formulario está en modo nuevo, el campo "Código de Artículo" muestra como placeholder o prefijo: `[SEMILLA]-???` o el consecutivo estimado `[SEMILLA]-${pad(currentSequence + 1, 3)}`.
    - El campo de código puede deshabilitarse para autogeneración o mantenerse editable si el usuario desea forzar un código manual específico.
    - Al presionar "Guardar Artículo", si el código es automático o vacío, el backend genera y asigna atómicamente el número consecutivo oficial.
- **Rationale**: Garantiza que ningún consecutivo se pierda si el usuario abandona el formulario antes de guardar.
