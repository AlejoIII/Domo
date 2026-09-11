-- AlterTable products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- CreateTable employees
CREATE TABLE IF NOT EXISTS "employees" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "imageUrl" TEXT,
    "hireDate" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "employees_companyId_idx" ON "employees"("companyId");
CREATE INDEX IF NOT EXISTS "employees_companyId_lastName_firstName_idx" ON "employees"("companyId", "lastName", "firstName");

ALTER TABLE "employees" DROP CONSTRAINT IF EXISTS "employees_companyId_fkey";
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
