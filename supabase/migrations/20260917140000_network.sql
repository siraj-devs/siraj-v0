-- Network profiles: curated 42 users managed by owners

CREATE TABLE IF NOT EXISTS public.network_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ft_id BIGINT UNIQUE,
  login TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT,
  pool_year INT,
  rank TEXT NOT NULL DEFAULT 'D' CHECK (rank IN ('A', 'B', 'C', 'D')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS network_profiles_rank_idx
  ON public.network_profiles (rank);

CREATE INDEX IF NOT EXISTS network_profiles_pool_year_idx
  ON public.network_profiles (pool_year DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS network_profiles_login_idx
  ON public.network_profiles (login);

ALTER TABLE public.network_profiles ENABLE ROW LEVEL SECURITY;

-- Owner dashboard reads/writes go through the service role key (server actions).
-- No public policies: table is owner-only via the app.
