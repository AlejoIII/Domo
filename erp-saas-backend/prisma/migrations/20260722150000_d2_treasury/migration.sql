-- D2 Tesorería: cuentas bancarias y movimientos

CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iban" TEXT,
    "bankName" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "openingBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bank_movements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "movementDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paymentId" TEXT,
    "importBatchId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bank_accounts_companyId_idx" ON "bank_accounts"("companyId");

CREATE INDEX "bank_movements_companyId_movementDate_idx" ON "bank_movements"("companyId", "movementDate");
CREATE INDEX "bank_movements_bankAccountId_idx" ON "bank_movements"("bankAccountId");
CREATE INDEX "bank_movements_companyId_status_idx" ON "bank_movements"("companyId", "status");

CREATE UNIQUE INDEX "bank_movements_paymentId_key" ON "bank_movements"("paymentId");

ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bank_movements" ADD CONSTRAINT "bank_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_movements" ADD CONSTRAINT "bank_movements_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_movements" ADD CONSTRAINT "bank_movements_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
