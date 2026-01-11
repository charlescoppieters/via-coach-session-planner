-- ========================================
-- STORAGE BUCKETS
-- ========================================

-- Coach profile pictures bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'coach-profiles',
    'coach-profiles',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Club logos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'club-logos',
    'club-logos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Session images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'session-images',
    'session-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STORAGE POLICIES - COACH PROFILES
-- ========================================

-- Authenticated users can upload profile pictures
CREATE POLICY "coach_profiles_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'coach-profiles');

-- Public can view profile pictures
CREATE POLICY "coach_profiles_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'coach-profiles');

-- Authenticated users can update their profile pictures
CREATE POLICY "coach_profiles_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'coach-profiles');

-- Authenticated users can delete their profile pictures
CREATE POLICY "coach_profiles_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'coach-profiles');

-- ========================================
-- STORAGE POLICIES - CLUB LOGOS
-- ========================================

-- Authenticated users can upload club logos
CREATE POLICY "club_logos_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'club-logos');

-- Public can view club logos
CREATE POLICY "club_logos_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'club-logos');

-- Authenticated users can update club logos
CREATE POLICY "club_logos_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'club-logos');

-- Authenticated users can delete club logos
CREATE POLICY "club_logos_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'club-logos');

-- ========================================
-- STORAGE POLICIES - SESSION IMAGES
-- ========================================

-- Authenticated users can upload session images
CREATE POLICY "session_images_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'session-images');

-- Public can view session images
CREATE POLICY "session_images_select" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'session-images');

-- Authenticated users can update session images
CREATE POLICY "session_images_update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'session-images');

-- Authenticated users can delete session images
CREATE POLICY "session_images_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'session-images');
