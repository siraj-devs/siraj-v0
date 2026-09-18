-- Club events: named timed ranges with a calendar color

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT events_time_order CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS events_start_at_idx
  ON public.events (start_at);

CREATE INDEX IF NOT EXISTS events_end_at_idx
  ON public.events (end_at);

CREATE INDEX IF NOT EXISTS events_range_idx
  ON public.events (start_at, end_at);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Owner dashboard + calendar reads go through the service role key (server actions).
-- No public policies: access is gated in the app.
