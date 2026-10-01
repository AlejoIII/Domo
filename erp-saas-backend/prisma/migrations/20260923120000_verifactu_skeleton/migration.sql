-- Verifactu / SIF — esqueleto: cadena, registros y config por empresa

ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verifactuEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verifactuMode" TEXT NOT NULL DEFAULT 'verifactu';
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verifactuNif" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verifactuCertPemEnc" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verifactuCertPassEnc" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "verifactuCertFingerprint" TEXT;

CREATE TABLE IF NOT EXISTS "verifactu_chain_heads" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "lastHuella" TEXT,
    "lastRecordId" TEXT,
    "lastGeneratedAt" TIMESTAMP(3),
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifactu_chain_heads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "verifactu_chain_heads_companyId_key"
  ON "verifactu_chain_heads"("companyId");

DO $$
BEGIN
  ALTER TABLE "verifactu_chain_heads"
    ADD CONSTRAINT "verifactu_chain_heads_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "verifactu_records" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "recordType" TEXT NOT NULL,
    "invoiceType" TEXT,
    "idEmisorFactura" TEXT NOT NULL,
    "numSerieFactura" TEXT NOT NULL,
    "fechaExpedicion" TEXT NOT NULL,
    "cuotaTotal" DECIMAL(12,2) NOT NULL,
    "importeTotal" DECIMAL(12,2) NOT NULL,
    "huella" TEXT NOT NULL,
    "huellaAnterior" TEXT,
    "fechaHoraHusoGen" TIMESTAMP(3) NOT NULL,
    "sequenceNo" INTEGER NOT NULL,
    "xmlPayload" TEXT NOT NULL,
    "qrPayload" TEXT,
    "aeatStatus" TEXT NOT NULL DEFAULT 'pending',
    "aeatCsv" TEXT,
    "aeatResponseXml" TEXT,
    "aeatSentAt" TIMESTAMP(3),
    "aeatError" TEXT,
    "incidenciaRemision" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifactu_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "verifactu_records_companyId_sequenceNo_key"
  ON "verifactu_records"("companyId", "sequenceNo");
CREATE UNIQUE INDEX IF NOT EXISTS "verifactu_records_companyId_huella_key"
  ON "verifactu_records"("companyId", "huella");
CREATE INDEX IF NOT EXISTS "verifactu_records_companyId_aeatStatus_idx"
  ON "verifactu_records"("companyId", "aeatStatus");
CREATE INDEX IF NOT EXISTS "verifactu_records_companyId_createdAt_idx"
  ON "verifactu_records"("companyId", "createdAt");
CREATE INDEX IF NOT EXISTS "verifactu_records_invoiceId_idx"
  ON "verifactu_records"("invoiceId");

DO $$
BEGIN
  ALTER TABLE "verifactu_records"
    ADD CONSTRAINT "verifactu_records_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "verifactu_records"
    ADD CONSTRAINT "verifactu_records_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
