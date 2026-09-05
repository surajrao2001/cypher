-- Canonical Cypher User + AuthIdentity (Supabase owns auth; Cypher owns the user).

CREATE TYPE "AuthProvider" AS ENUM ('SUPABASE', 'CLERK', 'GOOGLE', 'APPLE');

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_identities_provider_user_uidx" ON "auth_identities"("provider", "provider_user_id");
CREATE INDEX "auth_identities_user_id_idx" ON "auth_identities"("user_id");

ALTER TABLE "auth_identities"
  ADD CONSTRAINT "auth_identities_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Map each existing profile (Supabase id) → new Cypher user id
CREATE TEMP TABLE "_user_id_map" AS
SELECT "id" AS old_id, gen_random_uuid() AS new_id FROM "profiles";

INSERT INTO "users" ("id", "created_at", "updated_at")
SELECT new_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM "_user_id_map";

INSERT INTO "auth_identities" ("id", "user_id", "provider", "provider_user_id", "created_at", "updated_at")
SELECT gen_random_uuid(), new_id, 'SUPABASE'::"AuthProvider", old_id::text, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "_user_id_map";

-- Drop FKs that currently point at profiles.id
ALTER TABLE "organizers" DROP CONSTRAINT IF EXISTS "organizers_created_by_fkey";
ALTER TABLE "organizer_members" DROP CONSTRAINT IF EXISTS "organizer_members_user_id_fkey";
ALTER TABLE "registrations" DROP CONSTRAINT IF EXISTS "registrations_user_id_fkey";
ALTER TABLE "registration_participants" DROP CONSTRAINT IF EXISTS "registration_participants_user_id_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_user_id_fkey";
ALTER TABLE "profile_dance_styles" DROP CONSTRAINT IF EXISTS "profile_dance_styles_profile_id_fkey";

-- Remap domain FKs to Cypher user ids
UPDATE "organizers" o
SET "created_by" = m.new_id
FROM "_user_id_map" m
WHERE o."created_by" = m.old_id;

UPDATE "organizer_members" om
SET "user_id" = m.new_id
FROM "_user_id_map" m
WHERE om."user_id" = m.old_id;

UPDATE "registrations" r
SET "user_id" = m.new_id
FROM "_user_id_map" m
WHERE r."user_id" = m.old_id;

UPDATE "registration_participants" rp
SET "user_id" = m.new_id
FROM "_user_id_map" m
WHERE rp."user_id" = m.old_id;

UPDATE "audit_logs" a
SET "actor_user_id" = m.new_id
FROM "_user_id_map" m
WHERE a."actor_user_id" = m.old_id;

UPDATE "profile_dance_styles" pds
SET "profile_id" = m.new_id
FROM "_user_id_map" m
WHERE pds."profile_id" = m.old_id;

-- Rebuild profiles around user_id PK
ALTER TABLE "profiles" ADD COLUMN "user_id" UUID;

UPDATE "profiles" p
SET "user_id" = m.new_id
FROM "_user_id_map" m
WHERE p."id" = m.old_id;

ALTER TABLE "profiles" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_pkey";
ALTER TABLE "profiles" DROP COLUMN "id";
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");

ALTER TABLE "profiles"
  ADD CONSTRAINT "profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Re-point domain FKs to users
ALTER TABLE "organizers"
  ADD CONSTRAINT "organizers_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "organizer_members"
  ADD CONSTRAINT "organizer_members_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "registrations"
  ADD CONSTRAINT "registrations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registration_participants"
  ADD CONSTRAINT "registration_participants_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_user_id_fkey"
  FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "profile_dance_styles"
  ADD CONSTRAINT "profile_dance_styles_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE "_user_id_map";
