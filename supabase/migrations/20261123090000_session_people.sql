-- Sessions: optional recording link + presenters/participants (members or 42 logins).

ALTER TABLE public.sessions
  ALTER COLUMN record_link DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.session_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions (id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  member_id BIGINT REFERENCES public.members (id) ON DELETE CASCADE,
  login TEXT,
  name TEXT NOT NULL,
  avatar TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT session_people_role_check
    CHECK (role IN ('presenter', 'participant')),
  CONSTRAINT session_people_identity_check
    CHECK (member_id IS NOT NULL OR login IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS session_people_member_uidx
  ON public.session_people (session_id, role, member_id)
  WHERE member_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS session_people_login_uidx
  ON public.session_people (session_id, role, login)
  WHERE member_id IS NULL;

CREATE INDEX IF NOT EXISTS session_people_session_idx
  ON public.session_people (session_id, role, position);

CREATE INDEX IF NOT EXISTS session_people_member_idx
  ON public.session_people (member_id);

ALTER TABLE public.session_people ENABLE ROW LEVEL SECURITY;
