-- AlterTable
ALTER TABLE "companies" ADD COLUMN "betaCohort" TEXT;

-- AlterTable
ALTER TABLE "platform_settings" ADD COLUMN "registrationMode" TEXT NOT NULL DEFAULT 'open';
ALTER TABLE "platform_settings" ADD COLUMN "betaSignupCap" INTEGER;

-- CreateTable
CREATE TABLE "beta_invites" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "label" TEXT NOT NULL DEFAULT 'beta-2026',
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beta_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beta_feedback" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER,
    "message" TEXT NOT NULL,
    "page" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beta_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beta_invites_token_key" ON "beta_invites"("token");

-- CreateIndex
CREATE INDEX "beta_invites_token_idx" ON "beta_invites"("token");

-- CreateIndex
CREATE INDEX "beta_feedback_companyId_idx" ON "beta_feedback"("companyId");

-- CreateIndex
CREATE INDEX "beta_feedback_createdAt_idx" ON "beta_feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "beta_invites" ADD CONSTRAINT "beta_invites_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beta_feedback" ADD CONSTRAINT "beta_feedback_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
