# Data Model: Módulo de Facturación, Clientes Fiscales y Cobranzas

## 1. Esquema Relacional de Base de Datos (Prisma / PostgreSQL)

### 1.1. Modificación de Entidad Existente: `Article`
Se agrega el campo booleano `appliesVat` a la tabla `articles`:
```prisma
model Article {
  // ... campos existentes (id, tenantId, code, name, categoryId, price1..4, isActive)
  appliesVat Boolean @default(false)
  // ...
  invoiceItems InvoiceItem[]
}
```

---

### 1.2. Nuevas Entidades

#### Entidad: `Customer` (`customers`)
Almacena la información fiscal de clientes y pacientes receptores de facturas.
```prisma
model Customer {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  taxId     String   // RIF o Cédula (ej. "J-12345678-9", "V-18765432")
  name      String   // Nombre o Razón Social
  phone     String   // Teléfono principal
  address   String   // Dirección fiscal
  email     String?  // Correo opcional para facturación electrónica
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  invoices  Invoice[]

  @@unique([tenantId, taxId])
  @@index([tenantId])
  @@index([tenantId, taxId])
  @@map("customers")
}
```

---

#### Entidad: `Invoice` (`invoices`)
Cabecera del documento mercantil y fiscal.
```prisma
enum InvoiceType {
  CASH
  CREDIT
}

enum InvoiceStatus {
  PENDING
  PAID
  VOIDED
}

model Invoice {
  id            String        @id @default(uuid())
  tenantId      String
  tenant        Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoiceNumber String        // Correlativo único por tenant (ej. "INV-000001")
  issueDate     DateTime      @default(now())
  
  customerId    String
  customer      Customer      @relation(fields: [customerId], references: [id], onDelete: Restrict)
  
  type          InvoiceType   @default(CASH)
  status        InvoiceStatus @default(PENDING)
  
  subtotal      Decimal       @db.Decimal(14, 3) // Base imponible total sin IVA
  vatAmount     Decimal       @db.Decimal(14, 3) // Total de IVA acumulado
  total         Decimal       @db.Decimal(14, 3) // Total neto facturado (subtotal + vatAmount)
  
  notes         String?       // Observaciones o justificación de anulación
  createdById   String?       // Usuario cajero/facturador que emitió la factura
  
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  items         InvoiceItem[]
  payments      InvoicePayment[]

  @@unique([tenantId, invoiceNumber])
  @@index([tenantId])
  @@index([customerId])
  @@index([issueDate])
  @@index([status])
  @@map("invoices")
}
```

---

#### Entidad: `InvoiceItem` (`invoice_items`)
Detalle de productos facturados con desglose de precios, alícuotas y profesional beneficiario.
```prisma
enum PriceType {
  PRICE_1
  PRICE_2
  PRICE_3
  PRICE_4
}

model InvoiceItem {
  id         String    @id @default(uuid())
  tenantId   String
  tenant     Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  invoiceId  String
  invoice    Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  articleId  String
  article    Article   @relation(fields: [articleId], references: [id], onDelete: Restrict)
  
  entityId   String    // Médico o entidad colaboradora beneficiaria
  entity     Entity    @relation(fields: [entityId], references: [id], onDelete: Restrict)
  
  priceType  PriceType @default(PRICE_1)
  quantity   Decimal   @db.Decimal(10, 3)
  
  basePrice  Decimal   @db.Decimal(14, 3) // Precio unitario base sin IVA
  vatAmount  Decimal   @db.Decimal(14, 3) // Monto de IVA unitario
  subtotal   Decimal   @db.Decimal(14, 3) // Precio unitario gravado (basePrice + vatAmount)
  total      Decimal   @db.Decimal(14, 3) // Subtotal unitario * quantity
  
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([tenantId])
  @@index([invoiceId])
  @@index([articleId])
  @@index([entityId])
  @@map("invoice_items")
}
```

---

#### Entidad: `InvoicePayment` (`invoice_payments`)
Registro de pagos recibidos contra la factura (soporte de cobros mixtos).
```prisma
enum PaymentMethod {
  CASH
  CARD
  CASHEA
  BINANCE
  TRANSFER
  OTHER
}

model InvoicePayment {
  id             String        @id @default(uuid())
  tenantId       String
  tenant         Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  invoiceId      String
  invoice        Invoice       @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  paymentMethod  PaymentMethod @default(CASH)
  amount         Decimal       @db.Decimal(14, 3) // Monto imputado a la factura
  receivedAmount Decimal?      @db.Decimal(14, 3) // Monto entregado por el cliente (para efectivo)
  changeAmount   Decimal?      @db.Decimal(14, 3) // Vuelto devuelto al cliente
  
  reference      String?       // N° de lote, aprobación, hash o ref bancaria
  paymentDate    DateTime      @default(now())
  receivedById   String?       // Usuario que procesó el cobro
  
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([tenantId])
  @@index([invoiceId])
  @@index([paymentDate])
  @@map("invoice_payments")
}
```

---

## 2. Máquina de Estados y Transiciones de Factura

```text
[ NUEVA FACTURA ]
       │
       ▼
 [ PENDING ]  <──(Eliminación de pago deja saldo < total)──┐
       │                                                   │
       ├──(Suma de pagos >= total)─────────────────► [ PAID ]
       │                                                   │
       └──(Anulación por Administrador)──────┐             │
                                             ▼             │
                                        [ VOIDED ] ◄───────┘
                                   (Estado Final Irreversible)
```

1. **Estado Inicial**: Toda factura creada sin cobros o con cobros parciales nace en `PENDING`.
2. **Transición a `PAID`**: En cuanto la sumatoria de `InvoicePayment.amount` iguala o supera el `Invoice.total`, el estatus conmuta automáticamente a `PAID`.
3. **Reversión a `PENDING`**: Si un administrador elimina un pago erróneo y la sumatoria acumulada queda por debajo de `Invoice.total`, el estatus revierte de inmediato a `PENDING`.
4. **Transición a `VOIDED`**: Exclusiva para administradores (`ROL_ADMIN` o `ROL_SUPERADMIN`). Inhabilita operaciones adicionales sobre la factura.
