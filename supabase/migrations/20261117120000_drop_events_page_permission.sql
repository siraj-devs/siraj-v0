-- Events management moved into /dashboard/calendar. Drop the standalone
-- /dashboard/events grant, and carry any leftover access over to calendar.

-- Promote existing events grants onto calendar when the member has no calendar
-- grant yet, or when the events grant is higher (edit > view).
INSERT INTO public.member_page_permissions (member_id, path, access)
SELECT e.member_id, '/dashboard/calendar', e.access
FROM public.member_page_permissions e
WHERE e.path = '/dashboard/events'
ON CONFLICT (member_id, path) DO UPDATE
SET access = CASE
  WHEN EXCLUDED.access = 'edit' OR member_page_permissions.access = 'edit'
    THEN 'edit'
  ELSE member_page_permissions.access
END;

DELETE FROM public.member_page_permissions
WHERE path = '/dashboard/events';
