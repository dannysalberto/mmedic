# Feature Specification: Módulo de Personal y Colaboradores Técnicos/Profesionales (Gestión, Detección de Duplicados y Paridad Dual)

**Feature Branch**: `006-contributors-management`  
**Created**: 2026-09-23  
**Status**: Draft  
**Input**: User description: "clonar el modulo de entidades para el personal tecnico y profesional que presta servicios en la institución, los datos deben guardarse en una tabla llamada contributors (o colaboradores en ingles) debe ejecutarse desde la opción correspondiente del menu"

---

## Preámbulo y Paridad de Plataformas

De acuerdo con la **Constitución v2.6.0 (Principio I, Subsección 1.3 y Principio V, Subsección 5.4)**, esta especificación aplica de forma vinculante e idéntica a ambas aplicaciones del monorepo:
- **Web SPA (`apps/web`)**: Angular 19+
- **Móvil Nativo (`apps/android`)**: Kotlin / Jetpack Compose

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegación y Listado de Personal y Colaboradores (Priority: P1)

Como usuario administrativo o coordinador médico, quiero acceder a la sección de **Personal/Profesionales** desde el menú principal de navegación para visualizar, buscar y auditar todo el personal técnico, asistencial y profesional que presta servicios en la clínica.

**Why this priority**: Es la vista fundamental para consultar la nómina de colaboradores registrados en el sistema, conocer su estado operativo y verificar su actividad.

**Independent Test**: Se puede probar de forma independiente haciendo clic en la opción "Personal/Profesionales" en el menú de navegación (Web o Android), verificando que liste todos los colaboradores existentes con su código, nombre, estado (ACTIVO / INACTIVO) y cantidad de servicios/artículos vinculados.

**Acceptance Scenarios**:
1. **Given** un usuario autenticado en la plataforma, **When** selecciona "Personal/Profesionales" en el menú de navegación, **Then** el sistema presenta la lista de colaboradores con columnas/campos: Código, Nombre, Estado, Participaciones Asociadas y Acciones.
2. **Given** el listado de colaboradores cargado, **When** el usuario ingresa un término en el campo de búsqueda por nombre o código, **Then** el sistema filtra en tiempo real los colaboradores que coincidan con el criterio.
3. **Given** el listado de colaboradores, **When** el usuario selecciona un filtro por estado ("Todos", "Activos", "Inactivos"), **Then** el sistema presenta únicamente los colaboradores que cumplan con dicho estado.

---

### User Story 2 - Registro y Edición de Colaboradores con Notificaciones Push y Retención de Navegación (Priority: P1)

Como usuario de administración, quiero registrar nuevos miembros del personal técnico o profesional y actualizar sus datos existentes, recibiendo retroalimentación visual no intrusiva mediante notificaciones flotantes (push toasts/banners) y preservando mi posición de trabajo al editar.

**Why this priority**: Permite mantener el catálogo de profesionales y técnicos actualizado (corregir nombres, actualizar códigos de colegiatura o activar/desactivar personal) de forma ágil y conforme a los lineamientos de experiencia de usuario de la Constitución v2.6.0.

**Independent Test**: Crear un colaborador desde el botón "+ Nuevo Colaborador" (comprobando notificación de éxito y redirección a la lista) y editar uno existente (comprobando notificación de éxito y **retención en la pantalla de edición sin auto-navegar al listado**).

**Acceptance Scenarios**:
1. **Given** el formulario de creación de nuevo colaborador, **When** el usuario ingresa un código único y nombre válido y presiona "Crear Colaborador", **Then** el sistema almacena el registro en la tabla `contributors`, emite una notificación flotante de éxito y redirige a la lista de colaboradores.
2. **Given** el formulario de edición de un colaborador existente, **When** el usuario modifica su nombre o estado y presiona "Guardar Cambios", **Then** el sistema guarda los cambios en base de datos, emite una notificación flotante de éxito y **permanece en la pantalla actual** preservando el contexto del usuario.
3. **Given** el formulario de creación o edición, **When** se intenta guardar un colaborador con un código que ya existe dentro de la misma institución (tenant), **Then** el sistema bloquea el guardado, emite una notificación flotante de error y resalta el campo del código.

---

### User Story 3 - Borrado Seguro de Colaboradores (Safe Deletion Rule) (Priority: P2)

Como administrador del sistema, quiero eliminar registros de colaboradores ingresados por equivocación, asegurando que el sistema impida borrar aquellos que tengan servicios, artículos o atenciones vinculadas para proteger la integridad histórica y contable de la institución.

**Why this priority**: Evita la pérdida o huérfanos en liquidaciones de honorarios, comisiones y registros médicos vinculados a profesionales.

**Independent Test**: Probar la eliminación de un colaborador sin asociaciones (se borra exitosamente con notificación de confirmación) frente a un colaborador con participaciones o artículos asociados (el sistema rechaza la eliminación y muestra un mensaje explicativo).

**Acceptance Scenarios**:
1. **Given** un colaborador con `0` vínculos o participaciones activas, **When** el usuario hace clic en "Eliminar" y confirma la acción en el diálogo de confirmación, **Then** el registro se elimina de la base de datos y se muestra una notificación flotante de éxito.
2. **Given** un colaborador que cuenta con vínculos o participaciones registradas, **When** el usuario intenta eliminarlo, **Then** el sistema deshabilita o rechaza la acción mostrando una notificación explicativa indicando que no puede eliminarse mientras tenga registros asociados y recomendando marcarlo como INACTIVO.

---

### User Story 4 - Detección y Fusión de Colaboradores Duplicados (Priority: P2)

Como auditor o supervisor administrativo, quiero que el sistema detecte automáticamente registros de colaboradores potencialmente duplicados (por variaciones ortográficas, títulos o dobles ingresos de personal) y permita consolidarlos en un único perfil maestro.

**Why this priority**: Resuelve la inconsistencia y duplicación generada por diferentes usuarios al dar de alta al mismo profesional o técnico con variaciones en su nombre o código.

**Independent Test**: Dar de alta dos colaboradores con nombres semejantes (ej. "Dr. Manuel Santos" y "Manuel Santos"), ingresar a la pestaña "Detección de Duplicados", verificar que el sistema los sugiera como duplicados (coincidencia $\ge 80\%$) y realizar la fusión hacia el perfil principal.

**Acceptance Scenarios**:
1. **Given** el módulo de Personal y Colaboradores, **When** el usuario accede a la vista/pestaña "Detección de Duplicados", **Then** el sistema evalúa los nombres normalizados (omitiendo mayúsculas, tildes y prefijos comunes como Dr./Lic./Tec.) y muestra los grupos de posibles duplicados con su porcentaje de coincidencia.
2. **Given** un grupo de colaboradores sugeridos como duplicados, **When** el usuario designa al colaborador principal (*master*) y confirma la acción "Consolidar / Fusionar", **Then** el sistema reasigna atómicamente los vínculos del colaborador secundario al principal, elimina el registro redundante y emite una notificación flotante de éxito.

---

## Edge Cases

- **Colaborador con código modificado teniendo registros asociados**: Al actualizar el código de un colaborador existente, todas las relaciones basadas en su identificador único (UUID) deben permanecer intactas.
- **Fusión de colaboradores que comparten el mismo registro o servicio**: Durante la consolidación, si ambos colaboradores estaban vinculados al mismo artículo o servicio, el sistema debe consolidar sus porcentajes de participación asegurando que el total consolidado no sobrepase el 100.00%.
- **Concurrencia en eliminación y asignación**: Si un usuario intenta eliminar un colaborador en el mismo instante en que otro lo asocia a un nuevo servicio, la transacción de base de datos debe abortar la eliminación de manera segura y notificar el motivo.
- **Nombres con caracteres especiales o titulaciones médicas**: El algoritmo de normalización para duplicados debe procesar correctamente prefijos habituales ("Dr.", "Dra.", "Lic.", "Téc.", "Esp.") y caracteres con tilde para una detección precisa.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE enlazar la opción "Personal/Profesionales" del menú principal de navegación (en Web SPA y móvil Android) al nuevo módulo de gestión de colaboradores (`/contributors`).
- **FR-002**: El sistema DEBE almacenar los datos del personal técnico y profesional en una tabla de base de datos dedicada denominada `contributors`, con soporte Multi-Tenant estricto (`tenantId`).
- **FR-003**: El sistema DEBE permitir listar todos los colaboradores de la institución con capacidades de búsqueda reactiva por código o nombre, filtrado por estado (Todos, Activos, Inactivos) y paginación estructurada.
- **FR-004**: El sistema DEBE permitir registrar nuevos colaboradores requiriendo un código único por organización (`tenantId`), nombre completo y estado operativo (ACTIVO por defecto).
- **FR-005**: Al guardar la creación de un nuevo colaborador, el sistema DEBE emitir una notificación push flotante de éxito y redirigir al usuario al listado general de colaboradores.
- **FR-006**: Al guardar la edición de un colaborador existente, el sistema DEBE emitir una notificación push flotante de éxito y **permanecer en la pantalla de edición** preservando el contexto, en estricto cumplimiento del principio de no-redirección de la Constitución v2.6.0.
- **FR-007**: El sistema DEBE aplicar la Regla de Borrado Seguro (*Safe Deletion*): impedir la eliminación física de cualquier colaborador que tenga registros o participaciones vinculadas, informando la imposibilidad y sugiriendo cambiar su estado a INACTIVO.
- **FR-008**: El sistema DEBE proveer una funcionalidad de Detección de Duplicados que identifique colaboradores con nombres fonética o textualmente similares (umbral $\ge 80\%$) dentro del mismo tenant.
- **FR-009**: El sistema DEBE permitir la Fusión/Consolidación atómica de colaboradores duplicados, transfiriendo todas las participaciones del colaborador secundario al colaborador maestro y eliminando el duplicado.
- **FR-010**: El sistema DEBE garantizar paridad funcional completa y simultánea en ambas plataformas del monorepo: Web SPA (`apps/web` en Angular) y Móvil Nativo (`apps/android` en Kotlin/Jetpack Compose).
- **FR-011**: Todos los endpoints, servicios y componentes creados DEBEN registrar cualquier error o excepción en la tabla de logs de base de datos con los 7 metadatos requeridos por la Constitución v2.6.0.

### Key Entities *(include if feature involves data)*

- **Contributor (Colaborador / Personal Técnico y Profesional)**: Representa a los profesionales médicos, especialistas, enfermeros y técnicos que brindan servicios en la institución de salud.
  - **Identificadores**: ID único (UUID), Tenant ID (UUID).
  - **Atributos de Negocio**: Código identificador único por tenant (`code`), Nombre completo (`name`), Estado operativo (`status`: ACTIVE, INACTIVE).
  - **Auditoría**: Fecha de creación (`createdAt`), Fecha de última actualización (`updatedAt`).
  - **Relaciones**: Vínculos de participación en artículos, servicios o liquidaciones clínicas.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios pueden acceder a la lista completa de colaboradores desde el menú de navegación en 1 solo clic o toque tanto en Web como en Android.
- **SC-002**: Las búsquedas por nombre o código filtran los resultados en pantalla en menos de 500 milisegundos en listas de hasta 1,000 colaboradores.
- **SC-003**: El 100% de las operaciones de creación, edición y borrado emiten notificaciones push flotantes conformes a los estándares UI de la plataforma.
- **SC-004**: El 100% de las ediciones guardadas mantienen al usuario en la pantalla actual sin redirigir inesperadamente al listado.
- **SC-005**: Cero eliminaciones accidentales de colaboradores con historial: el 100% de los intentos de eliminar colaboradores asociados son bloqueados con mensaje descriptivo.
- **SC-006**: La detección de duplicados es capaz de identificar coincidencias superiores al 80% entre nombres con variaciones de tildes o prefijos en menos de 2 segundos.
- **SC-007**: 100% de paridad funcional entre la aplicación Web Angular y la aplicación móvil Android Jetpack Compose.

---

## Assumptions

- Los datos del personal técnico y profesional son estrictamente privados por organización (`tenantId`) y nunca se comparten entre diferentes clínicas.
- El módulo se clona a partir del patrón arquitectónico probado en el módulo de entidades colaboradoras (`003-collaborating-entities-management`), manteniendo la misma usabilidad, estándares de UI y contratos tipados en `@mmedic/types`.
- La opción existente en el encabezado de navegación ("Personal/Profesionales") que actualmente redirigía de forma provisional a `/articles/new` se actualizará para enlazar a `/contributors`.
- La seguridad y control de acceso reutilizan el modelo RBAC + PBAC vigente en la plataforma para roles administrativos y de auditoría.
