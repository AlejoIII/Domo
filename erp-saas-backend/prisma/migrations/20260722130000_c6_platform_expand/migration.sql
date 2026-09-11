ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "platformNotes" TEXT;

CREATE TABLE IF NOT EXISTS "platform_audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "platform_audit_logs_createdAt_idx" ON "platform_audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "platform_audit_logs_actorUserId_idx" ON "platform_audit_logs"("actorUserId");

CREATE TABLE IF NOT EXISTS "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "platform_settings" ("id", "maintenanceMode", "updatedAt")
VALUES ('global', false, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
