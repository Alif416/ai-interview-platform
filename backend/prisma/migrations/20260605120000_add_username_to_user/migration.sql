-- Add username column with a temporary default, then remove the default
ALTER TABLE "User" ADD COLUMN "username" TEXT NOT NULL DEFAULT '';

-- Backfill: generate a unique username from email prefix for existing rows
UPDATE "User" SET "username" = LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9_]', '_', 'g')) || '_' || id::TEXT;

-- Add unique constraint
ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");

-- Remove the default so future inserts must supply a value
ALTER TABLE "User" ALTER COLUMN "username" DROP DEFAULT;
