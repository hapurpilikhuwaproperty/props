CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'CONTACTED', 'VISIT_SCHEDULED', 'NEGOTIATING', 'CLOSED', 'LOST');
CREATE TYPE "VerificationLevel" AS ENUM ('BASIC', 'REVIEWED', 'VERIFIED');
CREATE TYPE "ListingSource" AS ENUM ('OWNER', 'AGENT', 'BUILDER', 'ADMIN_IMPORT');

ALTER TABLE "Inquiry"
  ADD COLUMN "lastContactedAt" TIMESTAMP(3);

ALTER TABLE "Inquiry"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "InquiryStatus" USING ("status"::text::"InquiryStatus"),
  ALTER COLUMN "status" SET DEFAULT 'OPEN';

ALTER TABLE "Property"
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "listingSource" "ListingSource" NOT NULL DEFAULT 'AGENT',
  ADD COLUMN "qualityScore" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "responseTimeHours" INTEGER,
  ADD COLUMN "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'BASIC',
  ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "RefreshToken"
  RENAME COLUMN "token" TO "tokenHash";

UPDATE "RefreshToken"
SET "tokenHash" = encode(digest("tokenHash", 'sha256'), 'hex');

ALTER INDEX "RefreshToken_token_key"
  RENAME TO "RefreshToken_tokenHash_key";
