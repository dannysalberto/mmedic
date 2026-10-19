# Feature Specification: Numeración Consecutiva por Categoría y Búsqueda de Artículos

**Feature Branch**: `009-article-category-numbering`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "el numero de articulos quiero se corresponda con categoria, es decir cada categoria tendra un consecutivo, por ejemplo consulta seria CONS-001, CONS-002 y asi consecutivamente, Exemes Medicos sera EXAM-001, EXAM-002, para eso la categoria debe tener un campo semilla que es CONS, EXAM, ENTRE OTROS y el campo consecutivo que se debe implementar un bloqueo por tenant para que no se repita y se garantice el valor unico , consecutivo y exacto. Siendo asi, logicamente se debe seleccionar primero la categoria, se asigna el valor semilla y el consecutivo se genera al momento de guardar, adicional se debe agregar la posibilidad de escribir y al dar tab o enter se haga la busqueda y la lupa de busqueda por si deseo buscar un elemento para editar, en el caso de que se agrega una nuevo articulo, si el usuario escribe un consecutivo existente, en ese sentido se activa el modo edición del formulario."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Creación de Artículo con Asignación Automática de Consecutivo por Categoría (Priority: P1)

Como personal administrativo o de facturación de la clínica, deseo seleccionar una categoría al dar de alta un nuevo artículo o producto para que el sistema asigne el código secuencial correspondiente a dicha categoría (ejemplo: `CONS-001`, `EXAM-001`), garantizando que cada categoría mantenga su propia serie numérica exacta, sin huecos ni duplicados entre diferentes usuarios de la misma clínica.

**Why this priority**: Es la funcionalidad central solicitada. Organiza el catálogo médico por tipos de servicio (Consultas, Exámenes, Procedimientos, Laboratorio) y previene colisiones numéricas en entornos de trabajo multiusuario y concurrentes.

**Independent Test**: Puede probarse creando una categoría con prefijo semilla `CONS` y registrando múltiples artículos asociados. Al guardar, cada artículo recibe de forma garantizada el número correlativo estricto (`CONS-001`, `CONS-002`, etc.).

**Acceptance Scenarios**:

1. **Given** que existe la categoría "Consultas" con semilla `CONS` y consecutivo actual `0` en el tenant activo,  
   **When** el usuario entra al formulario de nuevo artículo, selecciona "Consultas", completa los datos requeridos y guarda el artículo,  
   **Then** el sistema asigna y persiste atómicamente el código `CONS-001`, incrementa el contador de la categoría a `1` y confirma la creación exitosa.

2. **Given** dos usuarios en la misma clínica intentando guardar un nuevo artículo en la categoría "Exámenes Médicos" (`EXAM`) de forma concurrente,  
   **When** ambos presionan "Guardar Artículo" casi simultáneamente,  
   **Then** el bloqueo por tenant asegura que una transacción obtenga `EXAM-001` y la subsecuente obtenga `EXAM-002` sin generar error de colisión de clave única ni consecutivos repetidos.

---

### User Story 2 - Detección y Conmutación Automática a Modo Edición al Ingresar un Código Existente (Priority: P2)

Como usuario administrativo que está en el formulario de creación de artículo, deseo poder teclear un código de artículo ya existente (o navegar con `Tab`/`Enter`), para que el formulario busque automáticamente dicho artículo y conmute de inmediato a "Modo Edición", precargando todos sus precios, tarifas, impuestos y porcentajes de participación sin obligarme a salir al catálogo general.

**Why this priority**: Optimiza radicalmente los tiempos de operación en caja y administración clínica, permitiendo consultar o actualizar tarifas de un servicio de forma instantánea simplemente escribiendo su código.

**Independent Test**: Puede probarse ingresando a `/articles/new`, digitando un código existente (ej. `CONS-001`) y presionando `Tab` o `Enter`. El formulario debe cambiar su título a "Editar Artículo o Producto", activar el botón de actualización y poblar todos los campos del artículo.

**Acceptance Scenarios**:

1. **Given** que el usuario se encuentra en el formulario en modo creación y existe el artículo con código `CONS-001`,  
   **When** el usuario escribe `CONS-001` en el campo "Código de Artículo" y pulsa `Tab`, `Enter` o hace clic fuera del campo,  
   **Then** el sistema consulta el artículo en la base de datos de la clínica, puebla todos sus campos (nombre, categoría, tarifas 1-4, IVA, estado, participantes) y cambia la interfaz a Modo Edición.

2. **Given** que el usuario escribe un código inexistente (ej. `CONS-999`) y pulsa `Tab` o `Enter`,  
   **When** el sistema verifica que no existe ningún registro con ese código en el tenant actual,  
   **Then** se mantiene en modo nuevo artículo, permitiendo al usuario continuar con el flujo normal de registro sin bloqueos indeseados.

---

### User Story 3 - Búsqueda Asistida con Botón de Lupa para Selección y Edición (Priority: P3)

Como usuario del catálogo médico, deseo contar con un botón de lupa interactivo junto al campo de código de artículo para desplegar un selector/modal de búsqueda rápida por nombre o código, de modo que pueda ubicar visualmente un producto sin necesidad de memorizar su código exacto y cargarlo en el formulario para editarlo.

**Why this priority**: Facilita la adopción a usuarios nuevos o cuando el catálogo de la clínica contiene cientos de servicios con nomenclaturas similares.

**Independent Test**: Puede probarse haciendo clic en el icono de lupa junto al input de código, filtrando por "Urología" en la ventana emergente y seleccionando el ítem. El formulario debe cargarse con los datos del ítem seleccionado en modo edición.

**Acceptance Scenarios**:

1. **Given** el formulario de artículo,  
   **When** el usuario presiona el botón con el icono de lupa (🔍) adyacente al campo "Código de Artículo",  
   **Then** se abre un diálogo modal de búsqueda rápida de artículos con campo de filtro reactivo y listado paginado/scrolleable.

2. **Given** el modal de búsqueda abierto con resultados filtrados,  
   **When** el usuario hace clic sobre un artículo de la lista,  
   **Then** el modal se cierra, el formulario carga la información completa del artículo elegido y cambia a Modo Edición con la URL sincronizada correspondiente (`/articles/:id/edit`).

---

### User Story 4 - Configuración de Semilla y Serie en la Gestión de Categorías (Priority: P4)

Como administrador de la clínica, deseo que al crear o editar una categoría de artículos se pueda definir obligatoriamente su prefijo semilla (ej. `CONS`, `EXAM`, `LAB`, `RX`) y visualizar su consecutivo actual, asegurando que cada serie responda al estándar de codificación de la institución médica.

**Why this priority**: Proporciona el soporte administrativo necesario para alimentar la semilla y mantener la integridad de las series numéricas del catálogo.

**Independent Test**: Puede probarse creando una categoría "Laboratorio Clínico" con semilla `LAB` desde el panel de categorías y verificando que el primer artículo generado tome `LAB-001`.

**Acceptance Scenarios**:

1. **Given** el formulario o combobox de creación de categoría,  
   **When** el usuario ingresa el nombre "Procedimientos Menores" y la semilla "PROC",  
   **Then** el sistema almacena la semilla en mayúsculas, inicializa el contador correlativo en `0` y valida que la semilla no contenga espacios ni caracteres especiales no permitidos.

---

### Edge Cases

- **Colisión de Semillas en el mismo Tenant**: ¿Qué ocurre si se intenta registrar dos categorías con la misma semilla (ej. dos categorías con `CONS`) en la misma clínica?  
  *El sistema debe validar y rechazar semillas duplicadas dentro del mismo tenant para evitar que dos categorías compartan la misma serie numérica.*
- **Formato y Longitud de la Semilla**: Las semillas deben ser códigos alfanuméricos en mayúsculas de entre 2 y 6 caracteres (ej. `MED`, `CONS`, `LABOR`, `RX`), sin espacios ni guiones, para garantizar legibilidad en el código final `SEMILLA-NNN`.
- **Formato del Número Consecutivo**: El formato numérico estándar es con relleno de ceros a 3 dígitos (`001`, `002`), expandiéndose de forma natural si supera los 999 registros (`1000`, `1001`).
- **Conmutación Involuntaria a Modo Edición**: Si el usuario accidentalmente escribe un código existente pero deseaba crear uno nuevo, la interfaz debe mostrar un indicador claro de "Modo Edición activado para [Código]" con opción rápida de "Limpiar formulario / Volver a modo nuevo".
- **Cambio de Categoría en Modo Edición**: Si un artículo ya fue guardado previamente con el código `CONS-005` y el usuario edita su categoría a "Exámenes Médicos", el código original ya persistido (`CONS-005`) debe preservarse o solicitar confirmación explícita para evitar alterar referencias históricas en facturación.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La entidad Categoría de Artículo (`ArticleCategory`) DEBE incluir un campo obligatorio `seed` (semilla/prefijo de 2 a 6 caracteres alfanuméricos en mayúsculas) y un campo numérico entero `currentSequence` (iniciado en 0).
- **FR-002**: La combinación de `[tenantId, seed]` DEBE ser estrictamente única en la base de datos para prevenir colisiones de prefijo en una misma clínica.
- **FR-003**: En el formulario de nuevo artículo, la selección de la "Categoría del Artículo" DEBE ser el paso que determine la serie del código; mientras no se guarde, el campo de código mostrará el prefijo de la categoría seleccionada o el indicador de correlativo automático (ej: `CONS-???` o el siguiente estimado).
- **FR-004**: Al guardar un nuevo artículo, la generación del código definitivo DEBE ejecutarse dentro de una transacción con bloqueo a nivel de fila (`FOR UPDATE`) sobre la categoría del tenant, garantizando un incremento atómico y un consecutivo estricto sin saltos ni duplicaciones concurrentes.
- **FR-005**: El campo "Código de Artículo" en la interfaz de usuario DEBE admitir entrada manual de texto y disparar la búsqueda de coincidencia exacta por código al presionar la tecla `Tab`, la tecla `Enter` o al dispararse el evento `blur`.
- **FR-006**: Si la búsqueda por código encuentra un artículo existente en el tenant activo, el formulario DEBE conmutar automáticamente a **Modo Edición**, cargar íntegramente los datos del artículo (incluyendo precios 1 a 4 y tabla de participantes) y notificar al usuario mediante un badge visual contextual.
- **FR-007**: El campo de código DEBE incorporar un botón interactivo con icono de lupa (🔍) que abra una ventana modal de búsqueda asistida con filtro predictivo por nombre, código o categoría.
- **FR-008**: Al seleccionar un artículo desde el modal de búsqueda asistida, el modal DEBE cerrarse y el formulario DEBE conmutar de inmediato a Modo Edición con los datos del artículo seleccionado.
- **FR-009**: Las validaciones y reglas de negocio DEBEN aplicarse con estricta paridad tanto en la aplicación Web Angular (`apps/web`) como en la aplicación móvil Android (`apps/android`).
- **FR-010**: Si el usuario está en Modo Edición y desea crear un artículo desde cero, la interfaz DEBE ofrecer una acción accesible ("Nuevo Registro" / "Limpiar") para restablecer el formulario a su estado inicial.

---

### Key Entities *(include if feature involves data)*

- **ArticleCategory**:
  - `id`: Identificador único (UUID).
  - `tenantId`: Identificador del tenant/clínica.
  - `name`: Nombre descriptivo (ej: "Consultas Médicas").
  - `seed`: Prefijo alfanumérico en mayúsculas de la serie (ej: "CONS", "EXAM", "LAB").
  - `currentSequence`: Contador entero del último consecutivo emitido (inicia en 0).
  - `isActive`: Estatus lógico de la categoría.

- **Article**:
  - `id`: Identificador único (UUID).
  - `tenantId`: Identificador del tenant.
  - `code`: Código alfanumérico generado o consultado (ej: `CONS-001`, `EXAM-042`). Único por `[tenantId, code]`.
  - `categoryId`: Relación con la categoría padre.
  - `name`, `price1`, `price2`, `price3`, `price4`, `appliesVat`, `isActive`: Atributos comerciales y fiscales del artículo.
  - `participants`: Relación con participantes y honorarios asignados.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los nuevos artículos guardados bajo una categoría obtienen un código con el formato exacto `[SEMILLA]-[NNN]` correlativo sin duplicidad dentro de su tenant.
- **SC-002**: Cero errores de colisión de clave única (`P2002` o similar) ante peticiones concurrentes de creación de artículos en una misma categoría.
- **SC-003**: La conmutación entre modo nuevo y modo edición al ingresar un código existente mediante `Tab` o `Enter` se completa en menos de 300 milisegundos en condiciones de red estándar.
- **SC-004**: Los usuarios pueden localizar y abrir en modo edición cualquier artículo existente mediante el botón de lupa en menos de 3 clics o interacciones táctiles.
- **SC-005**: Paridad funcional verificada al 100% entre la versión Web (`apps/web`) y la aplicación Android (`apps/android`).

---

## Assumptions

- Las categorías preexistentes en la base de datos recibirán una semilla predeterminada calculada a partir de las primeras 3 o 4 letras de su nombre (ej: "Consultas" → `CONS`, "Procedimientos" → `PROC`) con su secuencia alineada a los artículos existentes.
- Si un usuario ingresa voluntariamente un código nuevo en lugar de usar la generación automática, el sistema validará que cumpla la estructura de la categoría o permitirá la asignación siempre que no viole la unicidad del tenant.
- En dispositivos móviles Android, el botón de lupa estará integrado en el campo de texto (`TrailingIcon`) respetando las guías de diseño de Jetpack Compose y las directivas Mobile-First de la Constitución Técnica.
