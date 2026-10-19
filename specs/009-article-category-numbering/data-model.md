# Data Model: Numeración Consecutiva por Categoría y Búsqueda de Artículos

**Feature**: `009-article-category-numbering`  
**Status**: Completed  
**Date**: 2026-10-19

---

## 1. Modificaciones en Esquema de Base de Datos (Prisma)

### Modelo: `ArticleCategory` (`article_categories`)

```prisma
model ArticleCategory {
  id              String   @id @default(uuid())
  tenantId        String
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name            String
  seed            String   // Prefijo de la serie correlativa (ej: "CONS", "EXAM", "LAB")
  currentSequence Int      @default(0) // Último número emitido para esta categoría (inicia en 0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  articles Article[]

  @@unique([tenantId, name])
  @@unique([tenantId, seed])
  @@index([tenantId])
  @@map("article_categories")
}
```

### Modelo: `Article` (`articles`)

```prisma
model Article {
  id         String          @id @default(uuid())
  tenantId   String
  tenant     Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  code       String          // Código del artículo generado (ej: "CONS-001") o manual
  name       String
  categoryId String
  category   ArticleCategory @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  
  price1     Decimal         @db.Decimal(12, 2)
  price2     Decimal?        @db.Decimal(12, 2)
  price3     Decimal?        @db.Decimal(12, 2)
  price4     Decimal?        @db.Decimal(12, 2)

  isActive   Boolean         @default(true)
  appliesVat Boolean         @default(false)
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt

  participants ArticleParticipant[]
  invoiceItems InvoiceItem[]

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([categoryId])
  @@map("articles")
}
```

---

## 2. Contratos Compartidos (`packages/types`)

### Extensión de `ArticleCategory`:
```typescript
export interface ArticleCategory {
  id: string;
  tenantId: string;
  name: string;
  seed: string;
  currentSequence: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleCategoryDto {
  name: string;
  seed: string;
}

export interface UpdateArticleCategoryDto {
  name?: string;
  seed?: string;
}
```

### Extensión de `CreateArticleDto`:
```typescript
export interface CreateArticleDto {
  code?: string; // Opcional: si no se provee, se genera automáticamente usando el seed de categoryId
  name: string;
  categoryId: string;
  price1: number;
  price2?: number | null;
  price3?: number | null;
  price4?: number | null;
  appliesVat?: boolean;
  isActive?: boolean;
  participants?: ArticleParticipantInputDto[];
}
```

---

## 3. Reglas de Validación de Dominio

1. **Semilla (`seed`)**:
   - Longitud: 2 a 6 caracteres.
   - Formato: Expresión regular `^[A-Z0-9]{2,6}$`.
   - Normalización: Se transforma a mayúsculas y se eliminan espacios en blanco antes de persistir.
   - Unicidad: Única por `tenantId` en la tabla `article_categories`.

2. **Código de Artículo (`code`)**:
   - Si se genera automáticamente: `${seed}-${String(currentSequence).padStart(3, '0')}`.
   - Si se ingresa manualmente: Debe cumplir con unicidad en `[tenantId, code]`.

3. **Atomicidad de Incremento**:
   - El contador `currentSequence` solo se incrementa dentro de la transacción de creación del artículo al ejecutarse `tx.articleCategory.update({ where: { id }, data: { currentSequence: { increment: 1 } } })`.
   - Si la inserción del artículo falla por cualquier motivo, la transacción se cancela (`ROLLBACK`), evitando huecos en la numeración.
