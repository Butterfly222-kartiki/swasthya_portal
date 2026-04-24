# Complete Setup Steps - Swasthya Portal

## 🎯 Goal
Get admin access and fix "no doctors" issue

## 📋 Prerequisites
- Supabase project created
- App running locally (`npm run dev`)
- Registered user account (or create one)

---

## Step 1: Fix Database Schema ⚙️

**Why**: Add missing columns that cause errors

**Action**: Run in Supabase SQL Editor

```sql
-- Copy and paste this entire block
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status text 
CHECK (verification_status IN ('pending','approved','rejected')) 
DEFAULT 'approved';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city text;

CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
```

**How to run**:
1. Open https://supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Paste the SQL above
6. Click **Run** (or press Ctrl+Enter)

✅ **Success**: You'll see "Success. No rows returned"

---

## Step 2: Get Your UUID 🔑

**Option A: From Supabase Dashboard**

1. In Supabase, click **Authentication** (left sidebar)
2. Click **Users**
3. Find your user by email
4. **Copy the ID** (first column) - it looks like:
   ```
   a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

**Option B: Using SQL**

Run this in SQL Editor (replace the email):
```sql
SELECT id, email FROM auth.users 
WHERE email = 'your-email@example.com';
```

The `id` column is your UUID.

---

## Step 3: Make Yourself Admin 👑

**Action**: Run in SQL Editor (replace YOUR-UUID with your actual UUID)

```sql
-- Replace YOUR-UUID with the UUID you copied
UPDATE public.profiles 
SET role = 'admin', is_verified = true
WHERE id = 'YOUR-UUID';

-- Verify it worked
SELECT id, email, role, is_verified 
FROM public.profiles 
WHERE id = 'YOUR-UUID';
```

**Example** (if your UUID is `abc123...`):
```sql
UPDATE public.profiles 
SET role = 'admin', is_verified = true
WHERE id = 'abc123-def456-789012-345678-901234';
```

✅ **Success**: The verify query should show `role = 'admin'`

---

## Step 4: Fix Doctors Not Showing 👨‍⚕️

**Action**: Run in SQL Editor

```sql
-- Check how many doctors exist
SELECT COUNT(*) as total_doctors 
FROM public.profiles 
WHERE role = 'doctor';

-- Verify all doctors
UPDATE public.profiles 
SET is_verified = true
WHERE role = 'doctor';

-- Add cities to doctors (optional but recommended)
UPDATE public.profiles 
SET city = 'Mumbai'
WHERE role = 'doctor' AND city IS NULL;

-- Verify it worked
SELECT full_name, email, city, is_verified 
FROM public.profiles 
WHERE role = 'doctor';
```

✅ **Success**: You should see doctors with `is_verified = true`

---

## Step 5: Update Your Profile with City 🏙️

**Action**: Run in SQL Editor (replace YOUR-UUID and YOUR-CITY)

```sql
UPDATE public.profiles 
SET city = 'Mumbai'  -- Change to your city
WHERE id = 'YOUR-UUID';
```

---

## Step 6: Test Admin Access 🧪

1. **Logout** from your app (if logged in)
2. Go to http://localhost:3000/auth/login
3. **Login** with your credentials
4. You should be redirected to **`/admin`** (not `/dashboard`)
5. You should see **Admin Sidebar** with:
   - 📊 Dashboard
   - 👨‍⚕️ Doctors
   - 🧑 Patients
   - 📅 Appointments
   - 🔔 Notifications

✅ **Success**: You're at `/admin` with admin sidebar

---

## Step 7: Test Doctor Visibility 👀

1. Click **Appointments** in sidebar
2. Click **Book Appointment** button
3. You should see:
   - Consultation mode options (Online/Offline)
   - City filter (for offline)
   - **List of doctors** (not "No doctors available")

✅ **Success**: Doctors are visible!

---

## 🎉 All Done!

Your system now has:
- ✅ Admin access working
- ✅ Doctors visible
- ✅ City filtering working
- ✅ Database schema fixed

---

## 🔧 Troubleshooting

### Issue: Still redirected to `/dashboard` instead of `/admin`

**Solution**:
```sql
-- Check your role
SELECT id, email, role FROM public.profiles 
WHERE email = 'your-email@example.com';

-- If role is not 'admin', update it
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Then logout and login again.

### Issue: "No doctors available"

**Solution**:
```sql
-- Verify all doctors
UPDATE public.profiles 
SET is_verified = true
WHERE role = 'doctor';
```

### Issue: Can't find UUID

**Solution**:
```sql
-- List all users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;
```

Your UUID is the most recent one with your email.

### Issue: Profile doesn't exist

**Solution**:
```sql
-- Create profile for your auth user
INSERT INTO public.profiles (id, full_name, email, role, is_verified)
VALUES (
  'YOUR-UUID',
  'Your Name',
  'your-email@example.com',
  'admin',
  true
);
```

---

## 📚 Reference Files

- **fix_database_schema.sql** - Fix missing columns
- **create_admin_user.sql** - Create admin user
- **check_and_fix_doctors.sql** - Fix doctor issues
- **HOW_TO_GET_UUID.md** - Detailed UUID guide
- **TROUBLESHOOTING.md** - Common issues
- **QUICK_START.md** - Quick reference

---

## 🆘 Need Help?

1. Check browser console (F12) for errors
2. Check Supabase logs
3. Verify all SQL queries ran successfully
4. Make sure you logged out and back in after changes

---

## Quick Command Reference

```sql
-- Get your UUID
SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Make admin
UPDATE public.profiles SET role = 'admin', is_verified = true WHERE id = 'YOUR-UUID';

-- Verify doctors
UPDATE public.profiles SET is_verified = true WHERE role = 'doctor';

-- Add city
UPDATE public.profiles SET city = 'Mumbai' WHERE id = 'YOUR-UUID';

-- Check everything
SELECT id, email, role, is_verified, city FROM public.profiles;
```

Copy these commands, replace the values, and run them in order!
