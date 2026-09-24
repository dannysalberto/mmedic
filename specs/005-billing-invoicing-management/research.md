# Research & Technical Decisions: Módulo de Facturación, Clientes Fiscales y Cobranzas

## 1. Precisión Numérica y Aritmética con Redondeo a 3 Decimales

### Problema
La facturación clínica y fiscal exige alta precisión al manejar alícuotas impositivas (IVA 16%), precios unitarios de diversas escalas (4 tipos de precio) y cantidades fraccionadas o enteras. Los errores de redondeo de punto flotante de JavaScript pueden generar discrepancias de centavos entre el frontend y el backend o acumulación de errores de truncamiento.

### Decisión
- **Almacenamiento en Base de Datos**: Columnas `Decimal(14, 3)` en PostgreSQL / Prisma para todos los campos monetarios (`basePrice`, `vatAmount`, `subtotal`, `total`, `amount`, `receivedAmount`, `changeAmount`).
- **Aritmética en Backend y Frontend**:
  - Para cada ítem:
    - `precioBase`: Monto seleccionado del tipo de precio (1..4) del artículo.
    - Si `appliesVat = true`: `montoIva = Math.round((precioBase * 0.16) * 1000) / 1000`.
    - Si `appliesVat = false`: `montoIva = 0.000`.
    - `subtotal = Math.round((precioBase + montoIva) * 1000) / 1000`.
    - `totalItem = Math.round((subtotal * cantidad) * 1000) / 1000`.
  - Para la cabecera:
    - `subtotalFactura = sum(item.basePrice * item.cantidad)`.
    - `vatAmountFactura = sum(item.vatAmount * item.cantidad)`.
    - `totalFactura = sum(item.total)`.
- **Rationale**: Garantiza consistencia matemática absoluta entre el desglose por ítem y el total de la factura sin fugas de precisión decimal.

---

## 2. Pagos Mixtos, Gestión de Saldo y Cálculo de Vuelto

### Problema
Los clientes médicos frecuentemente abonan con múltiples métodos simultáneos (ej. parte en Efectivo, parte en Tarjeta o Cashea/Binance). Se debe determinar con exactitud cuándo una factura pasa a estar cancelada y cómo se calcula el vuelto de forma segura.

### Decisión
- **Relación 1 a Muchos (`Invoice` -> `InvoicePayment[]`)**: Una factura admite $N$ registros de cobro.
- **Cálculo de Estatus**:
  - `totalPagado = sum(payments.amount)`.
  - Si `totalPagado >= invoice.total`: El estatus transiciona automáticamente a `PAID`.
  - Si `totalPagado < invoice.total`: El estatus permanece en `PENDING`.
  - Si un administrador anula la factura: El estatus cambia a `VOIDED`.
- **Cálculo de Vuelto (`changeAmount`)**:
  - Se permite vuelto únicamente cuando se registran cobros en Efectivo (`CASH`) o cuando el total de pagos acumulados supera el total de la factura.
  - Para métodos electrónicos (Tarjeta, Cashea, Binance, Transferencia), el monto aplicado no debe superar el saldo pendiente por cobrar a menos que se trate de un pago en efectivo donde el cliente entrega un billete de denominación mayor (`receivedAmount > amount`).
- **Rationale**: Refleja fielmente la operativa de caja venezolana e internacional, permitiendo recibir divisas o bolívares en efectivo con cambio exacto.

---

## 3. Autorización y Seguridad en Anulación de Facturas y Eliminación de Pagos

### Problema
Un cajero u operador estándar no debe tener privilegios para anular facturas ni borrar pagos para evitar fraudes o descuadres en arqueo de caja. Sin embargo, los errores humanos de tipeo deben poder ser corregidos por supervisores.

### Decisión
- **Decorador y Guard de Permisos**:
  - `DELETE /api/v1/invoices/:id/payments/:paymentId`: Protegido por `@Roles('ROL_ADMIN', 'ROL_SUPERADMIN')`.
  - `PATCH /api/v1/invoices/:id/void`: Protegido por `@Roles('ROL_ADMIN', 'ROL_SUPERADMIN')`.
- **Recálculo Atómico de Factura al Eliminar Pago**:
  - Al suprimirse un pago, dentro de una transacción Prisma (`$transaction`), se recalcula la sumatoria de pagos activos. Si el total desciende por debajo de `invoice.total`, la factura vuelve de `PAID` a `PENDING`.
  - Se registra el evento en `SystemErrorLog` o en auditoría de caja con el `userId` del administrador que autorizó la operación.
- **Rationale**: Cumple el Principio II de la Constitución (RBAC estricto) y mantiene trazabilidad financiera inquebrantable.

---

## 4. Modal de Factura, Impresión Física y Envíos Digitales (WhatsApp y Correo)

### Problema
El comprobante de factura debe ser visualizado inmediatamente tras el cobro y poder ser impreso físicamente o despachado digitalmente por canales habituales.

### Decisión
- **Web SPA (`apps/web`)**:
  - Modal enriquecido en Angular (`InvoicePreviewModalComponent`) con estilo de factura formal médica.
  - Botón **Imprimir**: Ejecuta `window.print()` con estilos dedicados `@media print` que aíslan el cuerpo de la factura y ocultan navegación, botones y barras laterales.
  - Botón **WhatsApp**: Abre `https://wa.me/{telefono}?text={mensajeUrlEncoded}` con texto resumen (N° factura, cliente, total, fecha) y enlace de visualización pública/cliente.
  - Botón **Correo**: Llama al endpoint `POST /api/v1/invoices/:id/send-email` para despachar el correo con plantilla HTML o abre cliente `mailto:`.
- **Android Nativo (`apps/android`)**:
  - `InvoicePreviewDialog` en Jetpack Compose.
  - Botón **Imprimir**: Invoca el `PrintManager` de Android mediante `PrintDocumentAdapter`.
  - Botón **WhatsApp**: Dispara un `Intent(Intent.ACTION_SEND)` dirigido a WhatsApp con el texto y enlace formateado.
  - Botón **Correo**: Dispara `Intent(Intent.ACTION_SENDTO, Uri.parse("mailto:..."))`.
- **Rationale**: Cumple con la paridad obligatoria de plataformas de la Constitución v2.6.0, adaptando las capacidades de cada entorno.

---

## 5. Numeración Secuencial Atómica Multi-Tenant

### Problema
En entornos con múltiples cajas o usuarios facturando al mismo tiempo, generar números de factura secuenciales puede causar colisiones si no se sincroniza adecuadamente.

### Decisión
- Al emitir una factura, dentro de una transacción Prisma (`$transaction`), se consulta el último correlativo numérico del `tenantId` (`SELECT max(invoiceNumber) FROM invoices WHERE tenantId = ... FOR UPDATE` o contador incremental atómico).
- Formato estructurado: `INV-` seguido de 6 dígitos (ej. `INV-000001`, `INV-000002`).
- **Rationale**: Evita números duplicados y garantiza la independencia total entre diferentes organizaciones/clínicas.
