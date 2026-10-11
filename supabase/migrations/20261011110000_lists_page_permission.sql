-- Page paths are validated in the app. New dashboard pages should not need a migration.

ALTER TABLE public.member_page_permissions
  DROP CONSTRAINT IF EXISTS member_page_permissions_path_check;
