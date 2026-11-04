-- Remove legacy owner-approval profile request queue

DROP TABLE IF EXISTS public.profile_change_requests;
