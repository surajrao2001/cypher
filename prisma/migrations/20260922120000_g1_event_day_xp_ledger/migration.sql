-- G1 Event Day Foundation: EventDayConfig + append-only XpTransaction ledger.
-- Additive only. No backfill. Existing events get effective defaults until PATCH upsert.

CREATE TYPE "EventOpsStatus" AS ENUM (
  'scheduled',
  'check_in_open',
  'check_in_closed',
  'event_live',
  'completed'
);

CREATE TYPE "XpRewardScope" AS ENUM ('EVENT', 'CATEGORY', 'TOURNAMENT');

CREATE TYPE "XpSourceType" AS ENUM ('check_in');

CREATE TABLE "event_day_configs" (
  "id" UUID NOT NULL,
  "event_id" UUID NOT NULL,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "check_in_opens_at" TIMESTAMP(3),
  "check_in_closes_at" TIMESTAMP(3),
  "early_check_in_ends_at" TIMESTAMP(3),
  "ops_status" "EventOpsStatus" NOT NULL DEFAULT 'scheduled',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "event_day_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_day_configs_event_id_key" ON "event_day_configs"("event_id");

ALTER TABLE "event_day_configs"
  ADD CONSTRAINT "event_day_configs_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "xp_transactions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "amount" INTEGER NOT NULL,
  "rule_key" TEXT NOT NULL,
  "rule_version" INTEGER NOT NULL DEFAULT 1,
  "scope" "XpRewardScope" NOT NULL,
  "event_id" UUID,
  "category_id" UUID,
  "source_type" "XpSourceType" NOT NULL,
  "source_id" UUID NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reversal_of_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "xp_transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "xp_transactions_idempotency_key_key" ON "xp_transactions"("idempotency_key");
CREATE UNIQUE INDEX "xp_transactions_reversal_of_id_key" ON "xp_transactions"("reversal_of_id");
CREATE INDEX "xp_transactions_user_earned_idx" ON "xp_transactions"("user_id", "earned_at");
CREATE INDEX "xp_transactions_event_rule_idx" ON "xp_transactions"("event_id", "rule_key");
CREATE INDEX "xp_transactions_source_idx" ON "xp_transactions"("source_type", "source_id");

ALTER TABLE "xp_transactions"
  ADD CONSTRAINT "xp_transactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "xp_transactions"
  ADD CONSTRAINT "xp_transactions_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "events"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "xp_transactions"
  ADD CONSTRAINT "xp_transactions_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "event_categories"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "xp_transactions"
  ADD CONSTRAINT "xp_transactions_reversal_of_id_fkey"
  FOREIGN KEY ("reversal_of_id") REFERENCES "xp_transactions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
