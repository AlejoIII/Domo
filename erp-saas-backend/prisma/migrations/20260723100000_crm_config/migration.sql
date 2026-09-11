-- CRM configuration catalogs, templates and integrations

CREATE TABLE IF NOT EXISTS "crm_catalog_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_email_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_email_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_sms_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_sms_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_email_settings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fromName" TEXT,
    "fromEmail" TEXT,
    "replyTo" TEXT,
    "signatureHtml" TEXT,
    "copyTo" TEXT,
    "defaultEmailTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_email_settings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "crm_acrelia_accounts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT,
    "senderId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_acrelia_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "crm_catalog_items_companyId_category_name_key"
  ON "crm_catalog_items"("companyId", "category", "name");
CREATE INDEX IF NOT EXISTS "crm_catalog_items_companyId_category_sortOrder_idx"
  ON "crm_catalog_items"("companyId", "category", "sortOrder");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_email_templates_companyId_name_key"
  ON "crm_email_templates"("companyId", "name");
CREATE INDEX IF NOT EXISTS "crm_email_templates_companyId_isActive_idx"
  ON "crm_email_templates"("companyId", "isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_sms_templates_companyId_name_key"
  ON "crm_sms_templates"("companyId", "name");
CREATE INDEX IF NOT EXISTS "crm_sms_templates_companyId_isActive_idx"
  ON "crm_sms_templates"("companyId", "isActive");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_email_settings_companyId_key"
  ON "crm_email_settings"("companyId");

CREATE UNIQUE INDEX IF NOT EXISTS "crm_acrelia_accounts_companyId_name_key"
  ON "crm_acrelia_accounts"("companyId", "name");
CREATE INDEX IF NOT EXISTS "crm_acrelia_accounts_companyId_isActive_idx"
  ON "crm_acrelia_accounts"("companyId", "isActive");

DO $$ BEGIN
  ALTER TABLE "crm_catalog_items"
    ADD CONSTRAINT "crm_catalog_items_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_email_templates"
    ADD CONSTRAINT "crm_email_templates_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_sms_templates"
    ADD CONSTRAINT "crm_sms_templates_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_email_settings"
    ADD CONSTRAINT "crm_email_settings_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "crm_acrelia_accounts"
    ADD CONSTRAINT "crm_acrelia_accounts_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
