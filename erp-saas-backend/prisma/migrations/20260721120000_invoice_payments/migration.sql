CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" TEXT NOT NULL DEFAULT 'transfer',
    "reference" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payments_companyId_paymentDate_idx" ON "payments"("companyId", "paymentDate");
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

ALTER TABLE "payments" ADD CONSTRAINT "payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "payments" ("id", "companyId", "invoiceId", "amount", "paymentDate", "method", "notes", "createdAt")
SELECT
  gen_random_uuid()::text,
  i."companyId",
  i.id,
  i.total,
  COALESCE(i."issueDate", i."createdAt"),
  'transfer',
  'Migración: factura marcada como pagada',
  NOW()
FROM "invoices" i
WHERE i.status = 'paid'
  AND i."deletedAt" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "payments" p WHERE p."invoiceId" = i.id);

UPDATE "invoices" SET status = 'issued'
WHERE status = 'paid'
  AND "deletedAt" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "payments" p WHERE p."invoiceId" = "invoices".id);

UPDATE "invoices" i SET status = 'paid'
WHERE i."deletedAt" IS NULL
  AND EXISTS (
    SELECT 1 FROM "payments" p
    WHERE p."invoiceId" = i.id
    GROUP BY p."invoiceId"
    HAVING SUM(p.amount) >= i.total
  );

UPDATE "invoices" i SET status = 'partially_paid'
WHERE i."deletedAt" IS NULL
  AND i.status NOT IN ('draft', 'cancelled', 'paid')
  AND EXISTS (SELECT 1 FROM "payments" p WHERE p."invoiceId" = i.id)
  AND (
    SELECT COALESCE(SUM(p.amount), 0) FROM "payments" p WHERE p."invoiceId" = i.id
  ) < i.total;
