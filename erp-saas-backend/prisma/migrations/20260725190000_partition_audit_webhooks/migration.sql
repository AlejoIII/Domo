-- Partition audit_logs and webhook_deliveries by month (createdAt)
-- Prisma uses composite PK (id, createdAt) — see schema.prisma

-- ─── Helper: create monthly partition ───────────────────────────────────────

CREATE OR REPLACE FUNCTION domo_create_monthly_partition(
  parent_table TEXT,
  partition_key TIMESTAMPTZ
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  start_ts TIMESTAMPTZ;
  end_ts TIMESTAMPTZ;
  partition_name TEXT;
BEGIN
  start_ts := date_trunc('month', partition_key AT TIME ZONE 'UTC');
  end_ts := start_ts + INTERVAL '1 month';
  partition_name := parent_table || '_' || to_char(start_ts, 'YYYY_MM');

  IF to_regclass(partition_name) IS NULL THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
      partition_name,
      parent_table,
      start_ts,
      end_ts
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION domo_audit_logs_partition_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM domo_create_monthly_partition('audit_logs', NEW."createdAt");
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION domo_webhook_deliveries_partition_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM domo_create_monthly_partition('webhook_deliveries', NEW."createdAt");
  RETURN NEW;
END;
$$;

-- ─── audit_logs ─────────────────────────────────────────────────────────────

ALTER TABLE "audit_logs" RENAME TO "audit_logs_legacy";
ALTER TABLE "audit_logs_legacy" RENAME CONSTRAINT "audit_logs_pkey" TO "audit_logs_legacy_pkey";
ALTER TABLE "audit_logs_legacy" RENAME CONSTRAINT "audit_logs_userId_fkey" TO "audit_logs_legacy_userId_fkey";
ALTER TABLE "audit_logs_legacy" RENAME CONSTRAINT "audit_logs_companyId_fkey" TO "audit_logs_legacy_companyId_fkey";
ALTER INDEX IF EXISTS "audit_logs_companyId_idx" RENAME TO "audit_logs_legacy_companyId_idx";
ALTER INDEX IF EXISTS "audit_logs_companyId_createdAt_idx" RENAME TO "audit_logs_legacy_companyId_createdAt_idx";

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "userId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id", "createdAt")
) PARTITION BY RANGE ("createdAt");

CREATE TABLE "audit_logs_default" PARTITION OF "audit_logs" DEFAULT;

DO $$
DECLARE
  m DATE := DATE '2025-01-01';
BEGIN
  WHILE m < DATE '2030-01-01' LOOP
    PERFORM domo_create_monthly_partition('audit_logs', m::TIMESTAMPTZ);
    m := m + INTERVAL '1 month';
  END LOOP;
END;
$$;

INSERT INTO "audit_logs" SELECT * FROM "audit_logs_legacy";

CREATE INDEX "audit_logs_companyId_idx" ON "audit_logs" ("companyId");
CREATE INDEX "audit_logs_companyId_createdAt_idx" ON "audit_logs" ("companyId", "createdAt");

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER audit_logs_partition_before_insert
  BEFORE INSERT ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION domo_audit_logs_partition_trigger();

DROP TABLE "audit_logs_legacy";

-- ─── webhook_deliveries ─────────────────────────────────────────────────────

ALTER TABLE "webhook_deliveries" RENAME TO "webhook_deliveries_legacy";
ALTER TABLE "webhook_deliveries_legacy" RENAME CONSTRAINT "webhook_deliveries_pkey" TO "webhook_deliveries_legacy_pkey";
ALTER TABLE "webhook_deliveries_legacy" RENAME CONSTRAINT "webhook_deliveries_endpointId_fkey" TO "webhook_deliveries_legacy_endpointId_fkey";
ALTER INDEX IF EXISTS "webhook_deliveries_endpointId_createdAt_idx" RENAME TO "webhook_deliveries_legacy_endpointId_createdAt_idx";
ALTER INDEX IF EXISTS "webhook_deliveries_status_createdAt_idx" RENAME TO "webhook_deliveries_legacy_status_createdAt_idx";

CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id", "createdAt")
) PARTITION BY RANGE ("createdAt");

CREATE TABLE "webhook_deliveries_default" PARTITION OF "webhook_deliveries" DEFAULT;

DO $$
DECLARE
  m DATE := DATE '2025-01-01';
BEGIN
  WHILE m < DATE '2030-01-01' LOOP
    PERFORM domo_create_monthly_partition('webhook_deliveries', m::TIMESTAMPTZ);
    m := m + INTERVAL '1 month';
  END LOOP;
END;
$$;

INSERT INTO "webhook_deliveries" SELECT * FROM "webhook_deliveries_legacy";

CREATE INDEX "webhook_deliveries_endpointId_createdAt_idx"
  ON "webhook_deliveries" ("endpointId", "createdAt");

CREATE INDEX "webhook_deliveries_status_createdAt_idx"
  ON "webhook_deliveries" ("status", "createdAt");

ALTER TABLE "webhook_deliveries"
  ADD CONSTRAINT "webhook_deliveries_endpointId_fkey"
  FOREIGN KEY ("endpointId") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TRIGGER webhook_deliveries_partition_before_insert
  BEFORE INSERT ON "webhook_deliveries"
  FOR EACH ROW EXECUTE FUNCTION domo_webhook_deliveries_partition_trigger();

DROP TABLE "webhook_deliveries_legacy";
