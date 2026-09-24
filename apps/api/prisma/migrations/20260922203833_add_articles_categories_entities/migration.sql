-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "article_categories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "price1" DECIMAL(12,2) NOT NULL,
    "price2" DECIMAL(12,2),
    "price3" DECIMAL(12,2),
    "price4" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_participants" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_categories_tenantId_idx" ON "article_categories"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "article_categories_tenantId_name_key" ON "article_categories"("tenantId", "name");

-- CreateIndex
CREATE INDEX "entities_tenantId_idx" ON "entities"("tenantId");

-- CreateIndex
CREATE INDEX "entities_tenantId_code_idx" ON "entities"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "entities_tenantId_code_key" ON "entities"("tenantId", "code");

-- CreateIndex
CREATE INDEX "articles_tenantId_idx" ON "articles"("tenantId");

-- CreateIndex
CREATE INDEX "articles_categoryId_idx" ON "articles"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_tenantId_code_key" ON "articles"("tenantId", "code");

-- CreateIndex
CREATE INDEX "article_participants_tenantId_idx" ON "article_participants"("tenantId");

-- CreateIndex
CREATE INDEX "article_participants_articleId_idx" ON "article_participants"("articleId");

-- CreateIndex
CREATE INDEX "article_participants_entityId_idx" ON "article_participants"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "article_participants_articleId_entityId_key" ON "article_participants"("articleId", "entityId");

-- AddForeignKey
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entities" ADD CONSTRAINT "entities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "article_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_participants" ADD CONSTRAINT "article_participants_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_participants" ADD CONSTRAINT "article_participants_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_participants" ADD CONSTRAINT "article_participants_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
