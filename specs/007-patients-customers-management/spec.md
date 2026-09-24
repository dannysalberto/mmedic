# Feature Specification: Módulo de Gestión de Clientes y Directorio de Pacientes (CRUD Completo y Paridad Dual)

**Feature Branch**: `007-patients-customers-management`  
**Created**: 2026-09-24  
**Status**: Draft  
**Input**: User description: "desarrollar modulo de gestion de datos de clientes (pacientes) y agregarlos en la opción de menu de la imagen , se debe corresponder con un crud completo tal como entidades, colaboradores."

---

## Preámbulo y Paridad de Plataformas

De acuerdo con la **Constitución v2.6.0 (Principio I, Subsección 1.3 y Principio V, Subsección 5.4)**, esta especificación aplica de forma vinculante e idéntica a ambas aplicaciones del monorepo:
- **Web SPA (`apps/web`)**: Angular 19+
- **Móvil Nativo (`apps/android`)**: Kotlin / Jetpack Compose

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegación y Acceso desde "Directorio de Pacientes" en el Menú Principal (Priority: P1)

Como usuario administrativo, recepcionista o personal médico, quiero acceder a la sección de **Directorio de Pacientes** (Gestión de Clientes/Pacientes) desde la opción correspondiente en el menú lateral navegable de la plataforma para consultar, registrar y administrar la ficha de clientes y pacientes.

**Why this priority**: Permite integrar el módulo de Clientes/Pacientes de forma directa e intuitiva en la arquitectura global de navegación del sistema, permitiendo a los usuarios acceder al catálogo principal desde la barra lateral.

**Independent Test**: Se puede probar de forma independiente haciendo clic en la opción "Directorio de Pacientes" dentro del menú lateral (Web o Android), verificando que dirija a la ruta correspondiente y despliegue el módulo completo con el encabezado y listado oficial.

**Acceptance Scenarios**:
1. **Given** un usuario autenticado en la plataforma, **When** selecciona la opción "Directorio de Pacientes" en el menú de navegación lateral, **Then** el sistema presenta el módulo principal de Gestión de Clientes/Pacientes con su barra de herramientas, buscador y tabla de registros.
2. **Given** el usuario navega por las distintas secciones del sistema, **When** consulta el menú lateral, **Then** la opción "Directorio de Pacientes" se mantiene activa e identificable con su ícono y resaltado de ruta actual.

---

### User Story 2 - Consulta, Listado y Búsqueda en Tiempo Real de Clientes / Pacientes (Priority: P1)

Como usuario administrativo o médico, quiero visualizar el catálogo de clientes/pacientes registrados con capacidades de búsqueda en tiempo real por RIF, Cédula, Nombre o Teléfono, para localizar rápidamente la ficha de una persona o empresa.

**Why this priority**: Es la vista primaria requerida para auditar el directorio de clientes/pacientes y verificar su estado e información de contacto antes de emitir comprobantes o registrar antecedentes.

**Independent Test**: Se prueba cargando el listado principal de clientes/pacientes e ingresando términos de búsqueda en la barra (ej: un número de cédula o nombre parcial) y validando que la tabla filtre inmediatamente los resultados coincidentes.

**Acceptance Scenarios**:
1. **Given** el listado principal de clientes/pacientes, **When** la pantalla se carga, **Then** el sistema presenta la lista paginada mostrando: RIF / Cédula, Nombre o Razón Social, Teléfono, Correo Electrónico, Dirección y Acciones (Editar/Eliminar).
2. **Given** el campo de búsqueda de clientes, **When** el usuario escribe un término (RIF, Cédula, Nombre o Teléfono), **Then** el sistema filtra los registros coincidentes en tiempo real.
3. **Given** el listado cargado, **When** no se encuentran registros para el filtro ingresado, **Then** el sistema presenta un mensaje informativo claro ("No se encontraron clientes/pacientes registrados con ese criterio").

---

### User Story 3 - Registro y Edición de Clientes/Pacientes con Retención de Navegación (Priority: P1)

Como usuario administrativo o de recepción, quiero registrar nuevos clientes/pacientes y actualizar los datos fiscales y de contacto de clientes existentes, recibiendo notificaciones flotantes (push toasts) y preservando el contexto al editar.

**Why this priority**: Garantiza la integridad de los datos maestros de clientes/pacientes requeridos para facturación fiscal, historias clínicas y comunicación con el paciente.

**Independent Test**: Crear un nuevo cliente mediante el formulario de alta (verificando mensaje de éxito y retorno a la lista) y editar uno existente (verificando mensaje de éxito y retención en la pantalla de edición sin forzar redirección al listado).

**Acceptance Scenarios**:
1. **Given** el formulario de alta de cliente/paciente, **When** el usuario completa RIF/Cédula, Nombre/Razón Social, Teléfono y Dirección obligatorios y presiona "Guardar", **Then** el sistema almacena el registro en la base de datos, muestra una notificación flotante de éxito y redirige al directorio.
2. **Given** el formulario de edición de un cliente/paciente existente, **When** el usuario modifica datos y presiona "Guardar Cambios", **Then** el sistema actualiza el registro, emite una notificación flotante de éxito y **permanece en la vista de edición** preservando la posición y contexto del usuario.
3. **Given** el formulario de alta o edición, **When** el usuario intenta guardar un RIF/Cédula duplicado para la misma institución (tenant), **Then** el sistema rechaza el guardado, emite una notificación flotante de error y resalta el campo duplicado.

---

### User Story 4 - Eliminación Segura de Clientes/Pacientes (Safe Deletion Rule) (Priority: P2)

Como administrador del sistema, quiero eliminar fichas de clientes/pacientes ingresadas por error, asegurando que el sistema impida borrar aquellos que tengan facturas, comprobantes u operaciones registradas para proteger la integridad contable y legal.

**Why this priority**: Protege la trazabilidad histórica de facturas emitidas, cuentas por cobrar y comprobantes fiscales.

**Independent Test**: Eliminar un cliente sin facturas ni movimientos asociados (el sistema solicita confirmación y lo elimina exitosamente) versus un cliente con facturas emitidas (el sistema bloquea la eliminación y explica el motivo).

**Acceptance Scenarios**:
1. **Given** un cliente/paciente sin facturas ni movimientos asociados, **When** el usuario solicita su eliminación y confirma en el diálogo, **Then** el registro se borra definitivamente y se emite una notificación flotante de éxito.
2. **Given** un cliente/paciente con al menos 1 factura o movimiento registrado, **When** el usuario intenta eliminarlo, **Then** el sistema bloquea la acción, emite una notificación flotante de advertencia y explica que no puede ser eliminado por tener comprobantes vinculados.

---

### Edge Cases

- **RIF / Cédula con caracteres especiales**: El sistema debe normalizar los guiones y prefijos (ej: `V-12345678`, `J-30456789-0`) para evitar duplicidades por formato.
- **Concurrencia en la modificación**: Si dos usuarios editan el mismo cliente simultáneamente, se aplica el guardado del último cambio notificando éxito.
- **Cliente sin correo electrónico**: El correo debe ser un campo opcional sin bloquear el registro.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE proveer un acceso directo en el menú lateral bajo la opción "Directorio de Pacientes" que navegue al módulo completo de gestión de clientes/pacientes.
- **FR-002**: El sistema DEBE permitir visualizar la lista completa de clientes/pacientes registrados en el tenant activo con paginación y ordenamiento por nombre o fecha de registro.
- **FR-003**: El sistema DEBE permitir buscar clientes/pacientes en tiempo real por RIF/Cédula, Nombre o Razón Social y Teléfono.
- **FR-004**: El sistema DEBE permitir registrar nuevos clientes/pacientes especificando obligatoriamente RIF/Cédula Fiscal, Nombre/Razón Social, Teléfono y Dirección Fiscal.
- **FR-005**: El sistema DEBE permitir ingresar el Correo Electrónico como campo opcional.
- **FR-006**: El sistema DEBE validar la unicidad del RIF/Cédula dentro de un mismo tenant e impedir registros duplicados.
- **FR-007**: El sistema DEBE permitir editar la información completa de cualquier cliente/paciente existente.
- **FR-008**: Al guardar los cambios de una edición, el sistema DEBE mantener al usuario en la misma pantalla de edición mostrando una notificación flotante de confirmación.
- **FR-009**: El sistema DEBE permitir eliminar registros de clientes/pacientes únicamente si no poseen comprobantes de facturación o cobro asociados.
- **FR-010**: Si un cliente/paciente tiene facturas o movimientos vinculados, el sistema DEBE denegar su eliminación e informar la razón al usuario.
- **FR-011**: Todas las operaciones de creación, edición y eliminación DEBEN emitir notificaciones flotantes (push toasts) informando el resultado.
- **FR-012**: El módulo DEBE mantener paridad de experiencia y diseño tanto en la Web SPA (Angular 19+) como en la aplicación móvil Android (Kotlin Jetpack Compose).

---

### Key Entities

- **Customer / Patient (Cliente/Paciente)**:
  - `id`: Identificador único UUID.
  - `tenantId`: Identificador de la institución/clínica.
  - `taxId`: RIF o Cédula Fiscal (único por tenant).
  - `name`: Nombre completo o Razón Social.
  - `phone`: Teléfono principal de contacto.
  - `email`: Correo electrónico (opcional).
  - `address`: Dirección fiscal o domiciliaria completa.
  - `createdAt`: Fecha de creación.
  - `updatedAt`: Fecha de última modificación.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios pueden acceder al directorio de clientes desde el menú lateral en 1 solo clic.
- **SC-002**: Las búsquedas de clientes por RIF, cédula o nombre en el catálogo responden en menos de 300 ms.
- **SC-003**: El 100% de las operaciones de guardado y edición muestran retroalimentación visual no intrusiva mediante notificaciones flotantes.
- **SC-004**: El 100% de los intentos de eliminación de clientes con facturas vinculadas son bloqueados previniendo inconsistencias en la base de datos.

---

## Assumptions

- Se reutilizarán los servicios backend del endpoint `/api/v1/customers` para la gestión de datos de clientes/pacientes.
- La interfaz y colores del módulo seguirán la guía de diseño institucional (Dark Precision Medical Theme).
- El término "Clientes" en el ámbito administrativo/fiscal equivale a "Pacientes" en la vista del directorio clínico.
