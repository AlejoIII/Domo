-- Partial indexes: smaller, faster for tenant list queries that always filter deletedAt IS NULL

CREATE INDEX IF NOT EXISTS "sales_orders_companyId_status_active_idx"
  ON "sales_orders" ("companyId", "status")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "sales_orders_companyId_orderDate_active_idx"
  ON "sales_orders" ("companyId", "orderDate")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "sales_orders_companyId_createdAt_active_idx"
  ON "sales_orders" ("companyId", "createdAt")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "invoices_companyId_status_active_idx"
  ON "invoices" ("companyId", "status")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "invoices_companyId_dueDate_active_idx"
  ON "invoices" ("companyId", "dueDate")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "invoices_companyId_issueDate_active_idx"
  ON "invoices" ("companyId", "issueDate")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "quotes_companyId_status_active_idx"
  ON "quotes" ("companyId", "status")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "quotes_companyId_quoteDate_active_idx"
  ON "quotes" ("companyId", "quoteDate")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "purchase_orders_companyId_status_active_idx"
  ON "purchase_orders" ("companyId", "status")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "purchase_orders_companyId_orderDate_active_idx"
  ON "purchase_orders" ("companyId", "orderDate")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "products_companyId_isActive_active_idx"
  ON "products" ("companyId", "isActive")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "clients_companyId_name_active_idx"
  ON "clients" ("companyId", "name")
  WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "clients_companyId_createdAt_active_idx"
  ON "clients" ("companyId", "createdAt")
  WHERE "deletedAt" IS NULL;
