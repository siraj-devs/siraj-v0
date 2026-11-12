-- Allow a member to enroll in multiple classes of the same course
ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_member_course_unique;

CREATE UNIQUE INDEX IF NOT EXISTS enrollments_member_class_unique
  ON public.enrollments (member_id, class_id)
  WHERE class_id IS NOT NULL;
