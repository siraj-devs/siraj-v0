-- Private courses: visibility + ACL by role and/or specific members

DO $$ BEGIN
  CREATE TYPE public.course_visibility AS ENUM ('public', 'private');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS visibility public.course_visibility NOT NULL DEFAULT 'public';

CREATE TABLE IF NOT EXISTS public.course_allowed_roles (
  course_id BIGINT NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  role public.member_role NOT NULL,
  PRIMARY KEY (course_id, role)
);

CREATE TABLE IF NOT EXISTS public.course_allowed_members (
  course_id BIGINT NOT NULL REFERENCES public.courses (id) ON DELETE CASCADE,
  member_id BIGINT NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, member_id)
);

CREATE INDEX IF NOT EXISTS course_allowed_roles_role_idx
  ON public.course_allowed_roles (role);

CREATE INDEX IF NOT EXISTS course_allowed_members_member_idx
  ON public.course_allowed_members (member_id);

ALTER TABLE public.course_allowed_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_allowed_members ENABLE ROW LEVEL SECURITY;
