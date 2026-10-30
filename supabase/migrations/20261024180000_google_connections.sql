-- Google OAuth connections (parallel to dc_connections)

CREATE TABLE IF NOT EXISTS public.google_connections (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar TEXT,
  authorized_at TIMESTAMPTZ DEFAULT now(),
  access_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS google_connection TEXT
  REFERENCES public.google_connections (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS members_google_connection_unique
  ON public.members (google_connection)
  WHERE google_connection IS NOT NULL;

ALTER TABLE public.profile_change_requests
  ADD COLUMN IF NOT EXISTS google_connection TEXT
  REFERENCES public.google_connections (id) ON DELETE CASCADE;

ALTER TABLE public.profile_change_requests
  DROP CONSTRAINT IF EXISTS profile_change_requests_subject_check;

ALTER TABLE public.profile_change_requests
  ADD CONSTRAINT profile_change_requests_subject_check CHECK (
    member_id IS NOT NULL
    OR ft_connection IS NOT NULL
    OR dc_connection IS NOT NULL
    OR google_connection IS NOT NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS profile_change_requests_one_pending_per_google
  ON public.profile_change_requests (google_connection)
  WHERE status = 'pending' AND google_connection IS NOT NULL;
