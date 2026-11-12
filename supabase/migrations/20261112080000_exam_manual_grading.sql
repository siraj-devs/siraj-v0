-- Manual grading: per-answer points + published feedback/score for learners

ALTER TABLE public.exam_answers
  ADD COLUMN IF NOT EXISTS points_awarded NUMERIC(8, 2),
  ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;

ALTER TABLE public.exam_answers
  DROP CONSTRAINT IF EXISTS exam_answers_points_awarded_nonnegative;

ALTER TABLE public.exam_answers
  ADD CONSTRAINT exam_answers_points_awarded_nonnegative
  CHECK (points_awarded IS NULL OR points_awarded >= 0);

ALTER TABLE public.content_completions
  ADD COLUMN IF NOT EXISTS exam_feedback TEXT,
  ADD COLUMN IF NOT EXISTS exam_graded_at TIMESTAMPTZ;
