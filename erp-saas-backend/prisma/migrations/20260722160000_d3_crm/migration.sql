-- D3 CRM: pipeline, leads, oportunidades y actividades

CREATE TABLE "crm_stages" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_stages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "clientId" TEXT,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_opportunities" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "clientId" TEXT,
    "leadId" TEXT,
    "amount" DECIMAL(14,2),
    "probability" INTEGER NOT NULL DEFAULT 50,
    "expectedCloseDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lostReason" TEXT,
    "quoteId" TEXT,
    "assignedToId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_opportunities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "leadId" TEXT,
    "opportunityId" TEXT,
    "clientId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_stages_companyId_name_key" ON "crm_stages"("companyId", "name");
CREATE INDEX "crm_stages_companyId_sortOrder_idx" ON "crm_stages"("companyId", "sortOrder");

CREATE INDEX "crm_leads_companyId_status_idx" ON "crm_leads"("companyId", "status");

CREATE UNIQUE INDEX "crm_opportunities_quoteId_key" ON "crm_opportunities"("quoteId");
CREATE INDEX "crm_opportunities_companyId_stageId_idx" ON "crm_opportunities"("companyId", "stageId");
CREATE INDEX "crm_opportunities_companyId_status_idx" ON "crm_opportunities"("companyId", "status");

CREATE INDEX "crm_activities_companyId_dueAt_idx" ON "crm_activities"("companyId", "dueAt");
CREATE INDEX "crm_activities_companyId_completedAt_idx" ON "crm_activities"("companyId", "completedAt");

ALTER TABLE "crm_stages" ADD CONSTRAINT "crm_stages_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "crm_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_opportunities" ADD CONSTRAINT "crm_opportunities_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "crm_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
