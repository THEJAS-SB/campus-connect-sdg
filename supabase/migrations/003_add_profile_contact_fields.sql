-- Add contact fields to profiles table for all user profile pages
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
