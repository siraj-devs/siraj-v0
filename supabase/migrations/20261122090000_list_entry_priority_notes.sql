-- Priority + collaborative notes on list profiles.

ALTER TABLE public.list_entries
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'none';

ALTER TABLE public.list_entries
  DROP CONSTRAINT IF EXISTS list_entries_priority_check;

ALTER TABLE public.list_entries
  ADD CONSTRAINT list_entries_priority_check
  CHECK (priority IN ('none', 'high', 'medium', 'low'));

CREATE INDEX IF NOT EXISTS list_entries_priority_idx
  ON public.list_entries (list_id, priority);

CREATE TABLE IF NOT EXISTS public.list_entry_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.list_entries (id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT list_entry_notes_body_not_blank CHECK (length(btrim(body)) >= 1)
);

CREATE INDEX IF NOT EXISTS list_entry_notes_entry_idx
  ON public.list_entry_notes (entry_id, created_at ASC);

CREATE INDEX IF NOT EXISTS list_entry_notes_member_idx
  ON public.list_entry_notes (member_id);

ALTER TABLE public.list_entry_notes ENABLE ROW LEVEL SECURITY;
