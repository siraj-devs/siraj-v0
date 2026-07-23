CREATE TABLE IF NOT EXISTS public.meetings (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT meetings_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS meetings_date_idx
  ON public.meetings (date DESC, start_time ASC);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.guests (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  ft_connection BIGINT
    REFERENCES public.ft_connections (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS guests_ft_connection_unique
  ON public.guests (ft_connection)
  WHERE ft_connection IS NOT NULL;

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.meeting_attendees (
  id BIGSERIAL PRIMARY KEY,
  meeting_id BIGINT NOT NULL
    REFERENCES public.meetings (id) ON DELETE CASCADE,
  member_id BIGINT
    REFERENCES public.members (id) ON DELETE CASCADE,
  guest_id BIGINT
    REFERENCES public.guests (id) ON DELETE CASCADE,
  CONSTRAINT meeting_attendees_one_person CHECK (
    (member_id IS NOT NULL AND guest_id IS NULL)
    OR (member_id IS NULL AND guest_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS meeting_attendees_member_unique
  ON public.meeting_attendees (meeting_id, member_id)
  WHERE member_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS meeting_attendees_guest_unique
  ON public.meeting_attendees (meeting_id, guest_id)
  WHERE guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS meeting_attendees_meeting_idx
  ON public.meeting_attendees (meeting_id);

ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
