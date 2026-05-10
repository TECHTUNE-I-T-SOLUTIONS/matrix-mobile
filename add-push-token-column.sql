-- Add expo_push_token to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token text;
