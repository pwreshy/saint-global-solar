-- ============================================================================
-- SAINT GLOBAL SOLAR - LANDING PAGES DATABASE CONFIGURATION
-- ============================================================================
-- Copy and run this script inside your Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/figbzrnlgyrjkzxjwctj/sql/new)
-- ============================================================================

-- 1. Create landing_pages table
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  products    JSONB DEFAULT '[]'::jsonb, -- Array of { id_number, image_url, price, colors }
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- 3. Read policy for everyone (customers viewing landing pages)
DROP POLICY IF EXISTS "Allow public read on landing_pages" ON public.landing_pages;
CREATE POLICY "Allow public read on landing_pages" ON public.landing_pages
  FOR SELECT USING (true);

-- 4. Edit policy for admins
DROP POLICY IF EXISTS "Allow admin write on landing_pages" ON public.landing_pages;
CREATE POLICY "Allow admin write on landing_pages" ON public.landing_pages
  FOR ALL USING (
    (auth.jwt() ->> 'email') IN (
      'nprecious.official@gmail.com',
      'ebonyjuliet15@yahoo.com' -- Added as admin email
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Create storage bucket for landing page product images (if not exists)
-- This allows admins to upload images for custom landing pages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('landing_pages', 'landing_pages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for landing_pages bucket
DROP POLICY IF EXISTS "Public access to landing page images" ON storage.objects;
CREATE POLICY "Public access to landing page images" ON storage.objects
  FOR SELECT USING (bucket_id = 'landing_pages');

DROP POLICY IF EXISTS "Admin upload landing page images" ON storage.objects;
CREATE POLICY "Admin upload landing page images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'landing_pages'
    AND (
      (auth.jwt() ->> 'email') IN ('nprecious.official@gmail.com', 'ebonyjuliet15@yahoo.com')
      OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );
