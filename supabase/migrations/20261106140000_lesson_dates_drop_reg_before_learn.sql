-- Allow registration_opens_on to equal or follow learning_starts_at
ALTER TABLE public.course_classes
  DROP CONSTRAINT IF EXISTS course_classes_registration_before_learning;

-- Per-lesson calendar window
ALTER TABLE public.course_contents
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE public.course_contents
  DROP CONSTRAINT IF EXISTS course_contents_start_before_end;

ALTER TABLE public.course_contents
  ADD CONSTRAINT course_contents_start_before_end
  CHECK (
    start_date IS NULL
    OR end_date IS NULL
    OR start_date <= end_date
  );
