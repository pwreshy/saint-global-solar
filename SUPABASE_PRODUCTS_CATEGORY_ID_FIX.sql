-- ============================================================================
-- SAINT GLOBAL SOLAR - PRODUCTS CATEGORY_ID HOTFIX
-- ============================================================================
-- Copy and run this script inside your Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/yoruhwfpmvbasapbzghd/sql/new)
-- ============================================================================

-- 1. Add category_id column to the products table if it doesn't exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 2. Force PostgREST to reload the schema cache so changes show up in the frontend immediately
NOTIFY pgrst, 'reload schema';
