DO $$ BEGIN
  CREATE TYPE public.member_role AS ENUM ('owner', 'admin', 'veteran', 'visitor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.member_role ADD VALUE IF NOT EXISTS 'veteran';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.members (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role public.member_role NOT NULL DEFAULT 'visitor'
);

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS ft_connection BIGINT
  REFERENCES public.ft_connections (id) ON DELETE SET NULL;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS dc_connection TEXT
  REFERENCES public.dc_connections (id) ON DELETE SET NULL;

ALTER TABLE public.members
  DROP COLUMN IF EXISTS created_at;

CREATE UNIQUE INDEX IF NOT EXISTS members_ft_connection_unique
  ON public.members (ft_connection)
  WHERE ft_connection IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS members_dc_connection_unique
  ON public.members (dc_connection)
  WHERE dc_connection IS NOT NULL;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
