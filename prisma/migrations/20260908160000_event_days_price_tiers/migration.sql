-- Multi-day event days + category day validity + date-based price tiers
CREATE TABLE IF NOT EXISTS "event_days" (
  "id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "event_days_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "event_days_event_sort_idx" ON "event_days"("event_id", "sort_order");

ALTER TABLE "event_days"
  ADD CONSTRAINT "event_days_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "event_category_days" (
  "category_id" UUID NOT NULL,
  "day_id" UUID NOT NULL,
  CONSTRAINT "event_category_days_pkey" PRIMARY KEY ("category_id", "day_id")
);

ALTER TABLE "event_category_days"
  ADD CONSTRAINT "event_category_days_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_category_days"
  ADD CONSTRAINT "event_category_days_day_id_fkey"
  FOREIGN KEY ("day_id") REFERENCES "event_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "category_price_tiers" (
  "id" UUID NOT NULL,
  "category_id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "price_minor" INTEGER NOT NULL,
  "starts_at" TIMESTAMP(3),
  "ends_at" TIMESTAMP(3),
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "max_quantity" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "category_price_tiers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "category_price_tiers_category_sort_idx"
  ON "category_price_tiers"("category_id", "sort_order");

ALTER TABLE "category_price_tiers"
  ADD CONSTRAINT "category_price_tiers_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "registrations"
  ADD COLUMN IF NOT EXISTS "price_tier_id" UUID;

ALTER TABLE "registrations"
  ADD CONSTRAINT "registrations_price_tier_id_fkey"
  FOREIGN KEY ("price_tier_id") REFERENCES "category_price_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
