-- Allow zero-point questions (e.g. unscored prompts still shown in تقويم)
ALTER TABLE public.exam_questions
  DROP CONSTRAINT IF EXISTS exam_questions_points_positive;

ALTER TABLE public.exam_questions
  ADD CONSTRAINT exam_questions_points_nonnegative CHECK (points >= 0);
