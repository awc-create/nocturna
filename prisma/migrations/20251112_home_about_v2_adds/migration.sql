-- About v2 additions (robust for either HomeAbout or legacy AboutUs)
-- - Adds: blurb, videoUrl, videoPoster, videoCaption, values (JSONB)
-- - Keeps existing quickFacts as-is (adds it on AboutUs if missing)
-- - Backfills blurb from lead where empty
-- - Ensures unique index on key exists

DO $$
BEGIN
  -- === Path A: Current table ===
  IF to_regclass('public."HomeAbout"') IS NOT NULL THEN
    ALTER TABLE "HomeAbout"
      ADD COLUMN IF NOT EXISTS "blurb"        TEXT,
      ADD COLUMN IF NOT EXISTS "videoUrl"     TEXT,
      ADD COLUMN IF NOT EXISTS "videoPoster"  TEXT,
      ADD COLUMN IF NOT EXISTS "videoCaption" TEXT,
      ADD COLUMN IF NOT EXISTS "values"       JSONB NOT NULL DEFAULT '[]'::jsonb;

    -- Backfill blurb from legacy lead if present
    UPDATE "HomeAbout"
    SET "blurb" = COALESCE(NULLIF("blurb", ''), "lead")
    WHERE "lead" IS NOT NULL
      AND ("blurb" IS NULL OR "blurb" = '');

    -- Keep old and new admin happy: ensure unique key index exists
    CREATE UNIQUE INDEX IF NOT EXISTS "HomeAbout_key_key" ON "HomeAbout"("key");

  -- === Path B: Legacy table (if project still uses AboutUs) ===
  ELSIF to_regclass('public."AboutUs"') IS NOT NULL THEN
    ALTER TABLE "AboutUs"
      ADD COLUMN IF NOT EXISTS "blurb"        TEXT,
      ADD COLUMN IF NOT EXISTS "videoUrl"     TEXT,
      ADD COLUMN IF NOT EXISTS "videoPoster"  TEXT,
      ADD COLUMN IF NOT EXISTS "videoCaption" TEXT,
      ADD COLUMN IF NOT EXISTS "quickFacts"   JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS "values"       JSONB NOT NULL DEFAULT '[]'::jsonb;

    -- Backfill blurb from lead if present
    UPDATE "AboutUs"
    SET "blurb" = COALESCE(NULLIF("blurb", ''), "lead")
    WHERE "lead" IS NOT NULL
      AND ("blurb" IS NULL OR "blurb" = '');

    CREATE UNIQUE INDEX IF NOT EXISTS "AboutUs_key_key" ON "AboutUs"("key");
  END IF;
END
$$;
