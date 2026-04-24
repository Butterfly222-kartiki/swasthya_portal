# Admin Setup Guide - Swasthya Portal

## How to Create and Login as Admin

### Method 1: Convert Existing User to Admin (Recommended)

If you already have a user account:

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com
   - Open your project

2. **Get Your User ID**
   - Go to **Authentication** → **Users**
   - Find your user account
   - Copy the **UUID** (user ID)

3. **Run SQL to Make User Admin**
   - Go to **SQL Editor**
   - Run this query (replace `YOUR-USER-UUID` with your actual UUID):

```sql
-- Update existing user to admin
UPDATE public.profiles 
SET 
  role = 'admin',
  is_verified = true,
  verification_status = 'approved'
WHERE id = 'YOUR-USER-UUID';
```

4. **Logout and Login Again**
   - Go to your app: http://localhost:3000/auth/login
   - Login with your credentials
   - You'll be redirected to `/admin` dashboard

### Method 2: Create New Admin User

1. **Create Auth User in Supabase**
   - Go to Supabase Dashboard → **Authentication** → **Users**
   - Click **Add User** → **Create new user**
   - Enter email: `admin@swasthya.com` (or your preferred email)
   - Enter password
   - Click **Create user**
   - Copy the generated **UUID**

2. **Create Admin Profile**
   - Go to **SQL Editor**
   - Run this query (replace `YOUR-AUTH-USER-UUID` with the UUID from step 1):

```sql
-- Create admin profile
INSERT INTO public.profiles (
  id, 
  full_name, 
  email, 
  role, 
  is_verified, 
  verification_status
) VALUES (
  'YOUR-AUTH-USER-UUID',  -- Replace with actual UUID
  'Admin User',
  'admin@swasthya.com',   -- Replace with your email
  'admin',
  true,
  'approved'
) ON CONFLICT (id) DO UPDATE 
SET role = 'admin', is_verified = true, verification_status = 'approved';
```

3. **Login**
   - Go to: http://localhost:3000/auth/login
   - Email: `admin@swasthya.com`
   - Password: (the one you set)
   - You'll be redirected to `/admin`

### Method 3: Register and Convert

1. **Register a New Account**
   - Go to: http://localhost:3000/auth/register
   - Fill in the form as a **Patient** (easier, no document upload)
   - Complete registration

2. **Get Your User ID**
   - After registration, go to Supabase Dashboard
   - Authentication → Users
   - Find your newly created user
   - Copy the UUID

3. **Convert to Admin**
   - Run the SQL from Method 1 with your UUID

4. **Logout and Login Again**

## Verify Admin Access

After logging in as admin, you should:

1. **Be redirected to** `/admin` (not `/dashboard`)
2. **See Admin Sidebar** with options:
   - Dashboard
   - Doctors (verify/manage)
   - Patients
   - Appointments
   - Notifications

3. **Have access to**:
   - Doctor verification
   - User management
   - System statistics
   - Send notifications

## Admin Features

### Admin Dashboard (`/admin`)
- View total doctors, patients, appointments
- See pending doctor verifications
- Quick access to verification queue

### Doctor Management (`/admin/doctors`)
- View all doctors
- Verify/reject doctor applications
- View uploaded documents (license, certificates)
- Search and filter doctors

### Patient Management (`/admin/patients`)
- View all patients
- Manage patient accounts

### Appointments (`/admin/appointments`)
- View all appointments in the system
- Monitor appointment status

### Notifications (`/admin/notifications`)
- Send notifications to all users
- Send to specific user groups (doctors/patients)

## Quick SQL Commands

### Check Current Admins
```sql
SELECT id, full_name, email, role 
FROM public.profiles 
WHERE role = 'admin';
```

### Make Multiple Users Admin
```sql
UPDATE public.profiles 
SET role = 'admin', is_verified = true, verification_status = 'approved'
WHERE email IN ('admin1@example.com', 'admin2@example.com');
```

### Remove Admin Access
```sql
UPDATE public.profiles 
SET role = 'patient'
WHERE id = 'USER-UUID-HERE';
```

### Create Admin Directly (if profile doesn't exist)
```sql
-- First create auth user in Supabase Dashboard, then:
INSERT INTO public.profiles (
  id, 
  full_name, 
  email, 
  role, 
  is_verified, 
  verification_status
) VALUES (
  'AUTH-USER-UUID',
  'Admin Name',
  'admin@example.com',
  'admin',
  true,
  'approved'
);
```

## Troubleshooting

### Issue: Redirected to /dashboard instead of /admin
**Solution**: Your role is not set to 'admin'
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```
Then logout and login again.

### Issue: "Access Denied" or 404 on /admin
**Solution**: Check the admin layout protection
- Verify your role is 'admin' in database
- Clear browser cache and cookies
- Logout and login again

### Issue: Can't see admin sidebar
**Solution**: 
- Check if you're actually on `/admin` URL
- Verify role in database
- Check browser console for errors

### Issue: Profile doesn't exist
**Solution**: The auth user exists but profile wasn't created
```sql
-- Check if profile exists
SELECT * FROM public.profiles WHERE email = 'your-email@example.com';

-- If not, create it
INSERT INTO public.profiles (id, full_name, email, role, is_verified, verification_status)
VALUES ('YOUR-AUTH-UUID', 'Your Name', 'your-email@example.com', 'admin', true, 'approved');
```

## Security Notes

1. **Protect Admin Credentials**: Use strong passwords for admin accounts
2. **Limit Admin Access**: Only create admin accounts for trusted users
3. **Monitor Admin Actions**: Keep track of who has admin access
4. **Regular Audits**: Periodically check admin user list

## Default Admin Credentials (if you set them up)

After running the setup, you can use:
- **Email**: `admin@swasthya.com` (or whatever you set)
- **Password**: (the one you created in Supabase)
- **URL**: http://localhost:3000/auth/login

## Next Steps After Admin Login

1. **Verify Pending Doctors**
   - Go to Admin Dashboard
   - Click on "Doctors Awaiting Verification"
   - Review and approve/reject

2. **Add Sample Doctors** (for testing)
   - Register as doctor
   - Login as admin
   - Verify the doctor

3. **Configure System Settings**
   - Add cities to doctor profiles
   - Set up notification templates
   - Review appointment settings

## Quick Test

To verify admin access is working:

1. Login with admin credentials
2. Check URL is `/admin` (not `/dashboard`)
3. Try accessing `/admin/doctors`
4. Try accessing `/admin/patients`
5. All should work without redirects

If any redirect to `/dashboard`, your role is not properly set to 'admin'.
