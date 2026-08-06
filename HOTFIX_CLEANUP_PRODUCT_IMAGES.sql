-- SAINT GLOBAL SOLAR - HOTFIX FOR REMOVING LOGO FALLBACK FROM PRODUCTS
-- Run this script in the Supabase Dashboard SQL Editor to clean up existing products that have the logo as their cover image.

UPDATE products 
SET cover_image = NULL 
WHERE cover_image = '/logo.png' 
   OR cover_image = '/logo_black.png';

-- Optional: Verify the update
SELECT id, title, cover_image FROM products;
