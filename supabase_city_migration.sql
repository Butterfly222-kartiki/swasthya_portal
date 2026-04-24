-- Add city field to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;

-- Create an index for faster city-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- Update existing doctors with sample cities (optional - remove if not needed)
-- UPDATE public.profiles SET city = 'Mumbai' WHERE role = 'doctor' AND city IS NULL LIMIT 5;
-- UPDATE public.profiles SET city = 'Delhi' WHERE role = 'doctor' AND city IS NULL LIMIT 5;
-- UPDATE public.profiles SET city = 'Bangalore' WHERE role = 'doctor' AND city IS NULL LIMIT 5;
