-- Fix role constraint to allow 'admin' role
-- Run this in Supabase SQL Editor

-- Step 1: Drop the old constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Step 2: Add the correct constraint that includes 'admin'
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('patient', 'doctor', 'admin'));

-- Step 3: Now update your profile to admin
UPDATE public.profiles 
SET role = 'admin', is_verified = true
WHERE id = '733626de-3dd7-4787-804b-cdf3270a406b';

-- Step 4: Verify it worked
SELECT id, full_name, email, role, is_verified 
FROM public.profiles 
WHERE id = '733626de-3dd7-4787-804b-cdf3270a406b';
