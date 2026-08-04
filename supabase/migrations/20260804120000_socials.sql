CREATE TABLE IF NOT EXISTS public.socials (
  label TEXT PRIMARY KEY,
  link TEXT NOT NULL,
  CONSTRAINT socials_label_format CHECK (
    label ~ '^[a-z0-9_\-]+$'
  ),
  CONSTRAINT socials_link_format CHECK (
    link ~ '^https?://'
  )
);

ALTER TABLE public.socials ENABLE ROW LEVEL SECURITY;
