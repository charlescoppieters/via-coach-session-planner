-- ========================================
-- PART 1: Add onboarding fields to coaches table
-- ========================================

ALTER TABLE coaches
ADD COLUMN profile_picture TEXT,
ADD COLUMN position TEXT,
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false NOT NULL;

-- Add comments to explain the fields
COMMENT ON COLUMN coaches.profile_picture IS 'URL to profile picture stored in Supabase Storage';
COMMENT ON COLUMN coaches.position IS 'Coach role: Head Coach, Assistant Coach, Director of Coaching, Technical Director, etc.';
COMMENT ON COLUMN coaches.onboarding_completed IS 'Tracks whether coach has completed the onboarding wizard';

-- ========================================
-- PART 2: Create Storage Bucket for Profile Pictures
-- ========================================

-- Create the coach-profiles bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coach-profiles',
  'coach-profiles',
  true,  -- Public bucket so profile pictures are accessible
  5242880,  -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- PART 3: Set up Storage Policies
-- ========================================

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Coaches can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'coach-profiles' AND
  (storage.foldername(name))[1] = 'profiles'
);

-- Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'coach-profiles');

-- Allow coaches to update their own profile pictures
CREATE POLICY "Coaches can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'coach-profiles');

-- Allow coaches to delete their own profile pictures
CREATE POLICY "Coaches can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'coach-profiles');
