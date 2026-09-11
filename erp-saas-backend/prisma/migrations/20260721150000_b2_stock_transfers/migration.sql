-- B2: linked warehouse transfers
ALTER TABLE "stock_movements" ADD COLUMN IF NOT EXISTS "transferGroupId" TEXT;

CREATE INDEX IF NOT EXISTS "stock_movements_transferGroupId_idx"
  ON "stock_movements"("transferGroupId");
