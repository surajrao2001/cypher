-- Lightweight onboarding completion timestamp. Phone stays in Supabase Auth.
ALTER TABLE "profiles" ADD COLUMN "onboarded_at" TIMESTAMP(3);
