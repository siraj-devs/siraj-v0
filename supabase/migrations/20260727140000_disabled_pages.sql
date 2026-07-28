CREATE TABLE IF NOT EXISTS public.disabled_pages (
  path TEXT PRIMARY KEY,
  CONSTRAINT disabled_pages_path_format CHECK (
    path ~ '^/[a-z0-9\-_/]*$'
    AND path <> '/'
    AND path <> '/login'
    AND path NOT LIKE '/dashboard%'
    AND path NOT LIKE '/api%'
  )
);

ALTER TABLE public.disabled_pages ENABLE ROW LEVEL SECURITY;
