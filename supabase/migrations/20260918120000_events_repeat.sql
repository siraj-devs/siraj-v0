-- Event recurrence: none (continuous) | daily | weekly (selected weekdays)

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS repeat_mode TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS repeat_weekdays INT[] DEFAULT NULL;

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_repeat_mode_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_repeat_mode_check
  CHECK (repeat_mode IN ('none', 'daily', 'weekly'));

ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_repeat_weekdays_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_repeat_weekdays_check
  CHECK (
    (repeat_mode <> 'weekly' AND (repeat_weekdays IS NULL OR cardinality(repeat_weekdays) = 0))
    OR (
      repeat_mode = 'weekly'
      AND repeat_weekdays IS NOT NULL
      AND cardinality(repeat_weekdays) > 0
      AND repeat_weekdays <@ ARRAY[0, 1, 2, 3, 4, 5, 6]
    )
  );
