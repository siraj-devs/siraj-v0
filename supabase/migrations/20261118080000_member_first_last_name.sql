-- Split members.name into first_name + last_name (name kept as the full display name).

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill from the existing full name: first token → first_name, remainder → last_name.
UPDATE public.members
SET
  first_name = CASE
    WHEN position(' ' IN btrim(name)) > 0
      THEN split_part(btrim(name), ' ', 1)
    ELSE btrim(name)
  END,
  last_name = CASE
    WHEN position(' ' IN btrim(name)) > 0
      THEN btrim(substr(btrim(name), position(' ' IN btrim(name)) + 1))
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

ALTER TABLE public.members
  ALTER COLUMN first_name SET DEFAULT '',
  ALTER COLUMN last_name SET DEFAULT '';

ALTER TABLE public.members
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_first_name_not_blank;
ALTER TABLE public.members
  ADD CONSTRAINT members_first_name_not_blank CHECK (length(btrim(first_name)) >= 1);
