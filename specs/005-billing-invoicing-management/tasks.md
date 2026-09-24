# Tasks: Módulo Integral de Facturación, Clientes Fiscales y Cobranzas

**Feature Branch**: `005-billing-invoicing-management` | **Spec**: [`spec.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/005-billing-invoicing-management/spec.md) | **Plan**: [`plan.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/005-billing-invoicing-management/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Definición de contratos y modelos en paquetes transversales y base de datos relacional.

- [X] T001 [P] Definir interfaces y DTOs (`Customer`, `CreateCustomerDto`, `UpdateCustomerDto`, `Invoice`, `CreateInvoiceDto`, `VoidInvoiceDto`, `InvoiceItem`, `CreateInvoiceItemDto`, `InvoicePayment`, `CreateInvoicePaymentDto`, `InvoiceWithDetails`, y enums `InvoiceType`, `InvoiceStatus`, `PaymentMethod`, `PriceType`), y agregar `appliesVat?: boolean` a `Article`, `CreateArticleDto` y `UpdateArticleDto` en [`packages/types/src/index.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/packages/types/src/index.ts).
- [X] T002 [P] Actualizar el esquema de Prisma en [`apps/api/prisma/schema.prisma`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/prisma/schema.prisma) agregando modelos `Customer`, `Invoice`, `InvoiceItem`, `InvoicePayment`, enums `InvoiceType` (`CASH`, `CREDIT`), `InvoiceStatus` (`PENDING`, `PAID`, `VOIDED`), `PaymentMethod` (`CASH`, `CARD`, `CASHEA`, `BINANCE`, `TRANSFER`, `OTHER`), `PriceType` (`PRICE_1`, `PRICE_2`, `PRICE_3`, `PRICE_4`), y agregando `appliesVat Boolean @default(false)` a `Article`.
- [X] T003 Generar y ejecutar la migración atómica de base de datos en [`apps/api/prisma/migrations/`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/prisma/migrations/) creando las tablas `customers`, `invoices`, `invoice_items`, `invoice_payments` y modificando `articles`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Habilitación de dependencias cruzadas obligatorias antes de implementar las historias de usuario.

- [X] T004 Actualizar `ArticlesService` y `ArticlesController` en [`apps/api/src/modules/articles/`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/articles/) para soportar persistencia y lectura del atributo `appliesVat: Boolean`.
- [X] T005 [P] Actualizar formulario y listado de artículos en [`apps/web/src/app/components/articles/`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/articles/) incorporando el control toggle/checkbox para `appliesVat`.
- [X] T006 [P] Actualizar diálogo de artículos en [`apps/android/app/src/main/java/com/mmedic/ui/articles/ArticleFormDialog.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/articles/ArticleFormDialog.kt) incorporando el switch/checkbox de `appliesVat`.
- [X] T007 Registrar `CustomersModule` e `InvoicesModule` en [`apps/api/src/app.module.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/app.module.ts).

---

## Phase 3: User Story 1 - Registro y Asociación Inmediata de Clientes Fiscales desde Facturación (Priority: P1)

**Goal**: Permitir al cajero buscar clientes por RIF o registrarlos inline (RIF, Nombre, Teléfono, Dirección) desde el flujo de facturación, asociando inmediatamente su ID a la factura.

**Independent Test**: Desde la pantalla de facturación, buscar por RIF; si no existe, abrir modal de alta rápida, completar datos fiscales obligatorios, guardar y verificar que el cliente queda persistido y seleccionado en la cabecera activa en Web y Android.

- [X] T008 [US1] Crear `CustomersService` en [`apps/api/src/modules/customers/customers.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/customers/customers.service.ts) implementando `findAll`, `findById`, `findByTaxId` y `create` con aislamiento estricto por `tenantId`.
- [X] T009 [US1] Crear `CustomersController` en [`apps/api/src/modules/customers/customers.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/customers/customers.controller.ts) con endpoints `GET /api/v1/customers` y `POST /api/v1/customers` respetando el límite $\le 80$ LOC.
- [X] T010 [P] [US1] Crear `CustomersService` en [`apps/web/src/app/services/customers.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/services/customers.service.ts) usando Angular Signals para búsqueda reactiva por RIF y creación rápida.
- [X] T011 [P] [US1] Crear `CustomerInlineFormComponent` en [`apps/web/src/app/components/invoices/customer-inline-form/customer-inline-form.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/invoices/customer-inline-form/customer-inline-form.component.ts) (.html, .css) con autocompletado de RIF y modal de nuevo cliente fiscal.
- [X] T012 [P] [US1] Crear `CustomersApiService` en [`apps/android/app/src/main/java/com/mmedic/data/api/CustomersApiService.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/data/api/CustomersApiService.kt) y registrar en `ApiClient.kt`.
- [X] T013 [US1] Crear `CustomerQuickDialog.kt` en [`apps/android/app/src/main/java/com/mmedic/ui/invoices/CustomerQuickDialog.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/invoices/CustomerQuickDialog.kt) en Jetpack Compose con validación de campos obligatorios (RIF, Nombre, Teléfono, Dirección) y notificación push.

---

## Phase 4: User Story 2 - Composición de Detalle de Factura con Selección de Precios, Atributo IVA y Redondeo a 3 Decimales (Priority: P1)

**Goal**: Agregar artículos al detalle seleccionando cuál de los 4 precios usar, cantidad, médico/entidad beneficiaria, y cálculo exacto de base sin IVA, monto IVA (16%), subtotal y total con redondeo a 3 decimales (`ROUND_HALF_UP`).

**Independent Test**: Agregar un artículo gravado con IVA y otro exento asignados a médicos diferentes; verificar en tiempo real que precio base, IVA, subtotal y total del renglón cuadren con precisión matemática de 3 decimales tanto en UI como en backend.

- [X] T014 [US2] Implementar utilidad de cálculo aritmético con redondeo estricto a 3 decimales (`ROUND_HALF_UP`) en [`apps/api/src/modules/invoices/invoices-calc.util.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/invoices/invoices-calc.util.ts).
- [X] T015 [P] [US2] Implementar utilidad equivalente de cálculo aritmético a 3 decimales en [`apps/web/src/app/services/invoices-calc.util.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/services/invoices-calc.util.ts).
- [X] T016 [P] [US2] Crear `InvoiceItemsTableComponent` en [`apps/web/src/app/components/invoices/invoice-items-table/invoice-items-table.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/invoices/invoice-items-table/invoice-items-table.component.ts) (.html, .css) con selector de artículo, selección entre 4 precios (`PRICE_1`..`PRICE_4`), cantidad, entidad colaboradora beneficiaria y visualización de totales por renglón.
- [X] T017 [P] [US2] Crear `InvoiceItemsSection.kt` en [`apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoiceItemsSection.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoiceItemsSection.kt) en Jetpack Compose para administración de renglones, cálculo reactivo a 3 decimales e imputación a médico beneficiario.

---

## Phase 5: User Story 3 - Cabecera de Factura, Tipos (Crédito/Contado) y Gestión de Estatus (Priority: P1)

**Goal**: Emitir facturas con correlativo secuencial multi-tenant (`INV-000001`), fecha, tipo (`CASH`/`CREDIT`), ciclo de estatus (`PENDING`, `PAID`, `VOIDED`), y anulación autorizada para administradores.

**Independent Test**: Crear una factura a Contado sin pagos y verificar que su estatus nace en `PENDING`. Anular la factura con usuario Administrador y verificar que pase a `VOIDED` y se bloquee para cobros posteriores.

- [X] T018 [US3] Crear `InvoicesService` en [`apps/api/src/modules/invoices/invoices.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/invoices/invoices.service.ts) con asignación atómica de correlativo `invoiceNumber`, creación de cabecera e ítems, listado paginado con filtros, y método `voidInvoice` restringido a roles administrativos.
- [X] T019 [US3] Crear `InvoicesController` en [`apps/api/src/modules/invoices/invoices.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/invoices/invoices.controller.ts) con endpoints `GET /api/v1/invoices`, `GET /api/v1/invoices/:id`, `POST /api/v1/invoices` y `PATCH /api/v1/invoices/:id/void` respetando el límite $\le 80$ LOC.
- [X] T020 [P] [US3] Crear `InvoicesService` en [`apps/web/src/app/services/invoices.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/services/invoices.service.ts) con Angular Signals para estado de facturas, creación, anulación y filtros.
- [X] T021 [P] [US3] Crear `InvoicesListComponent` en [`apps/web/src/app/components/invoices/invoices-list/invoices-list.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/invoices/invoices-list/invoices-list.component.ts) (.html, .css) con listado, buscador, badges de estatus (`PENDING`, `PAID`, `VOIDED`) y acción de anular con diálogo de confirmación.
- [X] T022 [P] [US3] Crear `InvoicesApiService` en [`apps/android/app/src/main/java/com/mmedic/data/api/InvoicesApiService.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/data/api/InvoicesApiService.kt) y registrar en `ApiClient.kt`.
- [X] T023 [US3] Crear `InvoicesScreen.kt` en [`apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoicesScreen.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoicesScreen.kt) en Jetpack Compose con filtros por estado, listado de comprobantes y FAB para emitir nueva factura.

---

## Phase 6: User Story 4 - Registro de Pagos Mixtos, Conciliación y Cálculo de Vuelto (Priority: P1)

**Goal**: Permitir múltiples cobros mixtos por factura (Efectivo, Tarjeta, Cashea, Binance, Transferencia), calcular vuelto en efectivo cuando se entregue monto superior, y transicionar automáticamente el estatus a `PAID` al cubrir la totalidad.

**Independent Test**: Aplicar un pago de Cashea y un pago en efectivo entregando billete de mayor denominación; comprobar cálculo visual de vuelto, registro de métodos y cambio de estatus de la factura a `PAID`.

- [X] T024 [US4] Implementar procesamiento de cobranzas en [`apps/api/src/modules/invoices/invoices.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/invoices/invoices.service.ts) (`addPayment`) dentro de `$transaction` Prisma, con soporte de métodos múltiples, cálculo de `changeAmount` y actualización automática de estatus a `PAID`.
- [X] T025 [US4] Exponer endpoint `POST /api/v1/invoices/:id/payments` en [`apps/api/src/modules/invoices/invoices.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/invoices/invoices.controller.ts).
- [X] T026 [P] [US4] Crear `InvoicePaymentSectionComponent` en [`apps/web/src/app/components/invoices/invoice-payment-section/invoice-payment-section.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/invoices/invoice-payment-section/invoice-payment-section.component.ts) (.html, .css) para capturar métodos de pago, monto entregado, cálculo reactivo de vuelto y lista de pagos aplicados.
- [X] T027 [P] [US4] Crear `InvoicePaymentSection.kt` en [`apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoicePaymentSection.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoicePaymentSection.kt) en Jetpack Compose para cobros mixtos y cálculo de vuelto en pantalla.

---

## Phase 7: User Story 5 - Corrección y Eliminación de Pagos Erróneos con Restricción de Privilegio (Priority: P2)

**Goal**: Permitir exclusivamente a usuarios con rol `ROL_ADMIN` o `ROL_SUPERADMIN` eliminar un pago erróneo, recalculando el saldo y revirtiendo el estatus de `PAID` a `PENDING` si la sumatoria de pagos desciende del total.

**Independent Test**: Como Cajero verificar que la acción de eliminar esté bloqueada; como Administrador eliminar un pago y verificar reversión automática del estatus a `PENDING` y recálculo del saldo pendiente.

- [X] T028 [US5] Implementar `deletePayment` en [`apps/api/src/modules/invoices/invoices.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/invoices/invoices.service.ts) con recálculo atómico de pagos y reversión de estatus a `PENDING` dentro de `$transaction` Prisma.
- [X] T029 [US5] Exponer endpoint `DELETE /api/v1/invoices/:id/payments/:paymentId` en [`apps/api/src/modules/invoices/invoices.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/invoices/invoices.controller.ts) protegido por `@Roles('ROL_ADMIN', 'ROL_SUPERADMIN')`.
- [X] T030 [P] [US5] Integrar acción de borrado de pagos con diálogo de confirmación y control de rol en [`apps/web/src/app/components/invoices/invoice-payment-section/invoice-payment-section.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/invoices/invoice-payment-section/invoice-payment-section.component.ts).
- [X] T031 [P] [US5] Integrar acción de borrado de pagos con verificación de permisos en [`apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoicePaymentSection.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoicePaymentSection.kt).

---

## Phase 8: User Story 6 - Previsualización Modal de Factura, Impresión Física y Envíos (WhatsApp y Correo) (Priority: P2)

**Goal**: Modal interactivo de comprobante fiscal con impresión física (`@media print` y PrintManager) y despacho digital por WhatsApp y correo electrónico.

**Independent Test**: Abrir modal de factura emitida, comprobar visualmente el desglose de IVA y médicos por ítem; probar impresión física, generación de mensaje de WhatsApp y despacho por correo.

- [X] T032 [US6] Implementar endpoint `POST /api/v1/invoices/:id/send-email` en [`apps/api/src/modules/invoices/invoices.controller.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/invoices/invoices.controller.ts) y [`invoices.service.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/api/src/modules/invoices/invoices.service.ts).
- [X] T033 [P] [US6] Crear `InvoicePreviewModalComponent` en [`apps/web/src/app/components/invoices/invoice-preview-modal/invoice-preview-modal.component.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/invoices/invoice-preview-modal/invoice-preview-modal.component.ts) (.html, .css) con diseño formal de factura médica, soporte `@media print`, enlace dinámico `https://wa.me/` y acción de correo.
- [X] T034 [P] [US6] Crear `InvoicePreviewDialog.kt` en [`apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoicePreviewDialog.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/ui/invoices/InvoicePreviewDialog.kt) en Jetpack Compose con integración a `PrintManager` e `Intent.ACTION_SEND` para WhatsApp y Email.

---

## Phase 9: Polish, Navigation & Cross-Cutting Concerns

**Purpose**: Integración de rutas de navegación, comprobación estricta de compilación y validación cruzada.

- [X] T035 [P] Registrar el ítem de navegación "Facturación" en el Mega Menú de [`apps/web/src/app/components/header/header.component.html`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/components/header/header.component.html) y declarar las rutas `/invoices` y `/invoices/new` en [`apps/web/src/app/app.routes.ts`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/web/src/app/app.routes.ts).
- [X] T036 [P] Registrar la opción de navegación "Facturación" y su destino Compose en [`apps/android/app/src/main/java/com/mmedic/MainActivity.kt`](file:///d:/Projectos/Codigo/Personal/MMedic/apps/android/app/src/main/java/com/mmedic/MainActivity.kt).
- [X] T037 Ejecutar `pnpm build` en la raíz del monorepo garantizando 0 errores de tipado o compilación.
- [X] T038 Ejecutar `.\gradlew.bat compileDebugKotlin` en `apps/android` garantizando compilación limpia de la app móvil.
- [X] T039 Validar la totalidad de escenarios de prueba descritos en [`quickstart.md`](file:///d:/Projectos/Codigo/Personal/MMedic/specs/005-billing-invoicing-management/quickstart.md).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias, arranca de inmediato creando contratos y migraciones.
- **Foundational (Phase 2)**: Depende de Phase 1 completada. Bloquea la implementación de historias de usuario.
- **User Stories (Phases 3 a 8)**:
  - US1 (Clientes) y US2 (Detalle y Cálculos) pueden desarrollarse en paralelo tras Phase 2.
  - US3 (Cabecera y Estatus) consume US1 y US2.
  - US4 (Pagos Mixtos) consume US3.
  - US5 (Borrado de Pagos por Admin) consume US4.
  - US6 (Modal e Impresión) consume US3 y US4.
- **Polish (Phase 9)**: Depende de todas las historias implementadas.

---

## Parallel Opportunities

```bash
# Paralelo en Phase 1: Contratos y Esquema de BD
T001 (packages/types) || T002 (schema.prisma)

# Paralelo en Phase 2: Actualizaciones de Artículos con IVA
T005 (Web articles) || T006 (Android articles)

# Paralelo en User Story 1: Clientes Fiscales
T010 (Web CustomersService) || T011 (Web CustomerInlineForm) || T012 (Android ApiService) || T013 (Android QuickDialog)

# Paralelo en User Story 2: Cálculos e Ítems
T015 (Web calc util) || T016 (Web ItemsTable) || T017 (Android ItemsSection)

# Paralelo en User Story 4: Cobranzas Mixtas
T026 (Web PaymentSection) || T027 (Android PaymentSection)

# Paralelo en User Story 6: Modal e Impresión
T033 (Web Preview Modal) || T034 (Android Preview Dialog)
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2 y 3)
1. Completar Setup y Foundational (Phase 1 y 2).
2. Implementar US1 (Clientes), US2 (Renglones/IVA a 3 decimales) y US3 (Facturas correlativas).
3. **Validación MVP**: Es posible registrar un cliente fiscal y emitir una factura legalmente válida con estatus `PENDING`.

### Incremento 2: Cobranzas Mixtas y Corrección Administrativa (User Stories 4 y 5)
1. Implementar US4 (Pagos fraccionados y vuelto en efectivo, estatus `PAID`).
2. Implementar US5 (Borrado seguro de pagos con rol Administrador y reversión de estatus).

### Incremento 3: Entrega al Cliente y Paridad Final (User Story 6 y Phase 9)
1. Implementar US6 (Modal de previsualización, impresión física y envíos por WhatsApp y Correo).
2. Completar Phase 9 (Navegación en menús, verificación cruzada de compilación `pnpm build` y Gradle).
