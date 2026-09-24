# Data Model & Schema Definitions: Entidades Colaboradoras

## Modelos Relacionales (Prisma Schema)

El modelo de entidad colaboradora interactúa con la estructura relacional multi-tenant preexistente:

```prisma
enum EntityStatus {
  ACTIVE
  INACTIVE
}

model Entity {
  id                  String               @id @default(uuid())
  tenantId            String
  code                String
  name                String
  status              EntityStatus         @default(ACTIVE)
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  tenant              Tenant               @relation(fields: [tenantId], references: [id])
  articleParticipants ArticleParticipant[]

  @@unique([tenantId, code])
  @@index([tenantId, name])
  @@map("entities")
}

model ArticleParticipant {
  id         String   @id @default(uuid())
  tenantId   String
  articleId  String
  entityId   String
  percentage Decimal  @db.Decimal(5, 2)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  article    Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  entity     Entity   @relation(fields: [entityId], references: [id], onDelete: Restrict)

  @@unique([articleId, entityId])
  @@map("article_participants")
}
```

---

## DTOs Compartidos en `@mmedic/types`

```typescript
export interface EntityWithStats extends Entity {
  articlesCount: number;
}

export interface DuplicateEntityGroup {
  normalizedName: string;
  entities: EntityWithStats[];
  matchScore: number;
}

export interface MergeEntitiesDto {
  primaryEntityId: string;
  secondaryEntityId: string;
}

export interface UpdateEntityDto {
  code?: string;
  name?: string;
  status?: EntityStatus;
}
```
