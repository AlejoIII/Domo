-- C2: Stripe billing fields

ALTER TABLE "companies" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "companies" ADD COLUMN "stripeSubscriptionId" TEXT;

CREATE UNIQUE INDEX "companies_stripeCustomerId_key" ON "companies"("stripeCustomerId");

ALTER TABLE "plans" ADD COLUMN "stripePriceId" TEXT;
