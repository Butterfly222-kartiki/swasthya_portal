# Troubleshooting: "No Doctors Available"

## Quick Diagnosis

When you see "No doctors available", check the debug info that now appears on the page (yellow box):
- **Total doctors**: How many doctors are in the database
- **Filtered**: How many match your current filter
- **Selected city**: Which city filter is active
- **Type**: Online or in-person mode

## Common Issues & Solutions

### Issue 1: No Doctors in Database
**Symptom**: Debug shows "Total doctors: 0"

**Solution**: You need to create doctor accounts
1. Go to your auth signup page
2. Register a new account with role = "doctor"
3. Or use Supabase dashboard to manually insert a doctor profile

### Issue 2: Doctors Not Verified
**Symptom**: Debug shows "Total doctors: 0" but you know doctors exist

**Solution**: Doctors need to be verified
1. Open Supabase SQL Editor
2. Run the queries in `check_and_fix_doctors.sql`
3. Uncomment and run the UPDATE query to verify all doctors:
```sql
UPDATE public.profiles 
SET is_verified = true, verification_status = 'approved'
WHERE role = 'doctor' AND is_verified = false;
```

### Issue 3: City Filter Too Restrictive
**Symptom**: Debug shows "Total doctors: 5, Filtered: 0"

**Solution**: 
1. Click "View all doctors" button (if shown)
2. Or select "All Cities - Show All Doctors" from dropdown
3. Or add cities to doctor profiles

### Issue 4: Doctors Have No City
**Symptom**: City dropdown is empty or doctors don't show when filtering by city

**Solution**: Add cities to doctor profiles
1. Run the SQL in `check_and_fix_doctors.sql` to add sample cities
2. Or have doctors update their profiles with their city

### Issue 5: Database Connection Error
**Symptom**: Error message in bottom-left corner, console shows errors

**Solution**:
1. Check browser console (F12) for error messages
2. Verify Supabase connection in `.env.local`
3. Check if RLS policies are correctly set up

## Step-by-Step Fix

### Step 1: Run Database Migration
```sql
-- In Supabase SQL Editor
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
```

### Step 2: Check Doctor Accounts
```sql
-- In Supabase SQL Editor
SELECT id, full_name, email, role, is_verified, city 
FROM public.profiles 
WHERE role = 'doctor';
```

### Step 3: Verify Doctors
If you see doctors but they're not verified:
```sql
UPDATE public.profiles 
SET is_verified = true, verification_status = 'approved'
WHERE role = 'doctor';
```

### Step 4: Add Cities to Doctors
```sql
-- Example: Update specific doctor
UPDATE public.profiles 
SET city = 'Mumbai'
WHERE id = 'doctor-uuid-here';

-- Or update all doctors without cities
UPDATE public.profiles 
SET city = 'Mumbai'
WHERE role = 'doctor' AND city IS NULL;
```

### Step 5: Refresh the Page
- Go back to appointments page
- Click "Book Appointment"
- Check the debug info
- Doctors should now appear

## Testing Checklist

- [ ] Database migration run (city column added)
- [ ] At least one doctor account exists
- [ ] Doctor account is verified (`is_verified = true`)
- [ ] Doctor has a city set (optional but recommended)
- [ ] Patient profile has city set (for auto-filtering)
- [ ] Page shows debug info with doctor count
- [ ] Can see doctors when "All Cities" is selected
- [ ] Can filter doctors by city (if cities are set)

## Quick Test: Create a Test Doctor

Run this in Supabase SQL Editor to create a test doctor:

```sql
-- First, create an auth user (or use existing auth user ID)
-- Then insert into profiles:

INSERT INTO public.profiles (
  id, 
  full_name, 
  email, 
  role, 
  speciality, 
  city,
  is_verified, 
  verification_status
) VALUES (
  'YOUR-AUTH-USER-UUID-HERE',  -- Replace with actual auth user ID
  'Dr. Test Doctor',
  'testdoctor@example.com',
  'doctor',
  'General Physician',
  'Mumbai',
  true,
  'approved'
) ON CONFLICT (id) DO UPDATE 
SET role = 'doctor', is_verified = true, verification_status = 'approved';
```

## Still Not Working?

1. **Check browser console** (F12 → Console tab)
   - Look for error messages
   - Check the console.log output showing doctor count

2. **Check Network tab** (F12 → Network tab)
   - Look for failed API requests
   - Check if Supabase queries are returning data

3. **Verify RLS Policies**
   ```sql
   -- Check if profiles can be read
   SELECT * FROM public.profiles WHERE role = 'doctor' LIMIT 1;
   ```

4. **Check Environment Variables**
   - Verify `.env.local` has correct Supabase URL and keys
   - Restart dev server after changing env vars

## Debug Mode

The page now shows debug information in development mode. You should see a yellow box showing:
- Total doctors in database
- Filtered doctors count
- Selected city
- Consultation type

If you don't see this, make sure you're running in development mode (`npm run dev`).

## Contact Support

If none of these solutions work, provide:
1. Screenshot of the debug info (yellow box)
2. Browser console errors
3. Result of the SQL query: `SELECT COUNT(*) FROM public.profiles WHERE role = 'doctor' AND is_verified = true;`
