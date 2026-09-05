-- PostGIS image already enables these; IF NOT EXISTS avoids reset-on-drift.
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "postgis_topology";
CREATE EXTENSION IF NOT EXISTS "postgis_tiger_geocoder";

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "PlatformRole" AS ENUM ('user', 'admin');
CREATE TYPE "ProfileStatus" AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE "OrganizerVerificationStatus" AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE "OrganizerMemberRole" AS ENUM ('owner', 'manager', 'editor');
CREATE TYPE "EventStatus" AS ENUM ('draft', 'published', 'registration_closed', 'completed', 'cancelled');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'refunded', 'failed');
CREATE TYPE "RegistrationStatus" AS ENUM ('pending_payment', 'confirmed', 'waitlist', 'expired', 'cancelled', 'refunded');

CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "dancer_name" TEXT,
    "city" TEXT,
    "crew" TEXT,
    "styles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "instagram" TEXT,
    "avatar_url" TEXT,
    "platform_role" "PlatformRole" NOT NULL DEFAULT 'user',
    "status" "ProfileStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organizers" (
    "id" UUID NOT NULL,
    "org_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT,
    "verification_status" "OrganizerVerificationStatus" NOT NULL DEFAULT 'pending',
    "bio" TEXT,
    "banner_url" TEXT,
    "logo_url" TEXT,
    "instagram" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "organizer_members" (
    "organizer_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "OrganizerMemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizer_members_pkey" PRIMARY KEY ("organizer_id","user_id")
);

CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "organizer_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL DEFAULT 'battle',
    "city" TEXT NOT NULL,
    "venue" TEXT,
    "location" geography(Point, 4326),
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "registration_opens_at" TIMESTAMP(3),
    "registration_closes_at" TIMESTAMP(3),
    "poster_url" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_categories" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_minor" INTEGER NOT NULL DEFAULT 0,
    "capacity" INTEGER NOT NULL,
    "reserved_count" INTEGER NOT NULL DEFAULT 0,
    "confirmed_count" INTEGER NOT NULL DEFAULT 0,
    "team_size" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "event_categories_reserved_nonneg" CHECK ("reserved_count" >= 0),
    CONSTRAINT "event_categories_confirmed_nonneg" CHECK ("confirmed_count" >= 0),
    CONSTRAINT "event_categories_capacity_bound" CHECK ("reserved_count" + "confirmed_count" <= "capacity")
);

CREATE TABLE "registrations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "registration_status" "RegistrationStatus" NOT NULL DEFAULT 'pending_payment',
    "reservation_expires_at" TIMESTAMP(3),
    "total_amount_minor" INTEGER NOT NULL,
    "registration_code" TEXT NOT NULL,
    "ticket_qr_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "registration_participants" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "user_id" UUID,
    "display_name" TEXT NOT NULL,
    "dancer_name" TEXT,
    "email" TEXT,
    "is_team_captain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "registration_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_orders" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'razorpay',
    "provider_order_id" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'created',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "payment_order_id" UUID NOT NULL,
    "provider_payment_id" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "method" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processing_status" TEXT NOT NULL DEFAULT 'received',
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "videos" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "category_id" UUID,
    "round" TEXT,
    "title" TEXT NOT NULL,
    "youtube_id" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizers_slug_key" ON "organizers"("slug");
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");
CREATE INDEX "events_status_start_idx" ON "events"("status", "start_time");
CREATE INDEX "events_city_start_idx" ON "events"("city", "start_time");
CREATE INDEX "events_location_idx" ON "events" USING GIST ("location");
CREATE UNIQUE INDEX "registrations_registration_code_key" ON "registrations"("registration_code");
CREATE UNIQUE INDEX "registrations_ticket_qr_token_key" ON "registrations"("ticket_qr_token");
CREATE UNIQUE INDEX "registrations_user_id_category_id_key" ON "registrations"("user_id", "category_id");
CREATE UNIQUE INDEX "payment_orders_provider_order_id_key" ON "payment_orders"("provider_order_id");
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");
CREATE UNIQUE INDEX "payment_webhook_events_idempotency_key_key" ON "payment_webhook_events"("idempotency_key");

ALTER TABLE "organizers" ADD CONSTRAINT "organizers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organizer_members" ADD CONSTRAINT "organizer_members_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organizer_members" ADD CONSTRAINT "organizer_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_categories" ADD CONSTRAINT "event_categories_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "registration_participants" ADD CONSTRAINT "registration_participants_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "registration_participants" ADD CONSTRAINT "registration_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_order_id_fkey" FOREIGN KEY ("payment_order_id") REFERENCES "payment_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "videos" ADD CONSTRAINT "videos_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "videos" ADD CONSTRAINT "videos_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
