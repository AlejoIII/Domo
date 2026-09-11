-- D5 Fabricación / BOM

CREATE TABLE "boms" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bom_lines" (
    "id" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "componentProductId" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "lineOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bom_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manufacturing_orders" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "bomId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "quantity" DECIMAL(12,4) NOT NULL,
    "quantityProduced" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "plannedDate" DATE,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "boms_companyId_productId_key" ON "boms"("companyId", "productId");
CREATE INDEX "boms_companyId_idx" ON "boms"("companyId");

CREATE INDEX "bom_lines_bomId_idx" ON "bom_lines"("bomId");

CREATE UNIQUE INDEX "manufacturing_orders_companyId_number_key" ON "manufacturing_orders"("companyId", "number");
CREATE INDEX "manufacturing_orders_companyId_status_idx" ON "manufacturing_orders"("companyId", "status");

ALTER TABLE "boms" ADD CONSTRAINT "boms_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "boms" ADD CONSTRAINT "boms_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bom_lines" ADD CONSTRAINT "bom_lines_componentProductId_fkey" FOREIGN KEY ("componentProductId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_bomId_fkey" FOREIGN KEY ("bomId") REFERENCES "boms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "manufacturing_orders" ADD CONSTRAINT "manufacturing_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
