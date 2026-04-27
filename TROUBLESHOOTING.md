# Troubleshooting & Fixes - April 27, 2026

## Issues Resolved

### Issue 1: Logo click reloads dashboard instead of going to homepage
**Problem:** When clicking the logo while logged in on the dashboard, it was redirecting back to the dashboard instead of going to the homepage.

**Root Cause:** The logo was navigating to "/" (React app's landing page), which had a `PublicRoute` that automatically redirected logged-in users back to their dashboard.

**Fix Applied:** Updated logo click handler to navigate to `http://localhost:5000/` (Express server homepage) instead of the React app's "/" route.

**Files Changed:**
- `client/src/components/app-sidebar.tsx` - Changed from `navigate("/")` to `window.location.href = "http://localhost:5000/"`

**Expected Behavior:**
1. Click logo on dashboard → Goes to http://localhost:5000/ (Express homepage)
2. From homepage, click login/registration button → Goes to React app login/register page
3. Click login → Goes to dashboard

---

### Issue 2: Registration error "400: All fields are required"
**Problem:** When trying to sign up, especially with a medical certificate for doctors, getting error "All fields are required".

**Root Cause:** The `apiRequest` function was treating all data as JSON and using `JSON.stringify()` on it. However, FormData cannot be stringified as JSON - it needs to be sent as `multipart/form-data` with proper boundary markers.

**Fix Applied:**
1. Updated `apiRequest` in `client/src/lib/queryClient.ts` to detect FormData and NOT set `Content-Type` header (letting the browser handle it)
2. Updated backend `register_view` in `backend/api/views.py` to properly parse FormData using `request.POST.dict()` with field-by-field extraction

**Files Changed:**
- `client/src/lib/queryClient.ts` - Added FormData detection to handle multipart uploads
- `backend/api/views.py` - Updated FormData parsing to extract each field properly

**Expected Behavior:**
- Patient registration should work normally
- Doctor registration with medical certificate upload should now work
- Certificate status becomes "Certificate Pending" awaiting admin verification

---

### Issue 3: Doctor login not working
**Problem:** Attempting to login with a doctor account was failing completely.

**Root Cause:** The database schema for `doctor_profiles` table was missing the `medical_certificate` column. When the backend tried to save or fetch doctor profiles, it failed because the column didn't exist.

**Fix Applied:**
1. Added `medical_certificate TEXT` column to doctor_profiles table in `backend/api/management/commands/initdb.py`
2. Updated `verification_status` enum to include `'certificate_pending'` state
3. Created migration command to add the column to existing databases
4. Updated DoctorProfile model serializer to include medicalCertificate field

**Files Changed:**
- `backend/api/management/commands/initdb.py` - Added medical_certificate column and certificate_pending status
- `backend/api/management/commands/migrate_add_certificate.py` - New migration command for existing databases
- `backend/api/models.py` - Added medical_certificate field to DoctorProfile
- `backend/api/views.py` - Updated serializer to include medicalCertificate

**Expected Behavior:**
- Doctor login should now work
- Doctor accounts will have proper profile data including certificate field
- Existing databases can be migrated safely

---

## How to Apply Fixes

### For Fresh Installation
If starting fresh, the new schema will be applied automatically when you run:
```bash
python manage.py initdb
```

### For Existing Database
If you already have data in your database, run the migration command:
```bash
cd backend
python manage.py migrate_add_certificate
```

This command will:
- Check if `medical_certificate` column exists (if yes, skip)
- Add `medical_certificate` column to doctor_profiles table
- Update verification_status enum to include 'certificate_pending'

---

## Testing the Fixes

### Test Registration with Medical Certificate
1. Go to http://localhost:3000/register
2. Select "I'm a Dentist" role
3. Fill in all fields including uploading a PDF medical certificate
4. Submit → Should see success

### Test Logo Navigation
1. Login as any user
2. Go to dashboard/appointment page
3. Click the DentalCare logo
4. Should be redirected to http://localhost:5000/
5. Click "Login" or "Sign up" button
6. Should redirect to React app's login/register page
7. After logging in, should go back to dashboard

### Test Doctor Login
1. Go to http://localhost:3000/login
2. Use doctor demo account credentials:
   - Email: dr.emily.davis@dentalcare.com
   - Password: doctor123
3. Should login successfully and go to /doctor/dashboard

---

## Verification Steps

```bash
# 1. Check database schema has medical_certificate column
psql dentalcare_db -c "\d doctor_profiles"

# 2. Verify verification_status enum includes certificate_pending
psql dentalcare_db -c "SELECT enum_range(NULL::verification_status)"

# 3. Test registration API with FormData
curl -X POST http://localhost:8000/api/auth/register \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "email=john@test.com" \
  -F "password=password123" \
  -F "role=doctor" \
  -F "specialty=General Dentistry" \
  -F "licenseNumber=LIC123" \
  -F "medicalCertificate=@certificate.pdf"
```

---

## Summary of Changes

| Component | Changes | Impact |
|-----------|---------|--------|
| Frontend - queryClient | FormData detection | Enables file uploads |
| Frontend - app-sidebar | Logo navigation to http://localhost:5000 | Proper homepage flow |
| Backend - register_view | FormData field parsing | Handles multipart uploads |
| Backend - models | Added medical_certificate field | Stores certificate file path |
| Backend - serializer | Includes medicalCertificate | Returns field in API |
| Backend - initdb | Added column & enum value | New schema includes certificate support |
| Backend - migration | New command for existing DBs | Safe migration of existing data |

All fixes are backward compatible and don't break existing functionality.
