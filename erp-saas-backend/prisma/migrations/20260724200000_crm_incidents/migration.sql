CREATE TABLE IF NOT EXISTS "crm_incidents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "typeId" TEXT,
    "clientId" TEXT,
    "leadId" TEXT,
    "opportunityId" TEXT,
    "assignedToId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_incidents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_incidents_companyId_status_idx" ON "crm_incidents"("companyId", "status");
CREATE INDEX IF NOT EXISTS "crm_incidents_companyId_priority_idx" ON "crm_incidents"("companyId", "priority");

ALTER TABLE "crm_incidents" ADD CONSTRAINT "crm_incidents_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_incidents" ADD CONSTRAINT "crm_incidents_typeId_fkey"
  FOREIGN KEY ("typeId") REFERENCES "crm_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_incidents" ADD CONSTRAINT "crm_incidents_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_incidents" ADD CONSTRAINT "crm_incidents_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_incidents" ADD CONSTRAINT "crm_incidents_opportunityId_fkey"
  FOREIGN KEY ("opportunityId") REFERENCES "crm_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_incidents" ADD CONSTRAINT "crm_incidents_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
