-- AlterTable companies
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
ALTER TABLE "companies" ADD COLUMN "defaultWarehouseId" TEXT;
ALTER TABLE "companies" ADD COLUMN "allowNegativeStock" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable sales_orders
ALTER TABLE "sales_orders" ADD COLUMN "warehouseId" TEXT;

-- AlterTable purchase_orders
ALTER TABLE "purchase_orders" ADD COLUMN "warehouseId" TEXT;

-- CreateTable stock_movements
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_movements_companyId_createdAt_idx" ON "stock_movements"("companyId", "createdAt");
CREATE INDEX "stock_movements_productId_idx" ON "stock_movements"("productId");
CREATE INDEX "stock_movements_warehouseId_idx" ON "stock_movements"("warehouseId");

ALTER TABLE "companies" ADD CONSTRAINT "companies_defaultWarehouseId_fkey" FOREIGN KEY ("defaultWarehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Set default warehouse per company (first active warehouse)
UPDATE "companies" c
SET "defaultWarehouseId" = (
  SELECT w.id FROM "warehouses" w
  WHERE w."companyId" = c.id AND w."deletedAt" IS NULL
  ORDER BY w."createdAt" ASC
  LIMIT 1
)
WHERE c."defaultWarehouseId" IS NULL;

-- Sync warehouse stock from product.stock where missing
INSERT INTO "warehouse_stocks" ("id", "warehouseId", "productId", "quantity", "updatedAt")
SELECT gen_random_uuid()::text, c."defaultWarehouseId", p.id, p.stock, NOW()
FROM "products" p
JOIN "companies" c ON c.id = p."companyId"
WHERE p."deletedAt" IS NULL
  AND c."defaultWarehouseId" IS NOT NULL
  AND p.stock <> 0
  AND NOT EXISTS (
    SELECT 1 FROM "warehouse_stocks" ws
    WHERE ws."productId" = p.id AND ws."warehouseId" = c."defaultWarehouseId"
  );

-- Recalculate product.stock from warehouse totals
UPDATE "products" p
SET stock = COALESCE((
  SELECT SUM(ws.quantity)::int
  FROM "warehouse_stocks" ws
  JOIN "warehouses" w ON w.id = ws."warehouseId"
  WHERE ws."productId" = p.id
    AND w."companyId" = p."companyId"
    AND w."deletedAt" IS NULL
), 0)
WHERE p."deletedAt" IS NULL;
