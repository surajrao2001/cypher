-- Step 2: use cashfree after enum value is committed

ALTER TABLE "payment_orders"
  ALTER COLUMN "provider" SET DEFAULT 'cashfree';

ALTER TABLE "payment_orders"
  ADD COLUMN "provider_session_id" TEXT;

CREATE TABLE "organizer_payment_accounts" (
  "id" UUID NOT NULL,
  "organizer_id" UUID NOT NULL,
  "provider" "PaymentProvider" NOT NULL DEFAULT 'cashfree',
  "provider_vendor_id" TEXT,
  "status" "OrganizerPayoutAccountStatus" NOT NULL DEFAULT 'not_started',
  "payout_ready" BOOLEAN NOT NULL DEFAULT false,
  "display_name" TEXT,
  "contact_email" TEXT,
  "contact_phone" TEXT,
  "last_error" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "organizer_payment_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizer_payment_accounts_organizer_id_key"
  ON "organizer_payment_accounts"("organizer_id");

CREATE INDEX "organizer_payment_accounts_provider_status_idx"
  ON "organizer_payment_accounts"("provider", "status");

ALTER TABLE "organizer_payment_accounts"
  ADD CONSTRAINT "organizer_payment_accounts_organizer_id_fkey"
  FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
