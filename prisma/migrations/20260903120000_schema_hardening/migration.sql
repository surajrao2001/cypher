-- Schema hardening from DB review (do-now items).
-- Styles normalized; enums; indexes; CHECKs; GiST; timestamps; webhook idempotency.

-- 1) Enums
CREATE TYPE "EventType" AS ENUM (
  'battle',
  'workshop',
  'jam',
  'showcase',
  'cypher',
  'session',
  'camp',
  'audition',
  'competition',
  'other'
);

CREATE TYPE "RegistrationPaymentStatus" AS ENUM (
  'not_started',
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE "PaymentProvider" AS ENUM ('razorpay');

CREATE TYPE "PaymentOrderStatus" AS ENUM (
  'created',
  'attempted',
  'paid',
  'failed',
  'cancelled',
  'refunded'
);

CREATE TYPE "PaymentRecordStatus" AS ENUM (
  'authorized',
  'captured',
  'failed',
  'refunded',
  'partially_refunded'
);

CREATE TYPE "WebhookProcessingStatus" AS ENUM (
  'received',
  'processing',
  'processed',
  'failed'
);

CREATE TYPE "VideoVisibility" AS ENUM (
  'public',
  'registered_only',
  'private'
);

-- 2) Dance styles
CREATE TABLE "dance_styles" (
  "id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dance_styles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "dance_styles_slug_key" ON "dance_styles"("slug");
CREATE UNIQUE INDEX "dance_styles_name_key" ON "dance_styles"("name");

CREATE TABLE "profile_dance_styles" (
  "profile_id" UUID NOT NULL,
  "style_id" UUID NOT NULL,
  CONSTRAINT "profile_dance_styles_pkey" PRIMARY KEY ("profile_id", "style_id")
);

CREATE TABLE "event_dance_styles" (
  "event_id" UUID NOT NULL,
  "style_id" UUID NOT NULL,
  CONSTRAINT "event_dance_styles_pkey" PRIMARY KEY ("event_id", "style_id")
);

-- Seed canonical styles used by the product + any existing free-text values
INSERT INTO "dance_styles" ("id", "slug", "name")
VALUES
  (gen_random_uuid(), 'breaking', 'Breaking'),
  (gen_random_uuid(), 'hip-hop', 'Hip Hop'),
  (gen_random_uuid(), 'house', 'House'),
  (gen_random_uuid(), 'popping', 'Popping'),
  (gen_random_uuid(), 'locking', 'Locking'),
  (gen_random_uuid(), 'waacking', 'Waacking'),
  (gen_random_uuid(), 'krump', 'Krump'),
  (gen_random_uuid(), 'open', 'Open')
ON CONFLICT DO NOTHING;

-- Capture leftover distinct style strings from profiles/events
WITH raw_styles AS (
  SELECT DISTINCT trim(s) AS name
  FROM (
    SELECT unnest(COALESCE("styles", ARRAY[]::TEXT[])) AS s FROM "profiles"
    UNION ALL
    SELECT unnest(COALESCE("styles", ARRAY[]::TEXT[])) AS s FROM "events"
  ) src
  WHERE trim(s) <> ''
),
normalized AS (
  SELECT
    name,
    trim(both '-' FROM lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))) AS slug
  FROM raw_styles
)
INSERT INTO "dance_styles" ("id", "slug", "name")
SELECT gen_random_uuid(), n.slug, n.name
FROM normalized n
WHERE n.slug <> ''
  AND NOT EXISTS (SELECT 1 FROM "dance_styles" ds WHERE ds.slug = n.slug OR lower(ds.name) = lower(n.name));

INSERT INTO "profile_dance_styles" ("profile_id", "style_id")
SELECT DISTINCT p.id, ds.id
FROM "profiles" p
CROSS JOIN LATERAL unnest(COALESCE(p."styles", ARRAY[]::TEXT[])) AS style_name(name)
JOIN "dance_styles" ds
  ON lower(ds.name) = lower(trim(style_name.name))
  OR ds.slug = trim(both '-' FROM lower(regexp_replace(trim(style_name.name), '[^a-zA-Z0-9]+', '-', 'g')))
WHERE trim(style_name.name) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO "event_dance_styles" ("event_id", "style_id")
SELECT DISTINCT e.id, ds.id
FROM "events" e
CROSS JOIN LATERAL unnest(COALESCE(e."styles", ARRAY[]::TEXT[])) AS style_name(name)
JOIN "dance_styles" ds
  ON lower(ds.name) = lower(trim(style_name.name))
  OR ds.slug = trim(both '-' FROM lower(regexp_replace(trim(style_name.name), '[^a-zA-Z0-9]+', '-', 'g')))
WHERE trim(style_name.name) <> ''
ON CONFLICT DO NOTHING;

ALTER TABLE "profile_dance_styles"
  ADD CONSTRAINT "profile_dance_styles_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profile_dance_styles"
  ADD CONSTRAINT "profile_dance_styles_style_id_fkey"
  FOREIGN KEY ("style_id") REFERENCES "dance_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_dance_styles"
  ADD CONSTRAINT "event_dance_styles_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_dance_styles"
  ADD CONSTRAINT "event_dance_styles_style_id_fkey"
  FOREIGN KEY ("style_id") REFERENCES "dance_styles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profiles" DROP COLUMN "styles";
ALTER TABLE "events" DROP COLUMN "styles";

-- 3) Event type enum
ALTER TABLE "events"
  ALTER COLUMN "event_type" DROP DEFAULT;

ALTER TABLE "events"
  ALTER COLUMN "event_type" TYPE "EventType"
  USING (
    CASE lower(trim("event_type"))
      WHEN 'battle' THEN 'battle'::"EventType"
      WHEN 'workshop' THEN 'workshop'::"EventType"
      WHEN 'jam' THEN 'jam'::"EventType"
      WHEN 'showcase' THEN 'showcase'::"EventType"
      WHEN 'cypher' THEN 'cypher'::"EventType"
      WHEN 'session' THEN 'session'::"EventType"
      WHEN 'camp' THEN 'camp'::"EventType"
      WHEN 'audition' THEN 'audition'::"EventType"
      WHEN 'competition' THEN 'competition'::"EventType"
      ELSE 'other'::"EventType"
    END
  );

ALTER TABLE "events"
  ALTER COLUMN "event_type" SET DEFAULT 'battle'::"EventType";

-- 4) Registration payment status enum (replace PaymentStatus on registrations)
ALTER TABLE "registrations"
  ALTER COLUMN "payment_status" DROP DEFAULT;

ALTER TABLE "registrations"
  ALTER COLUMN "payment_status" TYPE "RegistrationPaymentStatus"
  USING (
    CASE "payment_status"::text
      WHEN 'pending' THEN 'pending'::"RegistrationPaymentStatus"
      WHEN 'paid' THEN 'paid'::"RegistrationPaymentStatus"
      WHEN 'failed' THEN 'failed'::"RegistrationPaymentStatus"
      WHEN 'refunded' THEN 'refunded'::"RegistrationPaymentStatus"
      ELSE 'pending'::"RegistrationPaymentStatus"
    END
  );

ALTER TABLE "registrations"
  ALTER COLUMN "payment_status" SET DEFAULT 'pending'::"RegistrationPaymentStatus";

DROP TYPE "PaymentStatus";

-- 5) Registration currency + updated_at
ALTER TABLE "registrations"
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';

ALTER TABLE "registrations"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 6) Participant phone + timestamps
ALTER TABLE "registration_participants"
  ADD COLUMN IF NOT EXISTS "phone_number" TEXT;

ALTER TABLE "registration_participants"
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "registration_participants"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 7) Event category timestamps + CHECKs
ALTER TABLE "event_categories"
  ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "event_categories"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "event_categories"
  ADD CONSTRAINT "event_categories_capacity_positive_chk" CHECK ("capacity" > 0);

ALTER TABLE "event_categories"
  ADD CONSTRAINT "event_categories_team_size_positive_chk" CHECK ("team_size" > 0);

ALTER TABLE "event_categories"
  ADD CONSTRAINT "event_categories_price_nonneg_chk" CHECK ("price_minor" >= 0);

ALTER TABLE "event_categories"
  ADD CONSTRAINT "event_categories_reserved_nonneg_chk" CHECK ("reserved_count" >= 0);

ALTER TABLE "event_categories"
  ADD CONSTRAINT "event_categories_confirmed_nonneg_chk" CHECK ("confirmed_count" >= 0);

ALTER TABLE "event_categories"
  ADD CONSTRAINT "event_categories_capacity_invariant_chk"
  CHECK ("reserved_count" + "confirmed_count" <= "capacity");

-- 8) Payment order provider/status enums
ALTER TABLE "payment_orders"
  ALTER COLUMN "provider" DROP DEFAULT;

ALTER TABLE "payment_orders"
  ALTER COLUMN "provider" TYPE "PaymentProvider"
  USING (
    CASE lower(trim("provider"))
      WHEN 'razorpay' THEN 'razorpay'::"PaymentProvider"
      ELSE 'razorpay'::"PaymentProvider"
    END
  );

ALTER TABLE "payment_orders"
  ALTER COLUMN "provider" SET DEFAULT 'razorpay'::"PaymentProvider";

ALTER TABLE "payment_orders"
  ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "payment_orders"
  ALTER COLUMN "status" TYPE "PaymentOrderStatus"
  USING (
    CASE lower(trim("status"))
      WHEN 'created' THEN 'created'::"PaymentOrderStatus"
      WHEN 'attempted' THEN 'attempted'::"PaymentOrderStatus"
      WHEN 'paid' THEN 'paid'::"PaymentOrderStatus"
      WHEN 'failed' THEN 'failed'::"PaymentOrderStatus"
      WHEN 'cancelled' THEN 'cancelled'::"PaymentOrderStatus"
      WHEN 'refunded' THEN 'refunded'::"PaymentOrderStatus"
      ELSE 'created'::"PaymentOrderStatus"
    END
  );

ALTER TABLE "payment_orders"
  ALTER COLUMN "status" SET DEFAULT 'created'::"PaymentOrderStatus";

-- 9) Payment record status + timestamps
ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "captured_at" TIMESTAMP(3);

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "payments"
  ALTER COLUMN "status" TYPE "PaymentRecordStatus"
  USING (
    CASE lower(trim("status"))
      WHEN 'authorized' THEN 'authorized'::"PaymentRecordStatus"
      WHEN 'captured' THEN 'captured'::"PaymentRecordStatus"
      WHEN 'paid' THEN 'captured'::"PaymentRecordStatus"
      WHEN 'failed' THEN 'failed'::"PaymentRecordStatus"
      WHEN 'refunded' THEN 'refunded'::"PaymentRecordStatus"
      WHEN 'partially_refunded' THEN 'partially_refunded'::"PaymentRecordStatus"
      ELSE 'failed'::"PaymentRecordStatus"
    END
  );

-- 10) Webhook provider-event idempotency
ALTER TABLE "payment_webhook_events"
  ADD COLUMN IF NOT EXISTS "provider" "PaymentProvider" NOT NULL DEFAULT 'razorpay';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_webhook_events' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE "payment_webhook_events" RENAME COLUMN "idempotency_key" TO "provider_event_id";
  END IF;
END $$;

ALTER TABLE "payment_webhook_events"
  DROP CONSTRAINT IF EXISTS "payment_webhook_events_idempotency_key_key";

ALTER TABLE "payment_webhook_events"
  ALTER COLUMN "processing_status" DROP DEFAULT;

ALTER TABLE "payment_webhook_events"
  ALTER COLUMN "processing_status" TYPE "WebhookProcessingStatus"
  USING (
    CASE lower(trim("processing_status"))
      WHEN 'received' THEN 'received'::"WebhookProcessingStatus"
      WHEN 'processing' THEN 'processing'::"WebhookProcessingStatus"
      WHEN 'processed' THEN 'processed'::"WebhookProcessingStatus"
      WHEN 'failed' THEN 'failed'::"WebhookProcessingStatus"
      ELSE 'received'::"WebhookProcessingStatus"
    END
  );

ALTER TABLE "payment_webhook_events"
  ALTER COLUMN "processing_status" SET DEFAULT 'received'::"WebhookProcessingStatus";

CREATE UNIQUE INDEX IF NOT EXISTS "payment_webhook_events_provider_event_uidx"
  ON "payment_webhook_events"("provider", "provider_event_id");

CREATE INDEX IF NOT EXISTS "payment_webhook_events_status_received_idx"
  ON "payment_webhook_events"("processing_status", "received_at");

-- 11) Video visibility + timestamps
ALTER TABLE "videos"
  ADD COLUMN IF NOT EXISTS "visibility" "VideoVisibility" NOT NULL DEFAULT 'public';

ALTER TABLE "videos"
  ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);

ALTER TABLE "videos"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 12) Audit log extras + indexes
ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "request_id" TEXT;

ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "ip_address" TEXT;

CREATE INDEX IF NOT EXISTS "audit_logs_entity_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_actor_created_idx" ON "audit_logs"("actor_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_logs_created_idx" ON "audit_logs"("created_at");

-- 13) Query indexes
CREATE INDEX IF NOT EXISTS "events_organizer_start_idx" ON "events"("organizer_id", "start_time");
CREATE INDEX IF NOT EXISTS "event_categories_event_id_idx" ON "event_categories"("event_id");
CREATE INDEX IF NOT EXISTS "organizer_members_user_id_idx" ON "organizer_members"("user_id");
CREATE INDEX IF NOT EXISTS "registrations_user_created_idx" ON "registrations"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "registrations_event_status_idx" ON "registrations"("event_id", "registration_status");
CREATE INDEX IF NOT EXISTS "registrations_category_status_idx" ON "registrations"("category_id", "registration_status");
CREATE INDEX IF NOT EXISTS "registrations_reservation_expires_idx" ON "registrations"("reservation_expires_at");
CREATE INDEX IF NOT EXISTS "payment_orders_registration_id_idx" ON "payment_orders"("registration_id");
CREATE INDEX IF NOT EXISTS "payments_payment_order_id_idx" ON "payments"("payment_order_id");

-- 14) PostGIS GiST index for nearby discovery
CREATE INDEX IF NOT EXISTS "events_location_gist" ON "events" USING GIST ("location");

-- 15) Drop unused PostGIS-related extensions (keep core postgis)
DROP EXTENSION IF EXISTS "postgis_tiger_geocoder";
DROP EXTENSION IF EXISTS "postgis_topology";
DROP EXTENSION IF EXISTS "fuzzystrmatch";
