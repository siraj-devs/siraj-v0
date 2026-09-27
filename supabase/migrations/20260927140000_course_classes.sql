-- A course class (دفعة) is the cohort participants join.
-- Lessons can open a set time after the class learning start.

CREATE TABLE IF NOT EXISTS public.course_classes (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  registration_opens_at TIMESTAMPTZ NOT NULL,
  registration_closes_at TIMESTAMPTZ NOT NULL,
  learning_starts_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_classes_registration_window CHECK (
    registration_opens_at < registration_closes_at
  )
);

CREATE INDEX IF NOT EXISTS course_classes_course_idx
  ON public.course_classes (course_id, registration_opens_at);

ALTER TABLE public.course_classes ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS class_id BIGINT REFERENCES public.course_classes (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS enrollments_class_idx
  ON public.enrollments (class_id);

ALTER TABLE public.course_contents
  ADD COLUMN IF NOT EXISTS release_unit TEXT,
  ADD COLUMN IF NOT EXISTS release_amount INTEGER;

ALTER TABLE public.course_contents
  DROP CONSTRAINT IF EXISTS course_contents_release_unit_check;

ALTER TABLE public.course_contents
  ADD CONSTRAINT course_contents_release_unit_check CHECK (
    release_unit IS NULL OR release_unit IN ('hours', 'days')
  );

ALTER TABLE public.course_contents
  DROP CONSTRAINT IF EXISTS course_contents_release_amount_check;

ALTER TABLE public.course_contents
  ADD CONSTRAINT course_contents_release_amount_check CHECK (
    release_amount IS NULL OR release_amount > 0
  );

ALTER TABLE public.course_contents
  DROP CONSTRAINT IF EXISTS course_contents_release_pair_check;

ALTER TABLE public.course_contents
  ADD CONSTRAINT course_contents_release_pair_check CHECK (
    (release_unit IS NULL AND release_amount IS NULL)
    OR (release_unit IS NOT NULL AND release_amount IS NOT NULL)
  );
