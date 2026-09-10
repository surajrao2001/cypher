CREATE TYPE "CheckInChannel" AS ENUM ('SCAN', 'MANUAL', 'CODE');
CREATE TYPE "EventUpdateKind" AS ENUM ('GENERAL', 'LINEUP', 'MEDIA', 'SCHEDULE', 'RULES', 'OTHER');
CREATE TYPE "LineupRole" AS ENUM ('judge', 'choreographer', 'instructor', 'dj', 'emcee', 'guest', 'performer', 'other');

ALTER TABLE "profiles" ADD COLUMN "bio" TEXT;

CREATE TABLE "check_ins" (
  "id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "registration_id" UUID NOT NULL,
  "checked_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checked_in_by_user_id" UUID NOT NULL,
  "channel" "CheckInChannel" NOT NULL DEFAULT 'MANUAL',
  CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_updates" (
  "id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "author_user_id" UUID NOT NULL,
  "kind" "EventUpdateKind" NOT NULL DEFAULT 'GENERAL',
  "title" TEXT,
  "body" TEXT NOT NULL,
  "poster_url" TEXT,
  "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_updates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_lineup_people" (
  "id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "role" "LineupRole" NOT NULL,
  "category_id" UUID,
  "instagram" TEXT,
  "photo_url" TEXT,
  "blurb" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_lineup_people_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "check_ins_registration_id_key" ON "check_ins"("registration_id");
CREATE INDEX "check_ins_event_checked_at_idx" ON "check_ins"("event_id", "checked_in_at");
CREATE INDEX "event_updates_event_published_idx" ON "event_updates"("event_id", "published_at");
CREATE INDEX "event_lineup_event_sort_idx" ON "event_lineup_people"("event_id", "sort_order");

ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_registration_id_fkey"
  FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_checked_in_by_user_id_fkey"
  FOREIGN KEY ("checked_in_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "event_updates" ADD CONSTRAINT "event_updates_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_updates" ADD CONSTRAINT "event_updates_author_user_id_fkey"
  FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "event_lineup_people" ADD CONSTRAINT "event_lineup_people_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_lineup_people" ADD CONSTRAINT "event_lineup_people_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
