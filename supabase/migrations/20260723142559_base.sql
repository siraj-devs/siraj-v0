CREATE TABLE IF NOT EXISTS public.base (
  id BIGSERIAL PRIMARY KEY,
  owner_id TEXT,
  maintenance boolean NOT NULL default FALSE
);

ALTER TABLE public.base ENABLE ROW LEVEL SECURITY;
