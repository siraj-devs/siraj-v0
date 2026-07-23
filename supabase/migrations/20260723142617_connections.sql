CREATE TABLE IF NOT EXISTS public.ft_connections (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  login TEXT NOT NULL,
  avatar TEXT,
  authorized_at TIMESTAMPTZ DEFAULT now(),
  access_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ft_connections ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.dc_connections (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  avatar TEXT,
  email TEXT,
  authorized_at TIMESTAMPTZ DEFAULT now(),
  access_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dc_connections ENABLE ROW LEVEL SECURITY;
