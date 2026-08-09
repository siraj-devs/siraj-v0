-- Allow profile change requests before a members row exists (create member on approval)

ALTER TABLE public.profile_change_requests
  ALTER COLUMN member_id DROP NOT NULL;

ALTER TABLE public.profile_change_requests
  ADD COLUMN IF NOT EXISTS ft_connection BIGINT
  REFERENCES public.ft_connections (id) ON DELETE CASCADE;

ALTER TABLE public.profile_change_requests
  ADD COLUMN IF NOT EXISTS dc_connection TEXT
  REFERENCES public.dc_connections (id) ON DELETE CASCADE;

ALTER TABLE public.profile_change_requests
  DROP CONSTRAINT IF EXISTS profile_change_requests_subject_check;

ALTER TABLE public.profile_change_requests
  ADD CONSTRAINT profile_change_requests_subject_check CHECK (
    member_id IS NOT NULL
    OR ft_connection IS NOT NULL
    OR dc_connection IS NOT NULL
  );

CREATE UNIQUE INDEX IF NOT EXISTS profile_change_requests_one_pending_per_ft
  ON public.profile_change_requests (ft_connection)
  WHERE status = 'pending' AND ft_connection IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profile_change_requests_one_pending_per_dc
  ON public.profile_change_requests (dc_connection)
  WHERE status = 'pending' AND dc_connection IS NOT NULL;
