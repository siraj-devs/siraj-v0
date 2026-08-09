-- Members contact fields, profile change requests, and courses e-learning

-- ---------------------------------------------------------------------------
-- Members: email + phone
-- ---------------------------------------------------------------------------
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_email_format;
ALTER TABLE public.members
  ADD CONSTRAINT members_email_format CHECK (
    email IS NULL OR email ~* '^[^@]+@[^@]+\.[^@]+$'
  );

ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_phone_format;
ALTER TABLE public.members
  ADD CONSTRAINT members_phone_format CHECK (
    phone IS NULL OR length(trim(phone)) >= 8
  );

-- ---------------------------------------------------------------------------
-- Profile change requests (owner must approve before members is updated)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.profile_request_status AS ENUM (
    'pending',
    'approved',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.profile_change_requests (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
  requested_name TEXT NOT NULL,
  requested_email TEXT NOT NULL,
  requested_phone TEXT NOT NULL,
  status public.profile_request_status NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT REFERENCES public.members (id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT profile_change_requests_email_format CHECK (
    requested_email ~* '^[^@]+@[^@]+\.[^@]+$'
  ),
  CONSTRAINT profile_change_requests_phone_format CHECK (
    length(trim(requested_phone)) >= 8
  ),
  CONSTRAINT profile_change_requests_name_not_empty CHECK (
    length(trim(requested_name)) > 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS profile_change_requests_one_pending_per_member
  ON public.profile_change_requests (member_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS profile_change_requests_status_idx
  ON public.profile_change_requests (status, created_at DESC);

ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Courses
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.course_enrollment_status AS ENUM ('open', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.course_content_type AS ENUM (
    'watching',
    'listening',
    'reading',
    'exam'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed', 'dropped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.exam_question_type AS ENUM ('multiple_choice', 'true_false');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.courses (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  enrollment_status public.course_enrollment_status NOT NULL DEFAULT 'closed',
  owner_id BIGINT REFERENCES public.members (id) ON DELETE SET NULL,
  rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT courses_title_not_empty CHECK (length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS courses_published_idx
  ON public.courses (is_published, enrollment_status)
  WHERE is_published = true;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Course contents (lessons)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_contents (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  type public.course_content_type NOT NULL,
  title TEXT NOT NULL,
  content_url TEXT,
  order_sequence INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_contents_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT course_contents_url_required CHECK (
    type = 'exam' OR (content_url IS NOT NULL AND length(trim(content_url)) > 0)
  )
);

CREATE INDEX IF NOT EXISTS course_contents_course_order_idx
  ON public.course_contents (course_id, order_sequence ASC, id ASC);

ALTER TABLE public.course_contents ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Exam questions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id BIGSERIAL PRIMARY KEY,
  content_id BIGINT NOT NULL REFERENCES public.course_contents (id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type public.exam_question_type NOT NULL DEFAULT 'multiple_choice',
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option_id TEXT NOT NULL,
  order_sequence INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT exam_questions_text_not_empty CHECK (length(trim(question_text)) > 0)
);

CREATE INDEX IF NOT EXISTS exam_questions_content_order_idx
  ON public.exam_questions (content_id, order_sequence ASC, id ASC);

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Enrollments (keyed to members)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0
    CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  status public.enrollment_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_member_course_unique UNIQUE (member_id, course_id)
);

CREATE INDEX IF NOT EXISTS enrollments_member_idx ON public.enrollments (member_id);
CREATE INDEX IF NOT EXISTS enrollments_course_idx ON public.enrollments (course_id);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Content completion (progress tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_completions (
  id BIGSERIAL PRIMARY KEY,
  enrollment_id BIGINT NOT NULL REFERENCES public.enrollments (id) ON DELETE CASCADE,
  content_id BIGINT NOT NULL REFERENCES public.course_contents (id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT true,
  exam_score NUMERIC(5, 2),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_completions_unique UNIQUE (enrollment_id, content_id)
);

ALTER TABLE public.content_completions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Ratings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_ratings (
  id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_ratings_unique UNIQUE (course_id, member_id)
);

ALTER TABLE public.course_ratings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Storage bucket for course thumbnails / audio
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'courses',
  'courses',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/ogg',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  CREATE POLICY courses_storage_public_read
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'courses');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
