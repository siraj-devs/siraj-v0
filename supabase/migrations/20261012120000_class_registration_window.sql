-- Each class owns a registration day and a later learning-start day.
-- Those inclusive ranges cannot overlap inside the same course.

ALTER TABLE public.course_classes
  ADD COLUMN IF NOT EXISTS registration_opens_on DATE;

DO $$
DECLARE
  r RECORD;
  prev_course BIGINT := NULL;
  prev_end DATE := NULL;
  reg DATE;
  learn DATE;
BEGIN
  FOR r IN
    SELECT id, course_id, learning_starts_at
    FROM public.course_classes
    ORDER BY course_id, learning_starts_at, id
  LOOP
    IF prev_course IS DISTINCT FROM r.course_id THEN
      prev_course := r.course_id;
      prev_end := NULL;
    END IF;

    learn := r.learning_starts_at;
    IF prev_end IS NULL THEN
      reg := learn - 1;
    ELSE
      reg := prev_end + 1;
    END IF;

    IF reg >= learn THEN
      learn := reg + 1;
    END IF;

    UPDATE public.course_classes
    SET registration_opens_on = reg,
        learning_starts_at = learn
    WHERE id = r.id;

    prev_end := learn;
  END LOOP;
END $$;

ALTER TABLE public.course_classes
  ALTER COLUMN registration_opens_on SET NOT NULL;

ALTER TABLE public.course_classes
  DROP CONSTRAINT IF EXISTS course_classes_registration_before_learning;

ALTER TABLE public.course_classes
  ADD CONSTRAINT course_classes_registration_before_learning
  CHECK (registration_opens_on < learning_starts_at);

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.course_classes
  DROP CONSTRAINT IF EXISTS course_classes_no_overlap;

ALTER TABLE public.course_classes
  ADD CONSTRAINT course_classes_no_overlap
  EXCLUDE USING gist (
    course_id WITH =,
    daterange(registration_opens_on, learning_starts_at, '[]') WITH &&
  );

ALTER TABLE public.course_contents
  ADD COLUMN IF NOT EXISTS class_id BIGINT;

UPDATE public.course_contents AS content
SET class_id = first_class.id
FROM (
  SELECT DISTINCT ON (course_id) id, course_id
  FROM public.course_classes
  ORDER BY course_id, learning_starts_at, id
) AS first_class
WHERE content.course_id = first_class.course_id
  AND content.class_id IS NULL;

ALTER TABLE public.course_contents
  DROP CONSTRAINT IF EXISTS course_contents_class_id_fkey;

ALTER TABLE public.course_contents
  ADD CONSTRAINT course_contents_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES public.course_classes (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS course_contents_class_order_idx
  ON public.course_contents (class_id, order_sequence ASC, id ASC);

ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_class_id_fkey;

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_class_id_fkey
  FOREIGN KEY (class_id) REFERENCES public.course_classes (id) ON DELETE CASCADE;
