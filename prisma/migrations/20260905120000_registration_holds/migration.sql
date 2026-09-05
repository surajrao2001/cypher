-- Organizer type, category entry rules, registration entry name, active-only uniqueness.

CREATE TYPE "OrganizerType" AS ENUM (
  'independent',
  'collective',
  'college',
  'studio',
  'community',
  'other'
);

CREATE TYPE "CategoryEntryType" AS ENUM ('solo', 'team');

ALTER TABLE "organizers"
  ADD COLUMN "type" "OrganizerType" NOT NULL DEFAULT 'independent';

ALTER TABLE "event_categories"
  ADD COLUMN "entry_type" "CategoryEntryType" NOT NULL DEFAULT 'solo',
  ADD COLUMN "min_team_size" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "max_team_size" INTEGER NOT NULL DEFAULT 1;

UPDATE "event_categories"
SET
  "min_team_size" = GREATEST(1, "team_size"),
  "max_team_size" = GREATEST(1, "team_size"),
  "entry_type" = CASE WHEN "team_size" > 1 THEN 'team'::"CategoryEntryType" ELSE 'solo'::"CategoryEntryType" END;

ALTER TABLE "event_categories" DROP COLUMN "team_size";

ALTER TABLE "event_categories"
  ADD CONSTRAINT "event_categories_team_size_chk"
  CHECK ("min_team_size" >= 1 AND "max_team_size" >= "min_team_size" AND "max_team_size" <= 50);

ALTER TABLE "registrations"
  ADD COLUMN "entry_name" TEXT;

ALTER TABLE "registrations"
  ALTER COLUMN "payment_status" SET DEFAULT 'not_started';

DROP INDEX IF EXISTS "registrations_user_id_category_id_key";

CREATE INDEX "registrations_user_category_idx" ON "registrations"("user_id", "category_id");

CREATE UNIQUE INDEX "registrations_active_user_category_uidx"
  ON "registrations"("user_id", "category_id")
  WHERE "registration_status" IN ('pending_payment', 'confirmed', 'waitlist');
