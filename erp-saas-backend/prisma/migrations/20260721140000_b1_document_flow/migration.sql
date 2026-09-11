-- B1: delivery note number + transactional document numbering
ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "deliveryNoteNumber" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "sales_orders_companyId_deliveryNoteNumber_key"
  ON "sales_orders"("companyId", "deliveryNoteNumber")
  WHERE "deliveryNoteNumber" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "document_number_sequences" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "docType" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "lastValue" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_number_sequences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "document_number_sequences_companyId_docType_year_key"
  ON "document_number_sequences"("companyId", "docType", "year");

CREATE INDEX IF NOT EXISTS "document_number_sequences_companyId_idx"
  ON "document_number_sequences"("companyId");

ALTER TABLE "document_number_sequences"
  ADD CONSTRAINT "document_number_sequences_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
