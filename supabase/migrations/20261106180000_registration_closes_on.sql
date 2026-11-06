-- Explicit registration open + close window (independent of learning start)

ALTER TABLE public.course_classes
  ADD COLUMN IF NOT EXISTS registration_closes_on DATE;

-- Existing cohorts: keep previous single-day open behavior
UPDATE public.course_classes
SET registration_closes_on = registration_opens_on
WHERE registration_closes_on IS NULL;

ALTER TABLE public.course_classes
  ALTER COLUMN registration_closes_on SET NOT NULL;

ALTER TABLE public.course_classes
  DROP CONSTRAINT IF EXISTS course_classes_registration_window;

ALTER TABLE public.course_classes
  ADD CONSTRAINT course_classes_registration_window
  CHECK (registration_opens_on <= registration_closes_on);
