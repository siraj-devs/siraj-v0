CREATE TABLE IF NOT EXISTS public.submissions (
    id BIGSERIAL PRIMARY KEY,
    connection_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    tel TEXT NOT NULL,
    team TEXT NOT NULL,
    skills TEXT[] NOT NULL,
    about TEXT NOT NULL,
    availability TEXT NOT NULL,
    notes TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
