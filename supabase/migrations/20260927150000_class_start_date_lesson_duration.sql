-- A class keeps a learning start date only. Lesson timing is a duration.

ALTER TABLE public.course_classes
  DROP CONSTRAINT IF EXISTS course_classes_registration_window;

DROP INDEX IF EXISTS public.course_classes_course_idx;

ALTER TABLE public.course_classes
  DROP COLUMN IF EXISTS registration_opens_at,
  DROP COLUMN IF EXISTS registration_closes_at;

ALTER TABLE public.course_classes
  ALTER COLUMN learning_starts_at TYPE DATE
  USING (timezone('Africa/Casablanca', learning_starts_at))::date;

CREATE INDEX IF NOT EXISTS course_classes_course_idx
  ON public.course_classes (course_id, learning_starts_at);

ALTER TABLE public.course_contents
  RENAME COLUMN release_unit TO duration_unit;

ALTER TABLE public.course_contents
  RENAME COLUMN release_amount TO duration_amount;

ALTER TABLE public.course_contents
  DROP CONSTRAINT IF EXISTS course_contents_release_unit_check;

ALTER TABLE public.course_contents
  DROP CONSTRAINT IF EXISTS course_contents_release_amount_check;

ALTER TABLE public.course_contents
  DROP CONSTRAINT IF EXISTS course_contents_release_pair_check;

ALTER TABLE public.course_contents
  ADD CONSTRAINT course_contents_duration_unit_check CHECK (
    duration_unit IS NULL OR duration_unit IN ('hours', 'days')
  );

ALTER TABLE public.course_contents
  ADD CONSTRAINT course_contents_duration_amount_check CHECK (
    duration_amount IS NULL OR duration_amount > 0
  );

ALTER TABLE public.course_contents
  ADD CONSTRAINT course_contents_duration_pair_check CHECK (
    (duration_unit IS NULL AND duration_amount IS NULL)
    OR (duration_unit IS NOT NULL AND duration_amount IS NOT NULL)
  );
