# Feature Specification: Registro y Gestión de Artículos, Categorías y Entidades Participantes

**Feature Branch**: `002-article-product-management`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "Se requiere un modulo de registro de articulos o productos, estos son los que se van a facturar en un futuro, de momento debemos crear un modulo que permita registrar el codigo del articulo, el nombre, hasta 4 tipos de precios donde cada tipo es un monto posible de venta, un categoria de articulo, la categoria de articulo se puede agregar directamente en una lista, debe corresponderse con una lista desplegable donde yo pueda buscar entre los existentes o agregar una nueva categoria, no se puede borrar categoria. Por otro lado debe tener la posibilidad de agregar participantes , es decir, un articulo o producto puede tener n cantidad de participantes, donde cada uno de estos se agregan en una tabla llamada entidades, de momento se registra un codigo y un nombre y un estatus. desde el mismo modulo de articulos tendremos la tabla detalle de participantes alli tendremos un boton que abrira un modal y permitira agregar los datos que te comente, pero solo sera para los participantes que no existan, si el participante existe insertamos un registro a la tabla donde cargaremos 1 a muchos los diferentes participantes , en esta vamos a tener una columna donde colocaremos el codigo y se hara la busqueda para traerse los datos registrados, y por ultimo cada fila de participantes, tendra un porcentaje de participacion, donde la suma de participacion nunca sera mayor al 100%."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro y Catálogo de Artículos con Múltiples Precios (Priority: P1)

Como personal administrativo o de facturación de la clínica/organización,
quiero registrar artículos y productos con su código, nombre y hasta 4 opciones de precios de venta desde la Web o desde la aplicación móvil Android,
para disponer de la base de productos y servicios médicos que serán facturados a pacientes y clientes en el sistema.

**Why this priority**: Es el núcleo funcional del catálogo comercial y clínico. Sin la definición del artículo y sus esquemas de precios, no es posible cotizar ni facturar ningún servicio en el futuro. Su desarrollo dual Web-Android es obligatorio según la Constitución v2.5.0 (Principio 1.3).

**Independent Test**: Se puede probar creando un artículo con código único, nombre descriptivo y 4 montos de precios distintos (ej. Precio General, Precio Aseguradora A, Precio Aseguradora B, Precio Preferencial). Se verifica tanto en Web como en Android que el registro se guarde correctamente y se liste en el catálogo con sus precios accesibles.

**Acceptance Scenarios**:
1. **Given** un usuario autenticado con permisos en el módulo de artículos (en Web o Android), **When** ingresa un código único (ej. "CONS-001"), un nombre (ej. "Consulta Medicina General"), un precio base obligatorio (Precio 1) y hasta 3 precios adicionales opcionales (Precios 2, 3 y 4), y selecciona una categoría válida, **Then** el sistema guarda el artículo exitosamente y lo muestra en el listado principal de artículos.
2. **Given** un usuario intentando registrar un artículo, **When** ingresa un código que ya existe dentro de la misma organización/tenant, **Then** el sistema previene el guardado y muestra un mensaje de validación indicando que el código de artículo ya se encuentra registrado.
3. **Given** un formulario de artículo en Web o Android, **When** el usuario ingresa precios con valores negativos o formatos inválidos, **Then** el sistema bloquea la acción indicando que los montos deben ser valores numéricos válidos mayores o iguales a cero.
4. **Given** un usuario en la aplicación móvil Android (`apps/android`), **When** accede a la pantalla de creación de artículo en Jetpack Compose, **Then** dispone de campos accesibles para código, nombre, los 4 precios y selector de categoría con targets táctiles $\ge 48$dp.

---

### User Story 2 - Selección y Creación Rápida de Categorías Inmutables (Priority: P1)

Como usuario del módulo de artículos,
quiero poder seleccionar la categoría del artículo desde una lista desplegable con buscador (o diálogo nativo en Android), y si la categoría no existe, poder crearla inmediatamente en la misma lista sin interrumpir mi flujo,
para clasificar mis productos de forma ágil y asegurar que el catálogo mantenga coherencia sin riesgo de borrado accidental.

**Why this priority**: La categorización es esencial para organizar los artículos y reportes. Permitir crear categorías en línea sin salir de la pantalla ahorra tiempo y evita frustración operativa, garantizando al mismo tiempo la regla de negocio de no eliminación.

**Independent Test**: Al desplegar el selector de categorías, escribir un término para buscar existentes; si no existe, presionar la opción de "Crear [nombre]" y verificar que se guarde, se asigne de inmediato al artículo y no exista ninguna opción de borrado de categorías en toda la interfaz (Web y Android).

**Acceptance Scenarios**:
1. **Given** el formulario de creación/edición de artículo (Web o Android), **When** el usuario abre la lista/selector de categorías y escribe un término de búsqueda, **Then** la lista filtra en tiempo real mostrando solo las categorías coincidentes disponibles en la organización.
2. **Given** el usuario busca una categoría que aún no existe (ej. "Laboratorio Especial"), **When** el término no coincide con ninguna existente y el usuario selecciona la acción integrada de agregar categoría, **Then** el sistema crea la nueva categoría de forma persistente, la selecciona automáticamente en el artículo actual y queda disponible para futuros artículos.
3. **Given** cualquier vista del sistema que liste o administre categorías en Web o Android, **When** un usuario o administrador navega por el sistema, **Then** no existe ninguna acción, botón ni opción que permita eliminar o borrar categorías (las categorías son inmutables en cuanto a eliminación).
4. **Given** la app Android en Compose, **When** el usuario pulsa en crear categoría, **Then** se despliega un diálogo emergente modal nativo (`CategoryDialog`) que valida que el nombre no esté vacío, lo envía al endpoint POST y actualiza el StateFlow de categorías al instante.

---

### User Story 3 - Detalle de Participantes con Búsqueda por Código y Distribución Porcentual (Priority: P1)

Como administrador o facturador,
quiero asociar múltiples participantes (médicos, especialistas o entidades asociadas) al artículo especificando su código y un porcentaje de participación desde Web o Android,
para definir cómo se distribuirá el reconocimiento o liquidación de honorarios cuando el artículo se facture.

**Why this priority**: Los artículos médicos y hospitalarios requieren frecuentemente liquidación de honorarios a uno o varios profesionales o entidades. La regla de control porcentual ($\le 100\%$) es crítica para la salud financiera de la clínica.

**Independent Test**: Crear un artículo, agregar dos participantes existentes mediante la búsqueda por su código, asignarles 40% y 50% de participación respectivamente, comprobar que la suma (90%) es válida y guardar. Luego intentar agregar un tercer participante con 20% (total 110%) y verificar que el sistema impida el guardado tanto en Web como en Android.

**Acceptance Scenarios**:
1. **Given** un artículo en edición con su detalle de participantes (en Web o Android), **When** el usuario agrega una fila e ingresa o busca el código de una entidad existente (ej. "MED-01"), **Then** el sistema autocompleta el nombre de la entidad y su estatus en la fila del detalle.
2. **Given** una tabla/lista de participantes con varias filas asignadas, **When** el usuario define los porcentajes de cada participante de tal manera que la suma acumulada sea menor o igual al 100% (ej. 30%, 30%, 40% = 100%), **Then** el sistema valida satisfactoriamente el formulario y permite guardar el artículo.
3. **Given** una lista de participantes en Web o Android, **When** el usuario ingresa un porcentaje que provoca que la suma total supere el 100% (ej. 70% + 40% = 110%), **Then** el sistema muestra una advertencia visual inmediata del exceso porcentual y deshabilita el botón de guardar hasta corregir la distribución.
4. **Given** el detalle de participantes de un artículo, **When** el usuario intenta agregar la misma entidad participante más de una vez en el mismo artículo, **Then** el sistema impide el duplicado y notifica que la entidad ya fue agregada al detalle.
5. **Given** la app Android en Compose, **When** se modifican los porcentajes de los participantes, **Then** una barra de progreso reactiva y un texto indicador en Compose muestran el porcentaje total asignado y el remanente disponible en tiempo real.

---

### User Story 4 - Registro Inmediato de Nuevas Entidades Participantes mediante Modal (Priority: P2)

Como usuario que se encuentra configurando los participantes de un artículo,
quiero abrir una ventana modal (o diálogo emergente en Android) desde el mismo detalle para registrar una nueva entidad (código, nombre y estatus) si esta no existe previamente en el catálogo,
para no perder el trabajo de configuración del artículo ni tener que abandonar la pantalla.

**Why this priority**: Aporta fluidez y productividad continua. Si un profesional o entidad no estaba registrado previamente en el catálogo central de entidades, el operador puede darlo de alta en el instante exacto en que lo necesita.

**Independent Test**: En la tabla/lista detalle de participantes del artículo, hacer clic en el botón de agregar participante no existente, completar el formulario modal con código "LAB-SUR", nombre "Laboratorio Sur C.A." y estatus "Activo", guardar en el modal y verificar que la entidad se crea en la base de datos y se inserta automáticamente como fila en el detalle del artículo actual (Web y Android).

**Acceptance Scenarios**:
1. **Given** el detalle de participantes en el módulo de artículos (Web o Android), **When** el usuario pulsa en el botón "Nuevo Participante / Entidad no existente", **Then** se despliega una ventana modal / diálogo con los campos obligatorios: Código de Entidad, Nombre de Entidad y Estatus (Activo / Inactivo, por defecto Activo).
2. **Given** la ventana modal / diálogo de nueva entidad abierta, **When** el usuario ingresa un código único y nombre válido y confirma el guardado, **Then** el sistema persiste la nueva entidad en el catálogo de entidades de la organización, cierra el modal e incorpora automáticamente dicha entidad como una nueva fila en los participantes del artículo.
3. **Given** la ventana modal / diálogo de nueva entidad abierta, **When** el usuario ingresa un código de entidad que ya existe en el sistema, **Then** se muestra un error de validación indicando que el código ya pertenece a una entidad registrada y sugiere buscarla directamente en la lista.

---

### User Story 5 - Consulta y Edición del Catálogo de Artículos y sus Participantes (Priority: P2)

Como usuario autorizado,
quiero visualizar el catálogo de artículos existentes con filtros de búsqueda y poder ingresar al detalle de un artículo para consultar o actualizar sus precios, categoría o lista de participantes desde Web o Android,
para mantener la información de productos y convenios al día.

**Why this priority**: Asegura el ciclo de vida completo de los artículos en la operación diaria.

**Independent Test**: Listar artículos filtrando por nombre o categoría, abrir un artículo existente, modificar su Precio 2 y ajustar los porcentajes de sus participantes, guardar y recargar la vista comprobando la persistencia de las modificaciones tanto en Web como en Android.

**Acceptance Scenarios**:
1. **Given** el catálogo de artículos en Web o Android, **When** el usuario busca por código, nombre o filtra por categoría, **Then** el sistema presenta los artículos que cumplen con el criterio.
2. **Given** la vista de edición de un artículo, **When** el usuario elimina una fila de participante o ajusta un porcentaje de participación manteniéndose $\le 100\%$, **Then** los cambios quedan reflejados al guardar.
3. **Given** la aplicación Android (`apps/android`), **When** el usuario navega a la pantalla de catálogo (`ArticlesScreen`), **Then** visualiza una lista optimizada con `LazyColumn`, barra de búsqueda superior, chips de categorías y tarjetas de producto con indicador claro de precios y botón flotante (+) para nuevo artículo.

---

## Edge Cases

- **Suma de participación vacía o en cero**: Si un artículo no tiene participantes asignados o la suma es 0%, el sistema lo permite (la participación de entidades no es forzada para productos simples o insumos sin honorarios asociados).
- **Decimales en porcentajes**: El sistema debe admitir hasta 2 decimales en el porcentaje de participación (ej. 33.33% + 33.33% + 33.34% = 100.00%) evitando errores de redondeo que bloqueen injustificadamente la validación.
- **Entidades inactivas**: Si se intenta seleccionar una entidad existente cuyo estatus sea "Inactivo", el sistema debe advertir al usuario que la entidad se encuentra inactiva antes de permitir su asignación.
- **Múltiples precios no consecutivos**: Un artículo puede tener definido el Precio 1 (obligatorio) y el Precio 3, dejando el Precio 2 o 4 vacíos/en cero. El sistema debe permitir definir de 1 a 4 montos de forma flexible.
- **Concurrencia en creación de categorías**: Si dos usuarios intentan registrar simultáneamente la misma categoría con el mismo nombre en la misma organización, el sistema debe resolverlo de forma idempotente sin duplicar el registro.
- **Visualización en dispositivos móviles (< 640px)**: La tabla de participantes debe adaptarse responsivemente como tarjetas (*cards*) o con contenedor delimitado para evitar overflow horizontal, y el modal debe ocupar la vista de manera ergonómica cumpliendo la Constitución Arquitectónica.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Aislamiento Multi-Tenant)**: Todos los registros creados en este módulo (artículos, categorías, entidades y asignaciones de participantes) DEBEN estar estrictamente aislados por la organización/clínica activa (`tenantId`).
- **FR-002 (Identificación de Artículos)**: El sistema DEBE exigir un código único de artículo por tenant y un nombre descriptivo para cada producto o servicio.
- **FR-003 (Esquema de Precios Cuádruple)**: El sistema DEBE permitir registrar hasta cuatro (4) montos de precios por artículo (Precio 1, Precio 2, Precio 3, Precio 4), donde el Precio 1 es obligatorio y mayor o igual a cero, y los Precios 2, 3 y 4 son opcionales.
- **FR-004 (Categorías Dinámicas con Búsqueda)**: El formulario de artículo DEBE incluir un componente desplegable que permita buscar en tiempo real entre las categorías de artículos existentes del tenant.
- **FR-005 (Creación Inmediata de Categorías)**: El componente desplegable de categorías DEBE permitir al usuario ingresar un nuevo nombre de categoría y registrarlo de manera inmediata y persistente en el catálogo de categorías sin salir del formulario.
- **FR-006 (Inmutabilidad de Categorías)**: El sistema DEBE prohibir la eliminación física o lógica de categorías una vez creadas; no existirá ninguna función ni botón de borrado de categorías.
- **FR-007 (Catálogo Central de Entidades)**: El sistema DEBE mantener un catálogo de entidades (participantes) donde cada entidad cuenta con código único por tenant, nombre y estatus (Activo/Inactivo).
- **FR-008 (Detalle de Participantes en Artículo)**: La vista de artículo DEBE contar con una sección o tabla de detalle para asociar de 0 a $N$ participantes al artículo.
- **FR-009 (Búsqueda e Inserción de Participante Existente)**: En la tabla detalle de participantes, el usuario DEBE poder ingresar o buscar el código de una entidad existente y el sistema autocompletará su nombre y estatus en la fila correspondiente.
- **FR-010 (Modal de Alta de Nueva Entidad)**: En la tabla detalle de participantes, el sistema DEBE proveer un botón que abra una ventana modal para registrar una entidad que no exista previamente (código, nombre y estatus), insertándola automáticamente en la tabla tras su creación.
- **FR-011 (Validación de Duplicidad en Modal)**: Si el usuario intenta registrar en el modal un código de entidad que ya existe, el sistema DEBE rechazar el registro indicando que el código ya se encuentra en uso.
- **FR-012 (Unicidad de Participante por Artículo)**: Una entidad solo puede ser agregada una única vez en la lista de participantes de un mismo artículo.
- **FR-013 (Porcentaje de Participación Individual)**: Cada fila en el detalle de participantes DEBE contener un campo numérico para definir el porcentaje de participación asignado a dicha entidad (mayor a 0% y hasta 100.00%).
- **FR-014 (Límite Máximo Acumulado de Participación)**: La suma total de los porcentajes de participación de todos los participantes de un artículo NUNCA podrá ser superior al 100.00%.
- **FR-015 (Validación y Feedback Visual en Tiempo Real)**: El sistema DEBE calcular y mostrar en tiempo real la suma acumulada de los porcentajes de participación y el porcentaje remanente disponible, bloqueando el guardado si la suma acumulada supera el 100.00%.
- **FR-016 (Gestión de Filas de Participantes)**: El usuario DEBE poder remover una fila de participante del detalle antes o durante la edición del artículo.
- **FR-017 (Auditoría y Trazabilidad de Errores)**: Todo error o excepción originada durante las operaciones de artículos, categorías o entidades DEBE ser persistida en la base de datos de acuerdo con el Principio I (Sección 1.4) de la Constitución.
- **FR-018 (Diseño Mobile-First y Adaptabilidad)**: La interfaz de usuario del catálogo, formulario, tabla de participantes y ventana modal DEBE diseñarse bajo la directiva Mobile-First sin presentar desbordamiento horizontal (`overflow-x`) en pantallas pequeñas (< 640px).
- **FR-019 (Paridad Nativa Android de Catálogo y Formularios)**: La aplicación Android (`apps/android`) DEBE implementar pantallas nativas en Jetpack Compose para el listado, filtrado, creación y edición de artículos respetando los tokens de diseño y los 4 esquemas de precios.
- **FR-020 (Componentes Nativos Android para Categorías y Participantes)**: La aplicación Android DEBE proveer diálogos nativos para alta inmediata de categorías y entidades, junto con la validación reactiva de la suma de porcentajes $\le 100.00\%$ en StateFlow.

---

### Key Entities

- **Tenant (Inquilino / Organización)**: Entidad organizativa a la que pertenecen todos los datos del sistema.
- **ArticleCategory (Categoría de Artículo)**:
  - Atributos: Identificador único, `tenantId`, nombre de categoría, fecha de creación.
  - Regla: No admite borrado. Nombre único por tenant.
- **Article (Artículo / Producto)**:
  - Atributos: Identificador único, `tenantId`, código de artículo (único por tenant), nombre, `categoryId`, precio 1 (base), precio 2, precio 3, precio 4, estatus (activo/inactivo), fechas de auditoría.
  - Relaciones: Pertenece a un Tenant y a una Categoría. Tiene muchos participantes mediante `ArticleParticipant`.
- **Entity (Entidad / Participante Maestro)**:
  - Atributos: Identificador único, `tenantId`, código de entidad (único por tenant), nombre o razón social, estatus (Activo/Inactivo), fechas de auditoría.
  - Relaciones: Puede participar en múltiples artículos a través de `ArticleParticipant`.
- **ArticleParticipant (Detalle de Participación)**:
  - Atributos: Identificador único, `tenantId`, `articleId`, `entityId`, porcentaje de participación (decimal con 2 decimales, ej. 25.50), fechas de auditoría.
  - Reglas: Clave única compuesta `(articleId, entityId)`. Restricción de suma por `articleId` $\le 100.00\%$.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede dar de alta un artículo completo (código, nombre, precios y categoría) en menos de 60 segundos.
- **SC-002**: La creación de una nueva categoría directamente desde el desplegable de artículos se realiza en menos de 2 clics y sin recargar la pantalla.
- **SC-003**: El 100% de los intentos de guardar un artículo con suma de porcentajes superior al 100.00% son bloqueados proactivamente antes de persistir los datos.
- **SC-004**: La búsqueda y vinculación de un participante existente por su código toma menos de 1 segundo en reflejar el nombre y estatus de la entidad.
- **SC-005**: 100% de cumplimiento en pruebas de aislamiento multi-tenant: ninguna organización puede ver o asociar artículos, categorías ni entidades de otra organización.
- **SC-006**: La interfaz es 100% operativa y libre de desbordamientos horizontales en dispositivos móviles (< 640px), tablets y escritorios.

---

## Assumptions

- **Obligatoriedad de Precios**: El "Precio 1" se asume como el precio estándar o precio base de venta y es obligatorio ($\ge 0$). Los "Precios 2, 3 y 4" son opcionales y pueden representar tarifas para aseguradoras, clientes corporativos, personal o convenios específicos.
- **Participantes Opcionales**: No todos los artículos requieren participantes obligatoriamente (por ejemplo, medicamentos o materiales descartables no necesariamente liquidan porcentajes a un profesional). Por ende, un artículo puede tener 0 participantes ($\sum = 0\%$) o tener $N$ participantes siempre que la suma no exceda 100.00%.
- **Estatus por Defecto de Nuevas Entidades**: Al crear una entidad desde el modal, el estatus por defecto sugerido es "Activo".
- **Identificadores de Códigos**: Los códigos de artículo y entidad son cadenas alfanuméricas definidas por el usuario/clínica (ej. "ART-001", "DR-PEREZ-01").
- **Preservación Histórica**: La inmutabilidad de categorías responde a la necesidad de preservar la integridad histórica de reportes contables y facturas futuras.
