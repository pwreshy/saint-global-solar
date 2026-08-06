-- ============================================================================
-- SAINT GLOBAL SOLAR - LANDING PAGES DISCLAIMER SWITCH & TEXT ADDITIONS
-- ============================================================================
-- Copy and run this script inside your Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/figbzrnlgyrjkzxjwctj/sql/new)
-- ============================================================================

ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS show_disclaimer BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS disclaimer_text TEXT DEFAULT 'Please only submit an order if you have the cash fully ready and will be available to receive the delivery in 2 to 5 days. Every delivery attempt costs our business money for logistics and verification. Time-wasters, window shoppers, and unserious orders are strictly prohibited.',
ADD COLUMN IF NOT EXISTS urgency_text TEXT DEFAULT 'High Demand - Limited Quantities Left';
