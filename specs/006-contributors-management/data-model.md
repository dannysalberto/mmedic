# Data Model & Schema Definitions: Personal y Colaboradores Técnicos/Profesionales

## 1. Modelo Relacional en Prisma (`schema.prisma`)

El modelo `Contributor` se mapea a la tabla física `contributors`, con clave única compuesta `(tenantId, code)` e índices optimizados:

```prisma
enum ContributorStatus {
  ACTIVE
  INACTIVE
}

model Contributor {
  id        String            @id @default(uuid())
  tenantId  String
  code      String
  name      String
  status    ContributorStatus @default(ACTIVE)
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  tenant    Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([tenantId, code])
  @@index([tenantId, name])
  @@map("contributors")
}
```

---

## 2. Contratos y DTOs Compartidos en `@mmedic/types`

Ubicación: `packages/types/src/contributor.ts` (exportado vía `packages/types/src/index.ts`).

```typescript
export enum ContributorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface Contributor {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  status: ContributorStatus;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ContributorWithStats extends Contributor {
  articlesCount: number;
}

export interface CreateContributorDto {
  code: string;
  name: string;
  status?: ContributorStatus;
}

export interface UpdateContributorDto {
  code?: string;
  name?: string;
  status?: ContributorStatus;
}

export interface DuplicateContributorGroup {
  normalizedName: string;
  contributors: ContributorWithStats[];
  matchScore: number;
}

export interface MergeContributorsDto {
  primaryContributorId: string;
  secondaryContributorId: string;
}

export interface ContributorFilterQuery {
  search?: string;
  status?: ContributorStatus | 'ALL';
  page?: number;
  limit?: number;
}
```

---

## 3. Reglas de Validación y Restricciones de Dominio

1. **Unicidad de Código**: El campo `code` no puede repetirse dentro de la misma organización (`tenantId`), permitiendo su repetición en tenants distintos.
2. **Campos Obligatorios**: `code` (min 2, max 50 caracteres) y `name` (min 3, max 150 caracteres).
3. **Estado por Defecto**: Todo nuevo colaborador se inicializa en estado `ACTIVE`.
4. **Protección de Borrado**: El borrado físico exige verificación previa de dependencias (`articlesCount === 0`). Si existen asociaciones, se rechaza la solicitud recomendando el estado `INACTIVE`.
