-- Class role on enrollments (مشارك / مشرف) + course ordering

DO $$ BEGIN
  CREATE TYPE public.enrollment_class_role AS ENUM (
    'participant',
    'supervisor'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS class_role public.enrollment_class_role NOT NULL DEFAULT 'participant';

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS order_sequence INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS courses_order_idx
  ON public.courses (order_sequence ASC, id ASC);

-- Seed existing courses by created_at so order stays stable after the column lands.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) - 1 AS seq
  FROM public.courses
)
UPDATE public.courses AS c
SET order_sequence = ranked.seq
FROM ranked
WHERE c.id = ranked.id;
