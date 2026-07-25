-- Rename visitor → participant; add newcomer
-- Note: a newly added enum value cannot be used in the same transaction.
DO $$ BEGIN
  ALTER TYPE public.member_role RENAME VALUE 'visitor' TO 'participant';
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN invalid_parameter_value THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.member_role ADD VALUE IF NOT EXISTS 'newcomer';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
