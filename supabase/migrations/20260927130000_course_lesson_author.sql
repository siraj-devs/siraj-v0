-- Optional author on a lesson. Course description may be left empty.

ALTER TABLE public.course_contents
  ADD COLUMN IF NOT EXISTS author TEXT;

ALTER TABLE public.courses
  ALTER COLUMN description DROP NOT NULL;
