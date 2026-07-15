CREATE TABLE IF NOT EXISTS public.ft_connections (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  login TEXT NOT NULL,
  avatar TEXT,
  authorized_at TIMESTAMPTZ DEFAULT now(),
  access_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ft_connections ENABLE ROW LEVEL SECURITY;
