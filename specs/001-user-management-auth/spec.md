# Feature Specification: Administración de Usuarios, Roles, Permisos Especiales y Portal de Autenticación

**Feature Directory**: `specs/001-user-management-auth`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "crear crud de administración de usuarios, con la definicion de roles y permisos, de momento tendremos ROL_SUPERADMIN, ROL_ADMIN, ROL_MEDICO, ROL_CAJERO, ROL_GERENCIA, debe permitir asignarse permisos especiales, estos permisos especiales se definiriran a medida que se necesiten y sera para acciones de crud o de front, donde este crud debe tener una busqueda de usuario + permiso y en caso de existir la combinacion devuelva verdadero y se podra ejecutar una accion por ejemplo activar un boton de anular factura, debemos contar con un login, de acceso , donde se debe crear el usuario superadmin y la clave sera superadmin@123#, la pantalla para version web debera tener un layout dividido en dos, lado izquierdo que abarque un 80 % de la pantalla donde ira el logo distintivo del sistema o empresa donde se instalara y del lado derecho un 20% donde estara el formulario de inicio de sesion,el portal de iniciio debe tener una cabecera o header horizontal donde por ahora va a ir el logo.svg alineado a la izquierda y del lado derecho un menu que contendra una opcion, acerca de, contactanos, quienes somos"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Autenticación de Acceso y Portal de Inicio (Priority: P1)

Como usuario del sistema MMedic (o superadministrador inicial), quiero acceder al portal de inicio de sesión seguro (tanto desde la plataforma Web como desde la aplicación móvil Android) para autenticarme con mis credenciales y acceder a las funciones operativas de la plataforma según mi rol y organización.

**Why this priority**: Es la puerta de entrada indispensable y el mecanismo de seguridad primario de la plataforma; sin autenticación no es posible operar ni identificar al usuario. Cumple con la directiva constitucional de Paridad Web-Android (Principio 1.3).

**Independent Test**: Puede validarse completamente intentando iniciar sesión con el usuario predeterminado `superadmin` y su clave `superadmin@123#`, verificando tanto la interfaz web (layout dividido 80% branding / 20% formulario en escritorio) como la interfaz nativa Android en Jetpack Compose con almacenamiento seguro del token JWT.

**Acceptance Scenarios**:

1. **Given** un usuario no autenticado que ingresa al sistema web, **When** carga la página principal, **Then** visualiza una cabecera horizontal con el logotipo del sistema alineado a la izquierda y un menú a la derecha con los enlaces "Acerca de", "Contáctanos" y "Quiénes somos".
2. **Given** un usuario en pantalla de escritorio web (PC), **When** visualiza la zona de autenticación, **Then** observa un diseño dividido en dos columnas: el 80% izquierdo ocupado por el logotipo distintivo/branding del sistema y el 20% derecho por el formulario de inicio de sesión.
3. **Given** un usuario en dispositivo móvil o pantalla chica web (< 640px), **When** accede a la pantalla de login, **Then** la interfaz se adapta verticalmente mostrando el formulario de forma prominente sin desbordamiento horizontal y con controles táctiles accesibles.
4. **Given** un usuario abriendo la aplicación móvil Android (`apps/android`), **When** accede a la pantalla de inicio de sesión nativa en Jetpack Compose, **Then** visualiza el branding institucional de MMedic, los campos de usuario y contraseña con retroalimentación visual accesible, y el botón de autenticación estilizado con los tokens de diseño de la marca.
5. **Given** las credenciales iniciales de instalación (`superadmin` y `superadmin@123#`), **When** se envían en el formulario web o móvil Android, **Then** el sistema valida la identidad, emite el token JWT, persiste la sesión de forma segura y redirige a la vista principal.
6. **Given** credenciales erróneas o usuario inexistente, **When** se intenta iniciar sesión desde Web o Android, **Then** el sistema muestra un mensaje de error claro de credenciales inválidas sin revelar qué dato específico falló.

---

### User Story 2 - Gestión y Administración de Usuarios con Roles Base (Priority: P2)

Como administrador o superadministrador, quiero registrar, visualizar, actualizar y desactivar cuentas de usuarios asignándoles su rol base principal para controlar su ámbito de responsabilidad clínica o administrativa.

**Why this priority**: Permite a las clínicas y al personal médico gestionar a sus colaboradores y doctores de manera organizada bajo el modelo de roles empresariales.

**Independent Test**: Puede probarse creando un nuevo usuario con rol `ROL_MEDICO`, modificando sus datos y verificando que aparezca listado y clasificado correctamente en el módulo de usuarios.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado en el módulo de usuarios, **When** solicita crear un nuevo usuario, **Then** el sistema le permite ingresar sus datos personales, credenciales y seleccionar uno de los roles base válidos: `ROL_SUPERADMIN`, `ROL_ADMIN`, `ROL_MEDICO`, `ROL_CAJERO`, `ROL_GERENCIA`.
2. **Given** un usuario existente en la lista, **When** el administrador edita su información o cambia su rol base, **Then** los cambios quedan registrados y vigentes para sus próximas interacciones.
3. **Given** un usuario que deja de laborar en la institución, **When** el administrador lo desactiva, **Then** el usuario ya no puede iniciar sesión ni realizar acciones operativas.
4. **Given** un usuario con rol específico de una clínica, **When** consulta la lista de usuarios, **Then** solo visualiza los usuarios correspondientes a su propio inquilino/institución (aislamiento multi-tenant).

---

### User Story 3 - Asignación Dinámica de Permisos Especiales (Priority: P3)

Como administrador del sistema, quiero asignar o revocar permisos especiales atómicos a usuarios individuales más allá de su rol base, para conceder autorizaciones quirúrgicas en acciones operativas o de interfaz según las necesidades del negocio.

**Why this priority**: Proporciona la flexibilidad necesaria para escenarios donde un usuario requiere una atribución excepcional sin necesidad de crear un rol completo nuevo o elevar innecesariamente todos sus privilegios.

**Independent Test**: Puede probarse asignando un permiso especial (por ejemplo, autorización para anulación de comprobantes) a un cajero específico y verificando que dicho permiso quede registrado en el perfil del usuario.

**Acceptance Scenarios**:

1. **Given** un usuario registrado con rol base (ej. `ROL_CAJERO`), **When** el administrador accede a la sección de permisos del usuario, **Then** puede visualizar los permisos especiales disponibles para acciones de CRUD o de interfaz y asignarle uno o varios de ellos.
2. **Given** un usuario con permisos especiales previamente concedidos, **When** el administrador retira un permiso particular, **Then** dicho permiso deja de estar asociado al usuario de inmediato.
3. **Given** la necesidad operativa de un nuevo privilegio en el sistema, **When** se define un nuevo permiso especial en el catálogo, **Then** queda inmediatamente disponible para ser asignado a cualquier usuario que lo requiera.

---

### User Story 4 - Consulta de Verificación Usuario + Permiso para Activación de Acciones (Priority: P4)

Como operador del sistema o componente de interfaz, quiero consultar si un usuario posee un permiso determinado para habilitar o condicionar acciones sensibles (como habilitar el botón de "anular factura").

**Why this priority**: Es el mecanismo funcional que conecta la seguridad con la experiencia de usuario y las reglas de negocio, permitiendo que la interfaz y las acciones se adapten dinámicamente según las capacidades reales del usuario.

**Independent Test**: Puede validarse consultando la combinación `(usuario, permiso)` para una acción restringida; si el usuario tiene el permiso asignado o inherente retorna `verdadero` y habilita la acción; si no lo tiene, retorna `falso` y la acción permanece deshabilitada u oculta.

**Acceptance Scenarios**:

1. **Given** una consulta que recibe un identificador de usuario y un código de permiso, **When** el usuario posee dicho permiso asignado (o inherente por su rol), **Then** la consulta retorna `verdadero` (`true`).
2. **Given** una consulta que recibe un identificador de usuario y un código de permiso que el usuario no tiene concedido, **When** se evalúa la combinación, **Then** la consulta retorna `falso` (`false`).
3. **Given** una pantalla web con un botón de acción crítica (ej. "Anular Factura"), **When** la verificación `usuario + permiso` resulta afirmativa, **Then** el botón se muestra habilitado para su interacción; en caso contrario, se muestra inactivo o no disponible.
4. **Given** una vista o pantalla en la aplicación Android (`apps/android`), **When** se evalúa reactivamente el StateFlow de permisos del usuario autenticado, **Then** los botones y acciones restringidas se habilitan, deshabilitan u ocultan con paridad visual respecto a la plataforma web.

---

### Edge Cases

- **Intento de eliminación o degradación del último Superadministrador**: El sistema debe impedir que el único superadministrador activo se elimine a sí mismo o elimine su propio rol, garantizando que el sistema nunca quede sin administración de máxima jerarquía.
- **Acceso concurrente con permisos recién revocados**: Si a un usuario se le revoca un permiso especial mientras mantiene una sesión activa, cualquier acción subsiguiente que dependa de dicho permiso debe revalidarse y denegarse oportunamente.
- **Visualización responsiva en pantallas intermedias (Tablets)**: En anchos intermedios (entre 640px y 1024px), la proporción 80/20 debe transicionar suavemente a proporciones equilibradas (ej. 60/40 o apilamiento) para asegurar que el formulario de login conserve un ancho mínimo operable y cómodo.
- **Aislamiento Multi-Tenant estricto en la administración de usuarios**: Un administrador de una organización/clínica específica no debe tener la capacidad de consultar, asignar permisos ni listar usuarios de otra organización. Solo el `ROL_SUPERADMIN` tiene visibilidad global de inquilinos.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE contar con una pantalla pública de inicio de sesión con soporte de cabecera superior y formulario de autenticación seguro.
- **FR-002**: La cabecera horizontal del portal DEBE mostrar a la izquierda el logotipo del sistema (`logo.svg`) y a la derecha un menú de opciones con los enlaces informativos: "Acerca de", "Contáctanos" y "Quiénes somos".
- **FR-003**: En la versión de escritorio de la pantalla de inicio de sesión, el diseño DEBE organizarse en un esquema de dos columnas: un 80% del ancho para la identidad visual/logotipo de la institución y un 20% para el formulario de login.
- **FR-004**: En dispositivos móviles y pantallas chicas (< 640px), el diseño DEBE adaptarse bajo enfoque Mobile-First, presentando el formulario de forma vertical, sin desbordamiento horizontal y con áreas de toque accesibles.
- **FR-005**: El sistema DEBE proveer un usuario inicial predefinido con nombre de usuario o correo `superadmin` y contraseña inicial `superadmin@123#` como cuenta raíz de arranque.
- **FR-006**: El sistema DEBE implementar la gestión completa (creación, lectura, actualización y cambio de estado activo/inactivo) de cuentas de usuarios.
- **FR-007**: El sistema DEBE soportar y clasificar a los usuarios en los siguientes roles base:
  - `ROL_SUPERADMIN` (gestión global de la plataforma e inquilinos)
  - `ROL_ADMIN` (gestión administrativa de la clínica/organización)
  - `ROL_MEDICO` (gestión clínica, citas e historias médicas)
  - `ROL_CAJERO` (gestión de pagos, cobros y facturación)
  - `ROL_GERENCIA` (reportes directivos y métricas financieras/operativas)
- **FR-008**: El sistema DEBE permitir la creación y definición incremental de permisos especiales atómicos orientados a operaciones CRUD o visibilidad de interfaz.
- **FR-009**: El sistema DEBE permitir la asignación y desasignación de uno o múltiples permisos especiales a nivel individual de usuario.
- **FR-010**: El sistema DEBE proveer una función o servicio de verificación que acepte una combinación de `(usuario, permiso)` y retorne un valor booleano (`verdadero` o `falso`).
- **FR-011**: Los componentes de interfaz DEBEN poder utilizar el resultado de la verificación de usuario + permiso para activar, desactivar o mostrar condicionalmente controles y botones de acción (ej. botón "Anular Factura").
- **FR-012**: Todas las operaciones y datos de usuarios DEBEN estar aisladas por inquilino (`tenantId`) por defecto, restringiendo la visibilidad inter-clínicas, salvo para la gestión global del `ROL_SUPERADMIN`.
- **FR-013**: Todo error ocurrido en las operaciones de administración de usuarios y autenticación DEBE registrar una traza detallada en la base de datos con archivo de origen, línea, mensaje, descripción, usuario, fecha y tipo de excepción.
- **FR-014**: Toda mutación en las estructuras de base de datos (nuevas tablas, columnas o datos semilla) DEBE ejecutarse mediante migraciones versionadas y reproducibles.
- **FR-015 (Paridad Móvil Android)**: El sistema DEBE proveer en `apps/android` una pantalla de inicio de sesión nativa en Jetpack Compose que consuma el endpoint de login de la API y almacene el token JWT de forma segura.
- **FR-016 (Manejo de Permisos en Android)**: La app Android DEBE evaluar reactivamente los permisos del usuario (`hasPermission`) para habilitar o deshabilitar acciones sensibles en la interfaz móvil con paridad respecto a la Web.

---

### Key Entities

- **Usuario (User)**: Representa a la persona u operador con acceso a la plataforma. Posee nombre, correo/nombre de usuario, clave cifrada, estado (activo/inactivo), rol base principal y pertenencia a un inquilino (`tenantId`).
- **Rol (Role)**: Categoría funcional base que define el perfil general de acceso (`ROL_SUPERADMIN`, `ROL_ADMIN`, `ROL_MEDICO`, `ROL_CAJERO`, `ROL_GERENCIA`).
- **Permiso Especial (SpecialPermission)**: Atribución específica y granular (código semántico y descripción) que autoriza una acción concreta de CRUD o de interfaz (ej. `FACTURA_ANULAR`, `HISTORIA_CLINICA_EXPORTAR`).
- **Asignación de Permiso de Usuario (UserPermissionAssignment)**: Vínculo relacional directo entre un usuario específico y un permiso especial otorgado.
- **Inquilino / Organización (Tenant)**: Entidad que representa a la clínica o centro de salud, garantizando el aislamiento de datos entre instituciones.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede completar el proceso de inicio de sesión exitoso en menos de 5 segundos desde el ingreso de credenciales.
- **SC-002**: La verificación de la combinación `(usuario, permiso)` para habilitación de acciones en pantalla se resuelve y responde de manera inmediata (tiempo de respuesta de interfaz menor a 100 ms).
- **SC-003**: El 100% de las pantallas y componentes del módulo de autenticación y usuarios se renderizan correctamente sin desbordamiento horizontal en viewports móviles (< 640px), tablets (640-1024px) y PCs (> 1024px).
- **SC-004**: Un administrador puede dar de alta a un nuevo usuario, asignarle un rol base y configurarle sus permisos especiales en menos de 1 minuto a través de la interfaz.
- **SC-005**: 100% de aislamiento de datos verificado: ningún usuario u operador puede consultar usuarios o permisos de otra organización diferente a la suya.

---

## Assumptions

- Se asume que el usuario inicial `superadmin` se genera a través de la inicialización y migración semilla del sistema con las credenciales indicadas (`superadmin@123#`).
- Se asume que por seguridad las contraseñas se almacenan mediante algoritmos de derivación unidireccional y salting criptográfico.
- Se asume que los enlaces del menú superior ("Acerca de", "Contáctanos", "Quiénes somos") mostrarán información corporativa inicial o modales descriptivos de la institución donde se despliegue el sistema.
- Se asume que el diseño 80% / 20% aplica para pantallas con viewport de escritorio (ancho $\ge$ 1024px), garantizando que en pantallas menores el formulario de login no se comprima por debajo de 320px de ancho utilizable.
- Se asume que la definición de nuevos permisos especiales podrá ampliarse progresivamente sin alterar la estructura fundamental del esquema relacional.
