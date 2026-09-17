-- Network profiles: campus + student/pooler kind from Intra

ALTER TABLE public.network_profiles
  ADD COLUMN IF NOT EXISTS campus TEXT,
  ADD COLUMN IF NOT EXISTS kind TEXT;

UPDATE public.network_profiles
SET kind = 'pooler'
WHERE kind IS NULL;

ALTER TABLE public.network_profiles
  ALTER COLUMN kind SET DEFAULT 'pooler';

ALTER TABLE public.network_profiles
  ALTER COLUMN kind SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'network_profiles_kind_check'
  ) THEN
    ALTER TABLE public.network_profiles
      ADD CONSTRAINT network_profiles_kind_check
      CHECK (kind IN ('student', 'pooler'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS network_profiles_campus_idx
  ON public.network_profiles (campus);

CREATE INDEX IF NOT EXISTS network_profiles_kind_idx
  ON public.network_profiles (kind);
