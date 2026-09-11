-- C1: Plans, subscription fields, onboarding flag

CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxUsers" INTEGER NOT NULL,
    "maxDocuments" INTEGER,
    "features" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

ALTER TABLE "companies" ADD COLUMN "planId" TEXT;
ALTER TABLE "companies" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "companies" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "companies" ADD CONSTRAINT "companies_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
