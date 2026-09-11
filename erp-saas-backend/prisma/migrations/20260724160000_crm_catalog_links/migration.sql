ALTER TABLE "crm_leads" ADD COLUMN IF NOT EXISTS "statusId" TEXT;
CREATE INDEX IF NOT EXISTS "crm_leads_companyId_statusId_idx" ON "crm_leads"("companyId", "statusId");

ALTER TABLE "crm_activities" ADD COLUMN IF NOT EXISTS "taskTypeId" TEXT;
ALTER TABLE "crm_activities" ADD COLUMN IF NOT EXISTS "subjectCatalogId" TEXT;
ALTER TABLE "crm_activities" ADD COLUMN IF NOT EXISTS "situationId" TEXT;
ALTER TABLE "crm_activities" ADD COLUMN IF NOT EXISTS "agendaClassificationId" TEXT;

DO $$ BEGIN
  ALTER TABLE "crm_leads"
    ADD CONSTRAINT "crm_leads_statusId_fkey"
    FOREIGN KEY ("statusId") REFERENCES "crm_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_activities"
    ADD CONSTRAINT "crm_activities_taskTypeId_fkey"
    FOREIGN KEY ("taskTypeId") REFERENCES "crm_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_activities"
    ADD CONSTRAINT "crm_activities_subjectCatalogId_fkey"
    FOREIGN KEY ("subjectCatalogId") REFERENCES "crm_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_activities"
    ADD CONSTRAINT "crm_activities_situationId_fkey"
    FOREIGN KEY ("situationId") REFERENCES "crm_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_activities"
    ADD CONSTRAINT "crm_activities_agendaClassificationId_fkey"
    FOREIGN KEY ("agendaClassificationId") REFERENCES "crm_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
