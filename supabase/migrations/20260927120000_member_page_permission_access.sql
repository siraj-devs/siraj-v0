-- Each granted dashboard page is either view-only or editable.

ALTER TABLE public.member_page_permissions
  ADD COLUMN IF NOT EXISTS access TEXT NOT NULL DEFAULT 'view';

ALTER TABLE public.member_page_permissions
  DROP CONSTRAINT IF EXISTS member_page_permissions_access_check;

ALTER TABLE public.member_page_permissions
  ADD CONSTRAINT member_page_permissions_access_check
  CHECK (access IN ('view', 'edit'));
