# Quick Start Guide - Fix Database & Create Admin

## Step 1: Fix Database Schema (Run First!)

Run this in **Supabase SQL Editor**:

```sql
-- Add missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text 
CHECK (verification_status IN ('pending','approved','rejected')) 
DEFAULT 'approved';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city text;

CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
```

Or just run the file: **fix_database_schema.sql**

## Step 2: Create Admin User

### Option A: Convert Your Existing Account (Easiest)

1. Find your email in Supabase Dashboard → Authentication → Users
2. Run this SQL (replace the email):

```sql
UPDATE public.profiles 
SET role = 'admin', is_verified = true
WHERE email = 'your-email@example.com';
```

3. Logout and login again → You'll be at `/admin`

### Option B: Create New Admin

1. **Create auth user** in Supabase:
   - Dashboard → Authentication → Users → Add User
   - Email: `admin@swasthya.com`
   - Password: (set it)
   - Copy the UUID

2. **Run this SQL** (replace UUID):

```sql
INSERT INTO public.profiles (
  id, 
  full_name, 
  email, 
  role, 
  is_verified
) VALUES (
  'YOUR-AUTH-USER-UUID',
  'Admin User',
  'admin@swasthya.com',
  'admin',
  true
);
```

3. **Login** at http://localhost:3000/auth/login

## Step 3: Fix "No Doctors" Issue

Run this SQL to verify all doctors:

```sql
-- Check doctors
SELECT COUNT(*) FROM public.profiles WHERE role = 'doctor';

-- Verify all doctors
UPDATE public.profiles 
SET is_verified = true
WHERE role = 'doctor';

-- Add cities to doctors (optional)
UPDATE public.profiles 
SET city = 'Mumbai'
WHERE role = 'doctor' AND city IS NULL;
```

## Step 4: Test Everything

1. **Login as admin** → Should go to `/admin`
2. **Go to appointments** → Should see doctors now
3. **Try booking** → Should work with city filter

## All Done! 🎉

Your system should now have:
- ✅ Admin access working
- ✅ Doctors visible in appointments
- ✅ City filtering working
- ✅ All database columns present

## Quick Reference

**Admin Login**: http://localhost:3000/auth/login
**Admin Dashboard**: http://localhost:3000/admin
**Verify Doctors**: http://localhost:3000/admin/doctors

## If Still Having Issues

1. Check `TROUBLESHOOTING.md`
2. Check browser console (F12)
3. Verify database columns exist:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles';
```
