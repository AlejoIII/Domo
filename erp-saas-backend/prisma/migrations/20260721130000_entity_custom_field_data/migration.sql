CREATE TABLE "entity_custom_field_data" (
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "values" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entity_custom_field_data_pkey" PRIMARY KEY ("entityType","entityId")
);

CREATE INDEX "entity_custom_field_data_companyId_entityType_idx" ON "entity_custom_field_data"("companyId", "entityType");

ALTER TABLE "entity_custom_field_data" ADD CONSTRAINT "entity_custom_field_data_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
