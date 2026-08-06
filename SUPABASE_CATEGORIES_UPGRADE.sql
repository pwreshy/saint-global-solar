-- ============================================================================
-- SAINT GLOBAL SOLAR - CATEGORIES & SUBCATEGORIES DATABASE UPGRADE
-- ============================================================================
-- Copy and run this script inside your Supabase Dashboard SQL Editor
-- (https://supabase.com/dashboard/project/figbzrnlgyrjkzxjwctj/sql/new)
-- ============================================================================

-- 1. Enable subcategories: Add parent_id to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- 2. Link products to categories: Add category_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. Update Row Level Security (RLS) policies for categories table
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view categories (required for shop storefront)
DROP POLICY IF EXISTS "Allow public read on categories" ON public.categories;
CREATE POLICY "Allow public read on categories" ON public.categories
  FOR SELECT USING (true);

-- Allow admins to perform write operations (create, update, delete)
DROP POLICY IF EXISTS "Allow admin write on categories" ON public.categories;
CREATE POLICY "Allow admin write on categories" ON public.categories
  FOR ALL USING (
    (auth.jwt() ->> 'email') IN (
      'nprecious.official@gmail.com' -- Add your admin email list here
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
