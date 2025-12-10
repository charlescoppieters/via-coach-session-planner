-- ========================================
-- FIX CLUBS RLS - Diagnose and fix club creation issue
-- ========================================

-- Step 1: Check what policies exist on clubs table
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'clubs';

-- Step 2: Check if RLS is enabled
SELECT
    relname,
    relrowsecurity
FROM pg_class
WHERE relname = 'clubs';

-- Step 3: Drop and recreate the clubs INSERT policy
DROP POLICY IF EXISTS "clubs_insert" ON clubs;

CREATE POLICY "clubs_insert" ON clubs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Step 4: Verify the policy was created
SELECT
    policyname,
    cmd,
    with_check
FROM pg_policies
WHERE tablename = 'clubs' AND policyname = 'clubs_insert';

-- Step 5: Test auth.uid() is working (run this while logged in)
-- SELECT auth.uid();
