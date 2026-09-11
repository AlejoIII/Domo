ALTER TABLE "sales_orders" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "sales_orders" ADD COLUMN "deliveredAt" TIMESTAMP(3);
ALTER TABLE "sales_orders" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "deliveryNotes" TEXT;
ALTER TABLE "sales_orders" ADD COLUMN "deliveryAddress" TEXT;
