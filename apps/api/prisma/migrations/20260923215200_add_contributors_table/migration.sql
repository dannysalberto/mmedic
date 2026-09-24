-- CreateEnum
CREATE TYPE "ContributorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "contributors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ContributorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contributors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contributors_tenantId_idx" ON "contributors"("tenantId");

-- CreateIndex
CREATE INDEX "contributors_tenantId_code_idx" ON "contributors"("tenantId", "code");

-- CreateIndex
CREATE INDEX "contributors_tenantId_name_idx" ON "contributors"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "contributors_tenantId_code_key" ON "contributors"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
