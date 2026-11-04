-- Phase 1 phone verification: track WhatsApp/OTP verification time (NULL = unverified)

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
