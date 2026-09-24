# Feature Specification: Módulo Integral de Facturación, Clientes Fiscales y Cobranzas

**Feature Branch**: `005-billing-invoicing-management`

**Created**: 2026-09-23

**Status**: Draft

**Input**: User description: "Generar un modulo de facturación que permita registrar los datos fiscales del cliente desde el mismo modulo, siendo los datos mas importantes : RIF, NOMBRE, TELEFONO, DIRECCION, al crear el dato del cliente se debe asociar su id directamente a la factura, la factura debe contener numero, fecha, cliente, tipo de factura (crédito o contado), un estatus (PENDIENTE = Cuando no se ha cobrado la factura aún, PAGADA = cuando ya se proceso el pago total de la misma, ANUL,ADA = cuando se anula por un administrador ) Deben existir tres tablas basicas, factura, itemsfactura, y pagosrecibidos, todos los nombres de tablas en ingles) la factura es la cabecera, los items es el detalle, donde se procedera a factura un items de articulos o productos, la cantidad, el precio (considerando que hay 4 tipos de precio, el usuario debe seleccionar que articulo y tipo de precio va a usar para facturar) , nota: a la tabla articulos toca agregar un atributo que indique si aplica IVA y a su front. Por cada item de la factura se debe registrar el precio sin iva, si aplica iva este se registra el monto del iva en una columna aparte, y el precio subtotal en otra columna que es la suma de preciobase + montoiva, y un columna total que es el subtotal por la cantidad, se debe usar redonde a tres decimales, cada item de la factura va a ir asociado a un medico o entidad colaboradora, ya que cada items tiene un beneficiario de cobro  de esta forma sabremos que articulos o items corresponden a un medico especifico, los cobros pueden ser varios, una factura puede recibir pagos mixtos, por ejemplo una parte en efectivo, otra en tarjeta de debito o credito, otra con cashea, otra con binance y asi sucesivamente. Deber ser capaz de indicar vuelto solo para los pagos en efectivo o cuando el monto total de pagos registrados supere el monto total de la factura. la tabla que recibira los pagos tiene una relacion una a muchas con respecto a la factura, 1 factura muchos pagos y se puede eliminar un pago para agregar otro en caso de error, solo lo puede hacer el administrador o usuario superior, se debe imprimir por pantalla en una modal la factura, la cual se puede enviar por whatsapp o correo o imprimir fisicamente."

---

## Preámbulo y Paridad de Plataformas

De acuerdo con la **Constitución Técnica de Software v2.6.0 (Principio I, Subsección 1.3 y Principio V, Subsecciones 5.1 a 5.4)**, esta especificación es de cumplimiento vinculante e idéntico para las dos aplicaciones cliente del monorepo:
- **Web SPA (`apps/web`)**: Angular 19+ (Diseño médico responsivo, modales enriquecidos, soporte de atajos y vista de impresión)
- **Móvil Nativo (`apps/android`)**: Kotlin / Jetpack Compose (Vistas nativas, diálogos modales Compose, targets táctiles $\ge 48$dp, soporte de compartir vía Intent nativo para WhatsApp y Correo)

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro y Asociación Inmediata de Clientes Fiscales desde Facturación (Priority: P1)

Como cajero o facturador de la clínica,
quiero buscar un cliente existente por su RIF/cédula o registrar un nuevo cliente fiscal (RIF, Nombre/Razón Social, Teléfono y Dirección) directamente desde la pantalla de emisión de factura sin abandonar el flujo,
para asociar su identidad fiscal de forma inmediata a la factura en proceso.

**Why this priority**: La facturación legal exige identificar al receptor fiscal del comprobante. Permitir el registro inline agiliza la atención en caja evitando la pérdida de los artículos ya cargados.

**Independent Test**: Desde la pantalla de facturación, escribir un RIF no registrado, pulsar "Nuevo Cliente Fiscal", completar Nombre, Teléfono y Dirección, confirmar y verificar que el cliente queda guardado en la base de datos y su ID queda preseleccionado en la cabecera de la factura activa tanto en Web como en Android.

**Acceptance Scenarios**:
1. **Given** un operador en el módulo de facturación (Web o Android), **When** ingresa el RIF de un cliente existente, **Then** el sistema autocompleta el Nombre, Teléfono y Dirección del cliente y lo asocia a la factura.
2. **Given** un RIF que no existe previamente en el catálogo, **When** el operador activa el modal/formulario de creación rápida e ingresa RIF, Nombre, Teléfono y Dirección, **Then** el sistema persiste el cliente en la base de datos, lo asigna automáticamente a la factura actual y muestra un mensaje push de confirmación.
3. **Given** el formulario de nuevo cliente, **When** se intenta guardar sin RIF o sin Nombre, **Then** el sistema previene la acción e indica los campos obligatorios requeridos.

---

### User Story 2 - Composición de Detalle de Factura con Selección de Precios, Atributo IVA y Redondeo a 3 Decimales (Priority: P1)

Como facturador o cajero,
quiero agregar productos o artículos al detalle de la factura, seleccionando cuál de los 4 precios disponibles aplicar, especificando la cantidad y asociando cada ítem a un médico o entidad colaboradora beneficiaria,
para que el sistema calcule con exactitud el precio base sin IVA, el monto de IVA correspondiente (según la condición del artículo), el subtotal unitario y el total del renglón con redondeo estricto a 3 decimales.

**Why this priority**: Es el núcleo del cálculo económico y fiscal de la factura médica. Además, la imputación de cada renglón a un médico o entidad colaboradora es obligatoria para la posterior liquidación y reportería de honorarios.

**Independent Test**: Agregar un artículo configurado con "Aplica IVA = SÍ" seleccionando Precio 2 y cantidad 2, y un segundo artículo con "Aplica IVA = NO" con Precio 1 y cantidad 1. Asignar a cada uno un médico o entidad colaboradora distinta. Comprobar que en cada renglón el precio sin IVA, el monto IVA (16%), el subtotal (base + IVA) y el total (subtotal $\times$ cantidad) se calculen con precisión a 3 decimales, actualizando los totales de la cabecera.

**Acceptance Scenarios**:
1. **Given** un artículo seleccionado en el detalle, **When** el usuario escoge uno de los 4 tipos de precio (Precio 1, 2, 3 o 4) y la cantidad deseada, **Then** el sistema toma el valor correspondiente a dicho tipo de precio como base.
2. **Given** un artículo con el atributo "Aplica IVA" activo (`appliesVat = true`), **When** se incorpora a la factura, **Then** el sistema calcula el monto de IVA por separado (`montoIva = precioBase * 0.16`), calcula el precio subtotal unitario (`precioBase + montoIva`), y el total del ítem (`subtotal * cantidad`), redondeando cada resultado a 3 decimales.
3. **Given** un artículo con "Aplica IVA" inactivo (`appliesVat = false`), **When** se incorpora a la factura, **Then** el monto de IVA del renglón se establece en 0.000, resultando el subtotal igual al precio base.
4. **Given** cada ítem añadido a la factura, **When** el usuario selecciona el médico o entidad colaboradora beneficiaria, **Then** el sistema guarda la referencia de la entidad vinculada a dicho ítem particular para la auditoría de honorarios médicos.
5. **Given** el catálogo de artículos (Web y Android), **When** se crea o edita un artículo, **Then** se dispone de un campo explícito (toggle/checkbox) para indicar si aplica IVA o no.

---

### User Story 3 - Cabecera de Factura, Tipos (Crédito/Contado) y Gestión de Estatus (Priority: P1)

Como operador de facturación o supervisor de administración,
quiero emitir facturas asignando automáticamente número correlativo único, fecha de emisión, cliente fiscal y tipo de venta (Crédito o Contado),
para que la factura mantenga un estatus transparente (PENDIENTE, PAGADA o ANULADA) según la evolución de sus cobros y autorizaciones.

**Why this priority**: Define la validez legal y financiera del documento fiscal dentro de la organización.

**Independent Test**: Crear una factura a Contado sin pagos y verificar que su estatus nace en `PENDIENTE`. Registrar pagos hasta cubrir o superar el total y comprobar la transición automática a `PAGADA`. Probar la anulación por parte de un usuario con rol Administrador y verificar que el estatus cambie a `ANULADA` y no admita más cobros.

**Acceptance Scenarios**:
1. **Given** una nueva factura generada, **When** se emite sin cobros o con cobros parciales menores al monto total, **Then** el estatus de la factura permanece en `PENDIENTE` (`PENDING`).
2. **Given** una factura con estatus `PENDIENTE`, **When** la sumatoria de sus pagos registrados iguala o supera el total de la factura, **Then** el sistema transiciona automáticamente su estatus a `PAGADA` (`PAID`).
3. **Given** una factura en cualquier estatus previo, **When** un usuario con rol Administrador/Supervisor ejecuta la acción de anulación y confirma con motivo de anulación, **Then** el estatus cambia irreversiblemente a `ANULADA` (`VOIDED`).
4. **Given** un usuario sin rol de Administrador (ej. Cajero o Médico), **When** intenta anular una factura, **Then** el sistema deniega la acción informando que solo un Administrador posee autorización.

---

### User Story 4 - Registro de Pagos Mixtos, Conciliación y Cálculo de Vuelto (Priority: P1)

Como cajero,
quiero registrar uno o múltiples pagos con diversos métodos (Efectivo, Tarjeta de Débito/Crédito, Cashea, Binance, Transferencia Bancaria, Pago Móvil) contra una misma factura,
para liquidar cobros fraccionados e indicar el vuelto exacto cuando el pago sea en efectivo o cuando la sumatoria de pagos recibidos supere el total de la factura.

**Why this priority**: En el entorno comercial y de salud actual, los clientes utilizan frecuentemente modalidades de pago combinado (ej. una parte en divisa en efectivo y otra por Cashea/tarjeta).

**Independent Test**: En una factura con total de $100.000$, registrar un pago de $40.000$ por Cashea y un segundo pago de $70.000$ en Efectivo. Verificar que el sistema registre ambos pagos, calcule un vuelto de $10.000$, marque la factura como `PAGADA` y registre cada método con su monto y referencia.

**Acceptance Scenarios**:
1. **Given** una factura pendiente, **When** el cajero registra múltiples métodos de pago secuencialmente (relación 1 a muchos), **Then** el sistema almacena cada pago con su método, monto recibido, referencia y fecha/hora.
2. **Given** pagos donde se incluye Efectivo y el monto acumulado supera el total facturado, **When** se procesa la transacción, **Then** el sistema calcula y muestra visualmente en pantalla el vuelto (`montoPagadoTotal - montoFacturaTotal`).
3. **Given** un pago en método electrónico que no sea efectivo (ej. Tarjeta, Cashea, Binance), **When** el monto individual excede el saldo restante, **Then** el sistema advierte que el vuelto en exceso solo aplica sobre transacciones en efectivo.

---

### User Story 5 - Corrección y Eliminación de Pagos Erróneos con Restricción de Privilegio (Priority: P2)

Como administrador o supervisor del sistema,
quiero poder eliminar un pago registrado por error en una factura para permitir ingresar el pago correcto,
garantizando que esta operación esté estrictamente restringida a usuarios con rol superior y quede debidamente auditada.

**Why this priority**: Los cajeros pueden equivocarse al seleccionar el método de pago o tipear un monto. Permitir la rectificación controlada por un supervisor evita el descuadre de caja sin vulnerar la seguridad financiera.

**Independent Test**: Iniciar sesión como Cajero y verificar que la opción de borrar pago esté oculta o deshabilitada. Iniciar sesión como Administrador, pulsar eliminar sobre un pago erróneo en una factura, confirmar la acción, y comprobar que el pago se elimine de la lista de pagos, el estatus de la factura se recalcule (retornando a `PENDIENTE` si ya no cubre el total) y se permita agregar el pago correcto.

**Acceptance Scenarios**:
1. **Given** un usuario autenticado con rol de Administrador o credencial superior, **When** solicita eliminar un pago específico de la factura y confirma en el diálogo de seguridad, **Then** el pago es eliminado, se recalculan los totales pagados y el estatus de la factura se actualiza acordemente.
2. **Given** un usuario con rol de Cajero o inferior, **When** consulta los pagos recibidos, **Then** no tiene disponible el control para eliminar pagos y cualquier intento de forzar la petición es rechazado por el backend con error de autorización.

---

### User Story 6 - Previsualización Modal de Factura, Impresión Física y Envíos (WhatsApp y Correo) (Priority: P2)

Como cajero, administrador o paciente/cliente,
quiero abrir una ventana modal con el diseño formal de la factura emitida que permita imprimirla físicamente en formato térmico o estándar, o compartirla/enviarla por WhatsApp o Correo Electrónico,
para entregar de forma inmediata el comprobante fiscal y comercial al cliente.

**Why this priority**: Es el punto culminante de la experiencia de compra y atención, garantizando que el paciente o empresa aseguradora reciba su soporte en el canal de su preferencia.

**Independent Test**: Abrir la factura desde el listado o al concluir el cobro. Verificar que el modal muestre la cabecera (logo, datos de la clínica, cliente, RIF, número, fecha, tipo), la tabla de ítems con IVA desglosado y médicos beneficiarios, los pagos aplicados y el vuelto. Probar el botón de imprimir (lanza diálogo del navegador/impresora), el botón de WhatsApp (genera enlace `https://wa.me/` o Intent móvil nativo con el resumen y enlace del documento) y el botón de correo electrónico.

**Acceptance Scenarios**:
1. **Given** una factura registrada, **When** el usuario pulsa "Ver / Imprimir Factura", **Then** se abre un modal con el diseño estructurado del comprobante fiscal, formateado para legibilidad en pantalla y listo para impresión.
2. **Given** el modal de factura, **When** el usuario hace clic en "Imprimir", **Then** el sistema activa el flujo de impresión optimizado (CSS `@media print` en Web o impresión nativa en Android).
3. **Given** el modal de factura y un cliente con teléfono válido registrado, **When** el usuario selecciona "Enviar por WhatsApp", **Then** el sistema prepara el mensaje estructurado con el número de factura, cliente, total y enlace de consulta, abriendo WhatsApp Web o la app nativa de WhatsApp.
4. **Given** el modal de factura y un cliente con correo electrónico, **When** el usuario pulsa "Enviar por Correo", **Then** el sistema envía o prepara el despacho del comprobante a la casilla de correo del cliente.

---

## Edge Cases

- **Cobros Mixtos con Múltiples Monedas o Tasas**: Si el sistema maneja montos en divisas y bolívares, los pagos en efectivo en divisa o moneda local deben registrar el equivalente correspondiente con base en la tasa del día para calcular el vuelto exacto.
- **Factura Anulada con Pagos Previos**: Cuando un administrador anula una factura que ya tenía pagos registrados, dichos pagos quedan marcados como inactivos/anulados y no pueden volver a ser procesados.
- **Eliminación del Último Pago en Factura PAGADA**: Al eliminar un pago que ocasiona que el total cobrado caiga por debajo del total facturado, el estatus de la factura debe regresar automáticamente de `PAGADA` a `PENDIENTE`.
- **Rif o Cédula Duplicada en Creación de Cliente**: Si al crear un cliente fiscal el RIF ingresado ya existe en la organización/tenant, el sistema no duplica el registro; ofrece seleccionar el cliente existente e incorporar los datos actualizados.
- **Redondeo y Discrepancias de Centavos/Milésimas**: Todos los cálculos intermedios y de base imponible se procesan con redondeo a 3 decimales (`ROUND_HALF_UP`) para evitar acumulación de errores de truncamiento.
- **Intento de Facturación de Artículo Inactivo**: El selector de artículos solo presenta productos con `isActive = true`. Si un artículo se inactiva posteriormente, las facturas históricas preservan su copia de valores (precios, IVA, nombre) sin alteración.
- **Concurrencia en Numeración de Factura**: La asignación del número correlativo debe ser atómica y aislada por organización (`tenantId`) para impedir duplicación de folios en cajas simultáneas.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE proveer un formulario de creación rápida de clientes fiscales accesible dentro del mismo flujo de facturación, capturando obligatoriamente RIF/Identificación fiscal, Nombre/Razón Social, Teléfono y Dirección.
- **FR-002**: Al crear o seleccionar un cliente fiscal en el módulo de facturación, el sistema DEBE asociar inmediatamente su identificador único (`customerId`) a la factura en preparación.
- **FR-003**: Toda factura DEBE registrar de forma obligatoria: número de factura secuencial único por tenant, fecha de emisión, cliente fiscal asociado, tipo de factura (`CASH` o `CREDIT`) y estatus operativo (`PENDING`, `PAID`, `VOIDED`).
- **FR-004**: Se DEBEN incorporar las tablas relacionales en inglés: `invoices` (cabecera), `invoice_items` (detalle de renglones) y `invoice_payments` (pagos recibidos), vinculadas con integridad referencial y aislamiento multi-tenant.
- **FR-005**: La tabla y modelo de artículos (`Article` / `articles`) DEBE incluir el atributo booleano `appliesVat` (`aplicaIva`, por defecto `false`), y las pantallas de gestión de artículos en Web y Android DEBEN incluir el control de edición correspondiente.
- **FR-006**: En cada ítem de factura (`invoice_items`), el usuario DEBE seleccionar el artículo y cuál de los 4 tipos de precios aplicar (`price1`, `price2`, `price3` o `price4`), especificando la cantidad a facturar.
- **FR-007**: El sistema DEBE calcular y persistir para cada renglón de factura: el precio unitario base sin IVA, el monto de IVA correspondiente (calculado si `appliesVat` es verdadero), el subtotal unitario (`precioBase + montoIva`), y el total del renglón (`subtotal * cantidad`), aplicando redondeo a 3 decimales.
- **FR-008**: Cada renglón de la factura DEBE asociarse de forma obligatoria a un médico o entidad colaboradora beneficiaria (`entityId` / `Entity`), permitiendo identificar con exactitud qué profesional generó cada concepto facturado.
- **FR-009**: La cabecera de la factura DEBE calcular y reflejar la sumatoria total de bases imponibles, total de IVA acumulado y monto total general a pagar.
- **FR-010**: El sistema DEBE permitir el registro de pagos fraccionados o mixtos para una factura (relación 1 factura a muchos pagos), admitiendo métodos como Efectivo (`CASH`), Tarjeta de Débito/Crédito (`CARD`), Cashea (`CASHEA`), Binance (`BINANCE`), Transferencia (`TRANSFER`) u otros métodos bancarios.
- **FR-011**: El sistema DEBE calcular automáticamente el cambio/vuelto (`changeAmount`) cuando el método sea en efectivo o cuando la suma total de pagos supere el total general de la factura.
- **FR-012**: El estatus de la factura DEBE iniciar en `PENDING` si la suma de pagos recibidos es inferior al monto total de la factura, y cambiar automáticamente a `PAID` cuando la suma de pagos iguale o supere el total.
- **FR-013**: La anulación de una factura (`VOIDED`) DEBE estar restringida exclusivamente a usuarios con rol `ROL_ADMIN` o `ROL_SUPERADMIN`.
- **FR-014**: La eliminación de un pago recibido para corrección o ajuste DEBE estar restringida exclusivamente a usuarios con rol `ROL_ADMIN` o `ROL_SUPERADMIN`.
- **FR-015**: El sistema DEBE proveer una visualización modal de la factura emitida que contenga todos los datos fiscales, renglones detallados, desglose de IVA, beneficiarios y pagos aplicados.
- **FR-016**: La modal de factura DEBE incluir acciones directas para: (a) Impresión física formateada, (b) Envío o apertura de chat por WhatsApp con el comprobante, y (c) Envío del comprobante por correo electrónico.
- **FR-017**: Todas las funcionalidades descritas DEBEN cumplir con la cláusula de Paridad de Plataformas de la Constitución v2.6.0, estando completamente operativas tanto en Web Angular 19+ (`apps/web`) como en Android Jetpack Compose (`apps/android`).

---

### Key Entities *(include if feature involves data)*

- **Customer (`customers`)**:
  - `id`: Identificador único UUID.
  - `tenantId`: Referencia a la organización.
  - `taxId` (RIF/Cédula): Identificación fiscal única por tenant.
  - `name`: Nombre fiscal o Razón Social.
  - `phone`: Número de contacto principal.
  - `address`: Dirección fiscal física.
  - `email`: Correo electrónico (opcional para envío digital).
  - `createdAt`, `updatedAt`: Marcas temporales.

- **Invoice (`invoices`)**:
  - `id`: Identificador único UUID.
  - `tenantId`: Referencia a la organización.
  - `invoiceNumber`: Código correlativo único (ej. `INV-000001`).
  - `issueDate`: Fecha y hora de emisión.
  - `customerId`: Clave foránea al cliente fiscal.
  - `type`: Enum `InvoiceType` (`CASH`, `CREDIT`).
  - `status`: Enum `InvoiceStatus` (`PENDING`, `PAID`, `VOIDED`).
  - `subtotal`: Sumatoria de montos base sin IVA (Decimal 14, 3).
  - `vatAmount`: Sumatoria total de impuestos IVA (Decimal 14, 3).
  - `total`: Monto total general facturado (Decimal 14, 3).
  - `notes`: Observaciones adicionales o motivo de anulación.
  - `createdById`: Usuario que emitió la factura.
  - Relaciones: `customer`, `items`, `payments`.

- **InvoiceItem (`invoice_items`)**:
  - `id`: Identificador único UUID.
  - `tenantId`: Referencia a la organización.
  - `invoiceId`: Clave foránea a la cabecera `invoices`.
  - `articleId`: Clave foránea al artículo facturado.
  - `entityId`: Clave foránea al médico o entidad colaboradora beneficiaria.
  - `priceType`: Enum o indicador del precio aplicado (`PRICE_1`, `PRICE_2`, `PRICE_3`, `PRICE_4`).
  - `quantity`: Cantidad facturada (Decimal 10, 3).
  - `basePrice`: Precio unitario base sin IVA (Decimal 14, 3).
  - `vatAmount`: Monto unitario de IVA (Decimal 14, 3).
  - `subtotal`: Precio unitario con IVA incluido (`basePrice + vatAmount`) (Decimal 14, 3).
  - `total`: Subtotal unitario multiplicado por cantidad (Decimal 14, 3).
  - Relaciones: `invoice`, `article`, `entity`.

- **InvoicePayment (`invoice_payments`)**:
  - `id`: Identificador único UUID.
  - `tenantId`: Referencia a la organización.
  - `invoiceId`: Clave foránea a `invoices`.
  - `paymentMethod`: Enum `PaymentMethod` (`CASH`, `CARD`, `CASHEA`, `BINANCE`, `TRANSFER`, `OTHER`).
  - `amount`: Monto abonado o cobrado (Decimal 14, 3).
  - `receivedAmount`: Monto total entregado por el cliente (útil para efectivo) (Decimal 14, 3).
  - `changeAmount`: Vuelto otorgado al cliente (Decimal 14, 3).
  - `reference`: Número de transacción, lote, hash o referencia externa.
  - `paymentDate`: Fecha y hora del cobro.
  - `receivedById`: Usuario que registró el cobro.
  - Relaciones: `invoice`.

- **Article (`articles` - Modificación)**:
  - Adición de columna: `appliesVat`: Booleano (por defecto `false`), indicando si el artículo está gravado con IVA.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los usuarios cajeros pueden completar el proceso completo de emisión de una factura con registro de nuevo cliente fiscal en menos de 90 segundos.
- **SC-002**: El cálculo aritmético de base, IVA desglosado, subtotales y total con redondeo a 3 decimales presenta un margen de error del 0.00% y coincide exactamente entre frontend y backend.
- **SC-003**: El 100% de los renglones facturados quedan vinculados de manera verificable a su respectivo médico o entidad colaboradora en base de datos.
- **SC-004**: Los pagos mixtos y el cálculo de vuelto en efectivo se resuelven en tiempo real sin requerir recálculos manuales por parte del cajero en el 100% de los casos.
- **SC-005**: Los intentos de anulación de factura o borrado de pagos por parte de roles no autorizados son rechazados en el 100% de los casos tanto a nivel de UI como de API (HTTP 403 Forbidden).
- **SC-006**: La previsualización de la factura en modal se renderiza en menos de 1 segundo tras finalizar el guardado, permitiendo imprimir o compartir con un solo clic.
- **SC-007**: Paridad funcional del 100% verificada entre la versión Web Angular y la versión móvil nativa Android en todos los flujos de creación, cobro, anulación y visualización modal.

---

## Assumptions

- La alícuota estándar de IVA aplicable para los artículos gravados (`appliesVat = true`) es del 16% (alícuota fiscal general venezolana), pudiendo parametrizarse a nivel de configuración en el futuro.
- La numeración correlativa de facturas (`invoiceNumber`) es secuencial y formateada automáticamente por la API por cada tenant (ej. `INV-000001`), evitando duplicidad por concurrencia.
- La opción de compartir por WhatsApp en Web utiliza el protocolo web universal (`https://wa.me/<telefono>?text=<resumen_y_enlace>`), mientras que en Android aprovecha el `Intent.ACTION_SEND` nativo del sistema operativo.
- El envío por correo utiliza la plantilla estándar de notificación transaccional configurada en el servidor.
- La moneda principal del sistema se mantiene consistente con el módulo de artículos ya existente, utilizando 3 decimales de precisión en el almacenamiento y visualización financiera.
