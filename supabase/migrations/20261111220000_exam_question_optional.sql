-- Allow questions to be optional (skippable on submit)
ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT false;
