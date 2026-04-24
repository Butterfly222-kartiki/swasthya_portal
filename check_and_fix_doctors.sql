-- Check and fix doctor accounts in Swasthya Portal
-- Run this in Supabase SQL Editor

-- 1. Check how many doctors exist
SELECT 
  COUNT(*) as total_doctors,
  COUNT(*) FILTER (WHERE is_verified = true) as verified_doctors,
  COUNT(*) FILTER (WHERE is_verified = false) as unverified_doctors
FROM public.profiles 
WHERE role = 'doctor';

-- 2. See all doctors and their verification status
SELECT 
  id,
  full_name,
  email,
  speciality,
  city,
  is_verified,
  created_at
FROM public.profiles 
WHERE role = 'doctor'
ORDER BY created_at DESC;

-- 3. OPTIONAL: Verify all existing doctors (uncomment to run)
-- UPDATE public.profiles 
-- SET is_verified = true
-- WHERE role = 'doctor' AND is_verified = false;

-- 4. OPTIONAL: Add sample cities to doctors without cities (uncomment to run)
-- UPDATE public.profiles 
-- SET city = 'Mumbai'
-- WHERE role = 'doctor' AND city IS NULL AND id IN (
--   SELECT id FROM public.profiles WHERE role = 'doctor' AND city IS NULL LIMIT 2
-- );

-- UPDATE public.profiles 
-- SET city = 'Delhi'
-- WHERE role = 'doctor' AND city IS NULL AND id IN (
--   SELECT id FROM public.profiles WHERE role = 'doctor' AND city IS NULL LIMIT 2
-- );

-- UPDATE public.profiles 
-- SET city = 'Bangalore'
-- WHERE role = 'doctor' AND city IS NULL AND id IN (
--   SELECT id FROM public.profiles WHERE role = 'doctor' AND city IS NULL LIMIT 2
-- );

-- 5. Check the results
SELECT 
  full_name,
  speciality,
  city,
  is_verified
FROM public.profiles 
WHERE role = 'doctor';
