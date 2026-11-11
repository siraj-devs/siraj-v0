-- Allow zero-point questions (ungraded-by-weight or unscored weight)
ALTER TABLE public.exam_questions
  DROP CONSTRAINT IF EXISTS exam_questions_points_positive;

ALTER TABLE public.exam_questions
  DROP CONSTRAINT IF EXISTS exam_questions_points_nonnegative;

ALTER TABLE public.exam_questions
  ADD CONSTRAINT exam_questions_points_nonnegative CHECK (points >= 0);
