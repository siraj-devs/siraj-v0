-- Extra dashboard page access, granted by the owner on top of the member role.

CREATE TABLE IF NOT EXISTS public.member_page_permissions (
  member_id BIGINT NOT NULL REFERENCES public.members (id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  PRIMARY KEY (member_id, path),
  CONSTRAINT member_page_permissions_path_check CHECK (
    path IN (
      '/dashboard/submissions',
      '/dashboard/connections',
      '/dashboard/content',
      '/dashboard/courses',
      '/dashboard/profile-requests',
      '/dashboard/sessions',
      '/dashboard/network',
      '/dashboard/events'
    )
  )
);

CREATE INDEX IF NOT EXISTS member_page_permissions_member_id_idx
  ON public.member_page_permissions (member_id);

ALTER TABLE public.member_page_permissions ENABLE ROW LEVEL SECURITY;
