-- Add notes column to visitors table
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "notes" TEXT;
