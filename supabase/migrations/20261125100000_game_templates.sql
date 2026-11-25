-- Game templates (Kahoot-style quizzes) authored on the members side, and a
-- record of every game launched on the play app. Templates are not scoped to a
-- club / class / event: ownership is `created_by` / `host_id` only.

CREATE TABLE IF NOT EXISTS public.game_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  created_by BIGINT REFERENCES public.members (id) ON DELETE SET NULL,
  default_settings JSONB NOT NULL DEFAULT jsonb_build_object(
    'timePerQuestionSec', 20,
    'shuffleQuestions', false,
    'shuffleOptions', false,
    'pointsMode', 'standard'
  ),
  version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT game_templates_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT game_templates_status_check CHECK (status IN ('draft', 'ready')),
  CONSTRAINT game_templates_version_check CHECK (version >= 1)
);

CREATE INDEX IF NOT EXISTS game_templates_created_by_idx
  ON public.game_templates (created_by);

CREATE INDEX IF NOT EXISTS game_templates_updated_idx
  ON public.game_templates (updated_at DESC);

-- `type` is TEXT + CHECK (not an enum) so `multi_choice` can be added by
-- swapping the constraint.
CREATE TABLE IF NOT EXISTS public.game_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.game_templates (id) ON DELETE CASCADE,
  position INT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single_choice',
  text TEXT NOT NULL DEFAULT '',
  media_url TEXT,
  time_limit_sec INT,
  points INT NOT NULL DEFAULT 1000,
  explanation TEXT,
  CONSTRAINT game_questions_type_check
    CHECK (type IN ('single_choice', 'true_false')),
  CONSTRAINT game_questions_time_limit_check
    CHECK (time_limit_sec IS NULL OR time_limit_sec BETWEEN 5 AND 120),
  CONSTRAINT game_questions_points_check CHECK (points BETWEEN 0 AND 2000),
  CONSTRAINT game_questions_position_unique UNIQUE (template_id, position)
);

CREATE TABLE IF NOT EXISTS public.game_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.game_questions (id) ON DELETE CASCADE,
  position INT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  is_correct BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT game_question_options_position_unique UNIQUE (question_id, position)
);

-- One row per "Start game" attempt. Rows survive template deletion.
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.game_templates (id) ON DELETE SET NULL,
  template_version INT NOT NULL,
  host_id BIGINT REFERENCES public.members (id) ON DELETE SET NULL,
  play_game_id TEXT,
  pin TEXT,
  host_url TEXT,
  status TEXT NOT NULL DEFAULT 'launching',
  error_message TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  results_summary JSONB,
  CONSTRAINT game_sessions_status_check
    CHECK (status IN ('launching', 'launched', 'failed', 'finished')),
  CONSTRAINT game_sessions_idempotency_key_unique UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS game_sessions_template_idx
  ON public.game_sessions (template_id, created_at DESC);

CREATE INDEX IF NOT EXISTS game_sessions_host_idx
  ON public.game_sessions (host_id, created_at DESC);

ALTER TABLE public.game_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Atomic save: template + questions + options in one transaction.
-- `p_template_id` NULL creates a template (version 1); otherwise the template
-- is updated, its version bumped, and its questions replaced. Question/option
-- ids sent by the app are kept so they stay stable across versions.
-- `p_expected_version` guards against overwriting a newer save.
-- Input is validated by the server action before calling this.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_game_template(
  p_template_id UUID,
  p_expected_version INT,
  p_created_by BIGINT,
  p_template JSONB,
  p_questions JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_version INT;
  v_question JSONB;
  v_question_id UUID;
  v_option JSONB;
BEGIN
  IF p_template_id IS NULL THEN
    INSERT INTO public.game_templates (
      title, description, cover_image_url, created_by, default_settings, status
    )
    VALUES (
      p_template->>'title',
      COALESCE(p_template->>'description', ''),
      NULLIF(p_template->>'cover_image_url', ''),
      p_created_by,
      p_template->'default_settings',
      p_template->>'status'
    )
    RETURNING game_templates.id, game_templates.version INTO v_id, v_version;
  ELSE
    UPDATE public.game_templates AS t
    SET
      title = p_template->>'title',
      description = COALESCE(p_template->>'description', ''),
      cover_image_url = NULLIF(p_template->>'cover_image_url', ''),
      default_settings = p_template->'default_settings',
      status = p_template->>'status',
      version = t.version + 1,
      updated_at = now()
    WHERE t.id = p_template_id
      AND (p_expected_version IS NULL OR t.version = p_expected_version)
    RETURNING t.id, t.version INTO v_id, v_version;

    IF v_id IS NULL THEN
      IF EXISTS (SELECT 1 FROM public.game_templates WHERE game_templates.id = p_template_id) THEN
        RAISE EXCEPTION 'game_template_version_conflict';
      END IF;
      RAISE EXCEPTION 'game_template_not_found';
    END IF;

    DELETE FROM public.game_questions AS q WHERE q.template_id = v_id;
  END IF;

  FOR v_question IN SELECT value FROM jsonb_array_elements(COALESCE(p_questions, '[]'::jsonb))
  LOOP
    INSERT INTO public.game_questions (
      id, template_id, position, type, text, media_url, time_limit_sec, points, explanation
    )
    VALUES (
      COALESCE(NULLIF(v_question->>'id', '')::uuid, gen_random_uuid()),
      v_id,
      (v_question->>'position')::int,
      v_question->>'type',
      COALESCE(v_question->>'text', ''),
      NULLIF(v_question->>'media_url', ''),
      NULLIF(v_question->>'time_limit_sec', '')::int,
      (v_question->>'points')::int,
      NULLIF(v_question->>'explanation', '')
    )
    RETURNING game_questions.id INTO v_question_id;

    FOR v_option IN SELECT value FROM jsonb_array_elements(COALESCE(v_question->'options', '[]'::jsonb))
    LOOP
      INSERT INTO public.game_question_options (id, question_id, position, text, is_correct)
      VALUES (
        COALESCE(NULLIF(v_option->>'id', '')::uuid, gen_random_uuid()),
        v_question_id,
        (v_option->>'position')::int,
        COALESCE(v_option->>'text', ''),
        COALESCE((v_option->>'is_correct')::boolean, false)
      );
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object('id', v_id, 'version', v_version);
END;
$$;

-- Only the server (secret key) may call this; the publishable key is public.
REVOKE EXECUTE ON FUNCTION public.save_game_template(UUID, INT, BIGINT, JSONB, JSONB)
  FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Storage bucket for cover / question images
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'games',
  'games',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  CREATE POLICY games_storage_public_read
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'games');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
