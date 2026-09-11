-- Fase 4 — Facturas rectificativas (notas de crédito) + RGPD

-- AlterTable: serie propia para rectificativas
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "creditNotePrefix" TEXT NOT NULL DEFAULT 'REC';

-- AlterTable: tipo de documento y enlace a la factura rectificada
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "documentType" TEXT NOT NULL DEFAULT 'invoice';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "originalInvoiceId" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "creditReason" TEXT;

DO $$
BEGIN
  ALTER TABLE "invoices"
    ADD CONSTRAINT "invoices_originalInvoiceId_fkey"
    FOREIGN KEY ("originalInvoiceId") REFERENCES "invoices"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "invoices_companyId_documentType_idx" ON "invoices"("companyId", "documentType");
CREATE INDEX IF NOT EXISTS "invoices_originalInvoiceId_idx" ON "invoices"("originalInvoiceId");

-- AlterTable: RGPD — anonimización de clientes conservando histórico fiscal
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "anonymizedAt" TIMESTAMP(3);
