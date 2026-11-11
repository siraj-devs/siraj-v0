-- Assessment (تقويم) overhaul: points, multi-correct, text types, answer storage

-- New question types
ALTER TYPE public.exam_question_type ADD VALUE IF NOT EXISTS 'short_text';
ALTER TYPE public.exam_question_type ADD VALUE IF NOT EXISTS 'long_text';

ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS correct_option_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.exam_questions
  DROP CONSTRAINT IF EXISTS exam_questions_points_positive;

ALTER TABLE public.exam_questions
  ADD CONSTRAINT exam_questions_points_nonnegative CHECK (points >= 0);

-- Make single correct id optional (legacy column kept for compatibility)
ALTER TABLE public.exam_questions
  ALTER COLUMN correct_option_id DROP NOT NULL;

-- Backfill multi-correct array from legacy single id
UPDATE public.exam_questions
SET correct_option_ids = jsonb_build_array(correct_option_id)
WHERE correct_option_id IS NOT NULL
  AND (
    correct_option_ids IS NULL
    OR correct_option_ids = '[]'::jsonb
  );

-- Learner answers (for later manual grading of text questions)
CREATE TABLE IF NOT EXISTS public.exam_answers (
  id BIGSERIAL PRIMARY KEY,
  enrollment_id BIGINT NOT NULL REFERENCES public.enrollments (id) ON DELETE CASCADE,
  content_id BIGINT NOT NULL REFERENCES public.course_contents (id) ON DELETE CASCADE,
  question_id BIGINT NOT NULL REFERENCES public.exam_questions (id) ON DELETE CASCADE,
  answer_text TEXT,
  selected_option_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT exam_answers_unique_per_question UNIQUE (enrollment_id, question_id)
);

CREATE INDEX IF NOT EXISTS exam_answers_content_enrollment_idx
  ON public.exam_answers (content_id, enrollment_id);

ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
