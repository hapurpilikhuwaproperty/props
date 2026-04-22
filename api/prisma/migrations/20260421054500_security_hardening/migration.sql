-- Allow generic inquiries without a property relation.
ALTER TABLE "Inquiry" ALTER COLUMN "propertyId" DROP NOT NULL;

-- Track OTP verification failures so codes can be invalidated after repeated guesses.
ALTER TABLE "OtpCode" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

-- Preserve existing reset tokens while switching storage semantics to token hashes.
ALTER TABLE "PasswordReset" RENAME COLUMN "token" TO "tokenHash";
ALTER INDEX "PasswordReset_token_key" RENAME TO "PasswordReset_tokenHash_key";
