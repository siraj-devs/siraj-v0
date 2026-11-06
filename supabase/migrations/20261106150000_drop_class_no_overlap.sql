-- registration_opens_on and learning_starts_at are independent;
-- daterange(registration, learning) fails when registration > learning.
ALTER TABLE public.course_classes
  DROP CONSTRAINT IF EXISTS course_classes_no_overlap;
