# Quickstart & Verification Guide: Módulo de Facturación, Clientes Fiscales y Cobranzas

Este documento describe los escenarios de verificación funcional de extremo a extremo para validar el módulo de facturación tanto en la aplicación **Web (`apps/web`)** como en la aplicación móvil nativa **Android (`apps/android`)**.

---

## Prerrequisitos

1. **Servidor API y Base de Datos**:
   - Backend NestJS ejecutándose en `http://localhost:3000` (`pnpm --filter @mmedic/api start:dev`).
   - Base de datos PostgreSQL con migraciones aplicadas (`pnpm --filter @mmedic/api prisma:migrate:dev`).
2. **Aplicación Web**:
   - Frontend Angular 19 activo en `http://localhost:4200` (`pnpm --filter @mmedic/web start`).
3. **Aplicación Móvil Android**:
   - Emulador o dispositivo físico Android ejecutando el build de depuración (`.\gradlew.bat installDebug`).
4. **Datos Semilla**:
   - Al menos 1 médico/entidad colaboradora activa (ej. `Dr. Manuel Silva`).
   - Al menos 2 artículos registrados:
     - Uno con `Aplica IVA = SÍ` (ej. `Consulta General` a $20.000).
     - Uno con `Aplica IVA = NO` (ej. `Medicina Exenta` a $10.000).

---

## Escenarios de Validación

### Escenario 1: Creación Inline de Cliente Fiscal y Emisión de Factura con Cálculos a 3 Decimales
1. Navegar a **Facturación** -> **Nueva Factura** (en Web o Android).
2. En el selector de cliente, tipear un RIF nuevo (ej. `J-50123456-0`).
3. Al indicar que no existe, abrir el modal de cliente rápido e ingresar:
   - **Nombre**: `Inversiones Médicas Caracas C.A.`
   - **Teléfono**: `04141234567`
   - **Dirección**: `Av. Libertador, Edif. Torre Salud, Piso 4`
4. Guardar el cliente y verificar que su RIF y Nombre queden seleccionados en la factura.
5. Agregar Renglón 1:
   - Artículo: `Consulta General` (Aplica IVA = SÍ).
   - Tipo de Precio: `Precio 1` ($20.000).
   - Cantidad: `2`.
   - Beneficiario: `Dr. Manuel Silva`.
   - **Resultado Esperado**: Precio Base: `20.000`, IVA: `3.200`, Subtotal: `23.200`, Total: `46.400`.
6. Agregar Renglón 2:
   - Artículo: `Medicina Exenta` (Aplica IVA = NO).
   - Tipo de Precio: `Precio 1` ($10.000).
   - Cantidad: `1`.
   - Beneficiario: `Dr. Manuel Silva`.
   - **Resultado Esperado**: Precio Base: `10.000`, IVA: `0.000`, Subtotal: `10.000`, Total: `10.000`.
7. **Verificación de Totales Cabecera**:
   - Subtotal: `50.000`
   - Total IVA: `6.400`
   - Total a Pagar: `56.400`
8. Guardar la factura en modo `CASH` sin registrar cobro aún.
9. **Resultado Esperado**: Se crea la factura correlativa (ej. `INV-000001`) con estatus `PENDING`.

---

### Escenario 2: Cobros Mixtos y Cálculo de Vuelto en Efectivo
1. Abrir la factura emitida en el Escenario 1 (Saldo pendiente: `56.400`).
2. En la sección de pagos, registrar Cobro 1:
   - Método: `CASHEA`
   - Monto: `26.400`
   - Referencia: `CSH-998811`
   - Confirmar cobro. Saldo restante esperado: `30.000`. Estatus: `PENDING`.
3. Registrar Cobro 2:
   - Método: `CASH` (Efectivo)
   - Monto a cobrar: `30.000`
   - Monto recibido: `50.000` (billete de mayor valor)
   - **Resultado Esperado**: El sistema calcula y muestra un vuelto de `20.000`.
4. Confirmar cobro en efectivo.
5. **Resultado Esperado**: El total de pagos registrados suma `56.400` (con $20.000$ entregados de vuelto). El estatus de la factura cambia automáticamente a `PAID`.

---

### Escenario 3: Seguridad y Rectificación de Pagos por Administrador
1. Iniciar sesión con un usuario con rol `ROL_CAJERO`.
2. Verificar que no exista botón para eliminar pagos ni anular la factura.
3. Iniciar sesión con un usuario con rol `ROL_ADMIN`.
4. Sobre la factura pagada, seleccionar la acción de eliminar sobre el pago de Cashea (`26.400`).
5. Confirmar la eliminación en el diálogo de seguridad.
6. **Resultado Esperado**:
   - El pago de Cashea se elimina de la lista.
   - El saldo pagado desciende a `30.000`.
   - El estatus de la factura regresa automáticamente de `PAID` a `PENDING`.
   - Se habilita el botón para registrar el nuevo pago sustitutivo correcto.

---

### Escenario 4: Previsualización Modal, Impresión y Envíos (WhatsApp / Correo)
1. Abrir la modal de previsualización de la factura.
2. Comprobar que contenga:
   - Encabezado con datos del cliente y número correlativo `INV-000001`.
   - Tabla de ítems con desglose de IVA y médico beneficiario por fila.
   - Resumen financiero de base imponible, IVA y total.
   - Lista de pagos recibidos y cambio otorgado.
3. Probar botón **Imprimir**:
   - En Web: Se abre la ventana de impresión nativa del navegador con plantilla CSS optimizada sin menús.
   - En Android: Se activa el `PrintManager` con el documento formateado.
4. Probar botón **WhatsApp**:
   - En Web: Abre WhatsApp Web con el texto preparado para el cliente.
   - En Android: Abre el diálogo Intent nativo para enviar a WhatsApp.
5. Probar botón **Correo**:
   - Despacha o prepara la notificación digital con el resumen de la factura.
