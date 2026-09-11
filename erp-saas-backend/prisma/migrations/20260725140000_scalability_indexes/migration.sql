-- Composite indexes for tenant-scoped list/filter queries

CREATE INDEX "audit_logs_companyId_createdAt_idx" ON "audit_logs"("companyId", "createdAt");

CREATE INDEX "products_companyId_isActive_idx" ON "products"("companyId", "isActive");

CREATE INDEX "sales_orders_companyId_status_idx" ON "sales_orders"("companyId", "status");
CREATE INDEX "sales_orders_companyId_orderDate_idx" ON "sales_orders"("companyId", "orderDate");
CREATE INDEX "sales_orders_companyId_createdAt_idx" ON "sales_orders"("companyId", "createdAt");

CREATE INDEX "invoices_companyId_status_idx" ON "invoices"("companyId", "status");
CREATE INDEX "invoices_companyId_dueDate_idx" ON "invoices"("companyId", "dueDate");
CREATE INDEX "invoices_companyId_issueDate_idx" ON "invoices"("companyId", "issueDate");
CREATE INDEX "invoices_orderId_idx" ON "invoices"("orderId");

CREATE INDEX "quotes_companyId_status_idx" ON "quotes"("companyId", "status");
CREATE INDEX "quotes_companyId_quoteDate_idx" ON "quotes"("companyId", "quoteDate");

CREATE INDEX "purchase_orders_companyId_status_idx" ON "purchase_orders"("companyId", "status");
CREATE INDEX "purchase_orders_companyId_orderDate_idx" ON "purchase_orders"("companyId", "orderDate");

CREATE INDEX "webhook_deliveries_status_createdAt_idx" ON "webhook_deliveries"("status", "createdAt");
