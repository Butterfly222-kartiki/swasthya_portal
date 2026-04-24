-- ================================================
-- FIX DATABASE SCHEMA - Add Missing Columns
-- Run this in Supabase SQL Editor
-- ================================================

-- Add verification_status column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text 
CHECK (verification_status IN ('pending','approved','rejected')) 
DEFAULT 'approved';

-- Add city column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city text;

-- Add day_overrides column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS day_overrides text DEFAULT '{}';

-- Add video_room_name to appointments if it doesn't exist
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS video_room_name text;

-- Create index for city if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('verification_status', 'city', 'day_overrides')
ORDER BY column_name;

-- Show current profile structure
SELECT 
  id,
  full_name,
  email,
  role,
  is_verified,
  verification_status,
  city
FROM public.profiles
LIMIT 5;
