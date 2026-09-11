CREATE TABLE "form_layouts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "form_layouts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "form_layouts_companyId_entityId_key" ON "form_layouts"("companyId", "entityId");

ALTER TABLE "form_layouts" ADD CONSTRAINT "form_layouts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
