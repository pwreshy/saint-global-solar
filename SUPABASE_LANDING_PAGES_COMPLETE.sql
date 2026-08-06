-- ============================================================================
-- SAINT GLOBAL SOLAR - COMPLETE LANDING PAGES SCHEMA SETUP
-- ============================================================================
-- Run this script inside your Supabase Dashboard SQL Editor to set up
-- the landing_pages table, all copy columns, and storage permissions.
-- (https://supabase.com/dashboard/project/figbzrnlgyrjkzxjwctj/sql/new)
-- ============================================================================

-- 1. Create table with all required columns
CREATE TABLE IF NOT EXISTS public.landing_pages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  products        JSONB DEFAULT '[]'::jsonb, -- Array of { id_number, image_url, price, colors }
  headline        TEXT DEFAULT 'Premium Solar Solutions & Installation',
  subheadline     TEXT DEFAULT 'Uninterrupted power supply for your home and office with our premium solar panels, inverter setups, and batteries.',
  highlights      JSONB DEFAULT '["Bespoke solar installation by certified engineers", "24/7 technical support & premium warranty protection", "High-capacity lithium batteries built for longevity"]'::jsonb,
  show_disclaimer BOOLEAN DEFAULT true,
  disclaimer_text TEXT DEFAULT 'Please only submit an order if you have the cash fully ready and will be available to receive the delivery in 2 to 5 days. Every delivery attempt costs our business money for logistics and verification.',
  urgency_text    TEXT DEFAULT 'High Demand - Limited Systems Left',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- 3. Read policy for everyone
DROP POLICY IF EXISTS "Allow public read on landing_pages" ON public.landing_pages;
CREATE POLICY "Allow public read on landing_pages" ON public.landing_pages
  FOR SELECT USING (true);

-- 4. Edit policy for admins
DROP POLICY IF EXISTS "Allow admin write on landing_pages" ON public.landing_pages;
CREATE POLICY "Allow admin write on landing_pages" ON public.landing_pages
  FOR ALL USING (
    auth.email() IN (
      'nprecious.official@gmail.com',
      'ebonyjuliet15@yahoo.com',
      'pwreshyofficial@gmail.com',
      'admin@saintglobalsolar.com'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Create storage bucket for landing page images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('landing_pages', 'landing_pages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public access to landing page images" ON storage.objects;
CREATE POLICY "Public access to landing page images" ON storage.objects
  FOR SELECT USING (bucket_id = 'landing_pages');

DROP POLICY IF EXISTS "Admin upload landing page images" ON storage.objects;
CREATE POLICY "Admin upload landing page images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'landing_pages'
    AND (
      auth.email() IN (
        'nprecious.official@gmail.com',
        'ebonyjuliet15@yahoo.com',
        'pwreshyofficial@gmail.com',
        'admin@saintglobalsolar.com'
      )
      OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );
