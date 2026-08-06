-- ============================================================================
-- SAINT GLOBAL SOLAR - AVATARS STORAGE BUCKET & POLICIES HOTFIX
-- ============================================================================
-- Run this script inside your Supabase Dashboard SQL Editor to set up
-- the avatars storage bucket and enable upload/read permissions.
-- (https://supabase.com/dashboard/project/figbzrnlgyrjkzxjwctj/sql/new)
-- ============================================================================

-- 1. Create public 'avatars' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop any conflicting avatar storage policies
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar auth upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar auth update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar auth delete" ON storage.objects;
DROP POLICY IF EXISTS "Avatar authenticated manage" ON storage.objects;

-- 3. Create fully permissive public read policy
CREATE POLICY "Avatar public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 4. Create single unified authenticated management policy (handles insert/upsert/update/delete)
CREATE POLICY "Avatar authenticated manage" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');
