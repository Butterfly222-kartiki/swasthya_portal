# How to Get Your User UUID

## Method 1: From Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com
   - Login to your account
   - Select your project

2. **Navigate to Authentication**
   - Click on **Authentication** in the left sidebar
   - Click on **Users**

3. **Find Your User**
   - You'll see a list of all users
   - Find your user by email
   - The **UUID** is in the first column (looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

4. **Copy the UUID**
   - Click on the UUID to select it
   - Copy it (Ctrl+C or Cmd+C)

## Method 2: Using SQL Query

Run this in **Supabase SQL Editor**:

```sql
-- Find user by email
SELECT 
  id as uuid,
  email,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with your actual email.

## Method 3: Get All Users

If you're not sure which email you used:

```sql
-- List all users
SELECT 
  id as uuid,
  email,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;
```

## Method 4: From Your App (If Logged In)

If you're already logged in to your app, open browser console (F12) and run:

```javascript
// Get current user UUID
const { data: { user } } = await supabase.auth.getUser();
console.log('Your UUID:', user.id);
```

## What Does a UUID Look Like?

A UUID is a 36-character string that looks like:
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Format: `8-4-4-4-12` characters separated by hyphens

## Quick Reference: Get UUID and Make Admin

### Step-by-Step:

1. **Get UUID from Supabase Dashboard**
   - Authentication → Users → Copy the ID

2. **Run this SQL** (replace the UUID):
```sql
-- Check if profile exists
SELECT id, email, role FROM public.profiles 
WHERE id = 'YOUR-UUID-HERE';

-- If profile exists, make it admin
UPDATE public.profiles 
SET role = 'admin', is_verified = true
WHERE id = 'YOUR-UUID-HERE';

-- If profile doesn't exist, create it
INSERT INTO public.profiles (id, full_name, email, role, is_verified)
VALUES (
  'YOUR-UUID-HERE',
  'Your Name',
  'your-email@example.com',
  'admin',
  true
);
```

## Example with Real UUID

Let's say your UUID is: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

Then you would run:

```sql
UPDATE public.profiles 
SET role = 'admin', is_verified = true
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

## Troubleshooting

### Can't Find Your User in Dashboard?

You might not have registered yet. Register first:
1. Go to http://localhost:3000/auth/register
2. Create an account
3. Then find your UUID in Supabase Dashboard

### Multiple Users Showing?

Look for:
- Your email address
- Most recent `created_at` date
- Most recent `last_sign_in_at` date

### UUID Not Working?

Make sure:
- You copied the entire UUID (36 characters)
- No extra spaces before or after
- It's wrapped in single quotes in SQL: `'uuid-here'`

## Visual Guide

```
Supabase Dashboard
└── Authentication
    └── Users
        └── [List of Users]
            ├── ID (UUID) ← Copy this!
            ├── Email
            ├── Created
            └── Last Sign In
```

## After Getting UUID

1. Copy the UUID
2. Open `create_admin_user.sql`
3. Replace `YOUR-AUTH-USER-UUID` with your actual UUID
4. Run the SQL in Supabase SQL Editor
5. Logout and login again
6. You'll be redirected to `/admin`

## Quick SQL Template

Copy this, replace the values, and run:

```sql
-- Replace these values:
-- YOUR-UUID: Get from Supabase Dashboard → Authentication → Users
-- Your Name: Your actual name
-- your-email@example.com: Your actual email

UPDATE public.profiles 
SET role = 'admin', is_verified = true
WHERE id = 'YOUR-UUID';

-- Verify it worked
SELECT id, full_name, email, role, is_verified 
FROM public.profiles 
WHERE id = 'YOUR-UUID';
```

## Still Stuck?

Run this to see all your users and their UUIDs:

```sql
SELECT 
  u.id as uuid,
  u.email,
  p.full_name,
  p.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

This shows both auth users and their profiles, making it easy to find your UUID!
