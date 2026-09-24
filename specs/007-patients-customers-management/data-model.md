# Data Model: Módulo de Gestión de Clientes / Directorio de Pacientes

## 1. Esquema de Entidades (Prisma / PostgreSQL)

### Modelo `Customer` (Tabla `customers`)

```prisma
model Customer {
  id        String   @id @default(uuid())
  tenantId  String
  taxId     String   // RIF o Cédula Fiscal (Ej: J-30456789-0, V-19876543)
  name      String   // Nombre completo o Razón Social
  phone     String   // Teléfono principal
  address   String   // Dirección fiscal / domicilio
  email     String?  // Correo electrónico opcional
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant   Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  invoices Invoice[]

  @@unique([tenantId, taxId])
  @@index([tenantId, name])
  @@index([tenantId, taxId])
  @@map("customers")
}
```

---

## 2. Definición de Tipos y DTOs (`packages/types`)

### 2.1. Interfaz Principal (`Customer`)

```typescript
export interface Customer {
  id: string;
  tenantId?: string;
  taxId: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2.2. DTOs de Transferencia de Datos

```typescript
export interface CreateCustomerDto {
  taxId: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
}

export interface UpdateCustomerDto {
  taxId?: string;
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
}
```

---

## 3. Reglas de Validación y Estado

1. **Unicidad de RIF / Cédula**: La combinación de `tenantId` y `taxId` debe ser única. Se realiza un `trim()` de espacios en blanco antes de validar.
2. **Campos Obligatorios**: `taxId`, `name`, `phone` y `address` son estrictamente requeridos.
3. **Restricción de Eliminación**: Si `_count.invoices > 0`, la API retorna HTTP Status `409 Conflict` bloqueando la eliminación.
