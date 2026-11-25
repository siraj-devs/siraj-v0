-- Game questions: multi-correct, slider, and puzzle types; up to 6 options.
-- - multi_choice: options with one or more `is_correct`
-- - puzzle: options are items; `position` is the correct order, `is_correct` unused
-- - slider: no options; range + answer live in `config`

ALTER TABLE public.game_questions
  DROP CONSTRAINT IF EXISTS game_questions_type_check;

ALTER TABLE public.game_questions
  ADD CONSTRAINT game_questions_type_check
  CHECK (type IN ('single_choice', 'multi_choice', 'true_false', 'slider', 'puzzle'));

ALTER TABLE public.game_questions
  ADD COLUMN IF NOT EXISTS config JSONB;

ALTER TABLE public.game_questions
  DROP CONSTRAINT IF EXISTS game_questions_slider_config_check;

ALTER TABLE public.game_questions
  ADD CONSTRAINT game_questions_slider_config_check
  CHECK (type <> 'slider' OR config IS NOT NULL);

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
      id, template_id, position, type, text, media_url, time_limit_sec, points, explanation, config
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
      NULLIF(v_question->>'explanation', ''),
      NULLIF(v_question->'config', 'null'::jsonb)
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

REVOKE EXECUTE ON FUNCTION public.save_game_template(UUID, INT, BIGINT, JSONB, JSONB)
  FROM PUBLIC, anon, authenticated;
