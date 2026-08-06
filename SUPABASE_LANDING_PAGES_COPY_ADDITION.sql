-- ============================================================================
-- SAINT GLOBAL SOLAR - LANDING PAGES COPY COLUMNS ADDITION
-- ============================================================================
-- Copy and run this script inside your Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/figbzrnlgyrjkzxjwctj/sql/new)
-- ============================================================================

-- Add copy columns to landing_pages table
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS headline TEXT DEFAULT 'Handcrafted Luxury For The Modern Gentleman',
ADD COLUMN IF NOT EXISTS subheadline TEXT DEFAULT 'Experience unmatched comfort and style with our premium bespoke collection, tailored to perfection.',
ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '["Bespoke craftsmanship with 100% genuine calfskin leather", "Ergonomic inner lining designed for all-day comfort", "Durable Italian outsoles crafted for stability and longevity"]'::jsonb;
