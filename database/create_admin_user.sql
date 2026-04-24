-- ================================================
-- CREATE ADMIN USER - Swasthya Portal
-- ================================================
-- Run this in Supabase SQL Editor after creating an auth user

-- STEP 1: First, create an auth user in Supabase Dashboard:
-- Go to Authentication → Users → Add User
-- Email: admin@swasthya.com (or your preferred email)
-- Password: (set a strong password)
-- Copy the generated UUID

-- STEP 2: Replace 'YOUR-AUTH-USER-UUID' below with the actual UUID
-- Then run this script

-- ================================================
-- METHOD 1: Create New Admin Profile (Simple Version)
-- ================================================
INSERT INTO public.profiles (
  id, 
  full_name, 
  email, 
  role, 
  is_verified
) VALUES (
  'YOUR-AUTH-USER-UUID',  -- ⚠️ REPLACE THIS with your auth user UUID
  'Admin User',           -- Change to your name
  'admin@swasthya.com',   -- Change to your email
  'admin',
  true
) ON CONFLICT (id) DO UPDATE 
SET 
  role = 'admin', 
  is_verified = true;

-- ================================================
-- METHOD 2: Convert Existing User to Admin
-- ================================================
-- If you already have a user account, use this instead:
-- (Uncomment and replace the email)

-- UPDATE public.profiles 
-- SET 
--   role = 'admin',
--   is_verified = true
-- WHERE email = 'your-existing-email@example.com';

-- ================================================
-- VERIFY ADMIN WAS CREATED
-- ================================================
SELECT 
  id,
  full_name,
  email,
  role,
  is_verified,
  created_at
FROM public.profiles 
WHERE role = 'admin';

-- ================================================
-- USEFUL QUERIES
-- ================================================

-- Check all users and their roles
-- SELECT id, full_name, email, role, is_verified 
-- FROM public.profiles 
-- ORDER BY created_at DESC;

-- Make multiple users admin
-- UPDATE public.profiles 
-- SET role = 'admin', is_verified = true
-- WHERE email IN ('admin1@example.com', 'admin2@example.com');

-- Remove admin access (make them patient)
-- UPDATE public.profiles 
-- SET role = 'patient'
-- WHERE email = 'user@example.com';

-- ================================================
-- AFTER RUNNING THIS SCRIPT
-- ================================================
-- 1. Go to http://localhost:3000/auth/login
-- 2. Login with the admin email and password
-- 3. You should be redirected to /admin dashboard
-- 4. You'll see the admin sidebar with management options
