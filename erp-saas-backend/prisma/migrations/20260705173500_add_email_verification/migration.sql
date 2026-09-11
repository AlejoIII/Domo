-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "verificationToken" TEXT;
ALTER TABLE "users" ADD COLUMN "verificationTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_verificationToken_key" ON "users"("verificationToken");
