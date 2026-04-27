-- Add medical_certificate column to doctor_profiles table
-- Run this SQL directly in your PostgreSQL database

ALTER TABLE doctor_profiles
ADD COLUMN medical_certificate TEXT;

-- Update the verification_status enum to include 'certificate_pending'
-- Note: PostgreSQL enums cannot be modified, only new values can be added
DO $$ BEGIN
    ALTER TYPE verification_status ADD VALUE 'certificate_pending';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Verify the changes
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'doctor_profiles' AND column_name = 'medical_certificate';

SELECT enum_range(NULL::verification_status);
