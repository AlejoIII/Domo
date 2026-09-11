-- D1: Contabilidad básica

CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entryNumber" INTEGER NOT NULL,
    "entryDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "journal_lines" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lineOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounts_companyId_code_key" ON "accounts"("companyId", "code");
CREATE INDEX "accounts_companyId_idx" ON "accounts"("companyId");

CREATE UNIQUE INDEX "journal_entries_companyId_entryNumber_key" ON "journal_entries"("companyId", "entryNumber");
CREATE INDEX "journal_entries_companyId_entryDate_idx" ON "journal_entries"("companyId", "entryDate");
CREATE INDEX "journal_entries_companyId_referenceType_referenceId_idx" ON "journal_entries"("companyId", "referenceType", "referenceId");

CREATE INDEX "journal_lines_entryId_idx" ON "journal_lines"("entryId");
CREATE INDEX "journal_lines_accountId_idx" ON "journal_lines"("accountId");

ALTER TABLE "accounts" ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
