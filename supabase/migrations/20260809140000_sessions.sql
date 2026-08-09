-- Session series (reusable tags) and sessions (أمسيات)

CREATE TABLE IF NOT EXISTS public.session_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thumbnail TEXT,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  record_link TEXT NOT NULL,
  series_id UUID REFERENCES public.session_series (id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_due_date_idx
  ON public.sessions (due_date DESC);

CREATE INDEX IF NOT EXISTS sessions_is_published_idx
  ON public.sessions (is_published);

CREATE INDEX IF NOT EXISTS sessions_series_id_idx
  ON public.sessions (series_id);

ALTER TABLE public.session_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Public read for published sessions; writes go through the service role key
CREATE POLICY session_series_public_read
  ON public.session_series
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY sessions_public_read
  ON public.sessions
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Storage bucket for session thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sessions',
  'sessions',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY sessions_storage_public_read
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'sessions');
