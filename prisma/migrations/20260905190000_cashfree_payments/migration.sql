-- Step 1: add enum value only (must commit before use — separate migration follows)

CREATE TYPE "OrganizerPayoutAccountStatus" AS ENUM (
  'not_started',
  'pending',
  'action_required',
  'active',
  'suspended',
  'rejected'
);

ALTER TYPE "PaymentProvider" ADD VALUE 'cashfree';
