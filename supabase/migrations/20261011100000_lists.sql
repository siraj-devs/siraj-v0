-- Named lists (لوائح) of 42 profiles, managed from the dashboard.

CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists (id) ON DELETE CASCADE,
  ft_id BIGINT,
  login TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar TEXT,
  pool_year INT,
  campus TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT list_entries_login_unique UNIQUE (list_id, login),
  CONSTRAINT list_entries_ft_id_unique UNIQUE (list_id, ft_id)
);

CREATE INDEX IF NOT EXISTS list_entries_list_idx
  ON public.list_entries (list_id, created_at DESC);

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_entries ENABLE ROW LEVEL SECURITY;
