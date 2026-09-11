-- Align DB with Prisma schema (partial index + updatedAt default drift)

ALTER TABLE "document_number_sequences" ALTER COLUMN "updatedAt" DROP DEFAULT;

DROP INDEX IF EXISTS "sales_orders_companyId_deliveryNoteNumber_key";
CREATE UNIQUE INDEX "sales_orders_companyId_deliveryNoteNumber_key"
  ON "sales_orders"("companyId", "deliveryNoteNumber");
