DROP INDEX IF EXISTS public.courses_published_idx;

ALTER TABLE public.courses
  DROP COLUMN IF EXISTS enrollment_status;

DROP TYPE IF EXISTS public.course_enrollment_status;

CREATE INDEX IF NOT EXISTS courses_published_idx
  ON public.courses (is_published)
  WHERE is_published = true;
