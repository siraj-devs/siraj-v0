-- Visibility flag: unpublished rows stay in the dashboard but are hidden on the public site

ALTER TABLE public.socials
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.proposed_programs
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS socials_is_published_idx
  ON public.socials (is_published)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS proposed_programs_is_published_idx
  ON public.proposed_programs (is_published, "order", id)
  WHERE is_published = true;
