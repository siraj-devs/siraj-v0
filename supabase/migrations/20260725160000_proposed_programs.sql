-- Proposed programs (homepage content)
CREATE TABLE IF NOT EXISTS public.proposed_programs (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  links JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS proposed_programs_order_idx
  ON public.proposed_programs ("order" ASC, id ASC);

ALTER TABLE public.proposed_programs ENABLE ROW LEVEL SECURITY;

-- Public read for the website; writes go through the service role key
CREATE POLICY proposed_programs_public_read
  ON public.proposed_programs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Storage bucket for program images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposed-programs',
  'proposed-programs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY proposed_programs_storage_public_read
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'proposed-programs');
