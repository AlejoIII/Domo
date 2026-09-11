-- B3: CRM ligero en clientes
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "segment" TEXT NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS "clients_companyId_segment_idx" ON "clients"("companyId", "segment");

CREATE TABLE IF NOT EXISTS "client_notes" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "userId" TEXT,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "client_notes_clientId_createdAt_idx"
  ON "client_notes"("clientId", "createdAt");

CREATE INDEX IF NOT EXISTS "client_notes_companyId_idx"
  ON "client_notes"("companyId");

ALTER TABLE "client_notes"
  ADD CONSTRAINT "client_notes_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_notes"
  ADD CONSTRAINT "client_notes_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "client_notes"
  ADD CONSTRAINT "client_notes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
