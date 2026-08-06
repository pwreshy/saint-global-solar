-- ═══════════════════════════════════════════════════════════════════════════
-- SAINT GLOBAL SOLAR — COMPLETE SUPABASE DATABASE SETUP & SCHEMAS
-- Run this ENTIRE script in your Supabase Dashboard → SQL Editor (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. EXTENSIONS & UTILITIES ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 2. DATABASE SCHEMA TABLES ───────────────────────────────────────────────

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email                TEXT UNIQUE NOT NULL,
  full_name            TEXT,
  avatar_url           TEXT,
  bio                  TEXT,
  role                 TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  affiliate_code       TEXT UNIQUE,
  affiliate_enabled    BOOLEAN DEFAULT TRUE,
  shipping_street      TEXT,
  shipping_city        TEXT,
  shipping_state       TEXT,
  shipping_postal_code TEXT,
  shipping_phone       TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  id         TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type           TEXT NOT NULL CHECK (type IN ('course','ebook','blueprint','bundle','physical')),
  title          TEXT NOT NULL,
  slug           TEXT UNIQUE,
  description    TEXT,
  price          INTEGER NOT NULL DEFAULT 0,
  old_price      INTEGER,
  cover_image    TEXT,
  features       JSONB DEFAULT '[]',
  is_published   BOOLEAN DEFAULT FALSE,
  is_featured    BOOLEAN DEFAULT FALSE,
  is_free        BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER DEFAULT NULL,
  weight         DECIMAL(10,2) DEFAULT 0.00,
  meta_title     TEXT,
  meta_desc      TEXT,
  packaging      TEXT,
  origin         TEXT,
  free_delivery  BOOLEAN DEFAULT FALSE,
  delivery_fee   INTEGER DEFAULT 0,
  shipping_charge_per_item BOOLEAN DEFAULT FALSE,
  images         TEXT[] DEFAULT '{}',
  variations     JSONB DEFAULT '{"attributes": [], "variants": []}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Courses Table (Extends products 1:1)
CREATE TABLE IF NOT EXISTS public.courses (
  id                  UUID REFERENCES public.products(id) ON DELETE CASCADE PRIMARY KEY,
  category_id         UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  level               TEXT DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced','all')),
  language            TEXT DEFAULT 'English',
  what_you_learn      JSONB DEFAULT '[]',
  requirements        JSONB DEFAULT '[]',
  who_is_for          JSONB DEFAULT '[]',
  preview_video       TEXT,
  certificate_enabled BOOLEAN DEFAULT TRUE,
  completion_threshold INTEGER DEFAULT 80,
  total_duration      TEXT,
  instructor          TEXT DEFAULT 'Solar Expert',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Modules Table
CREATE TABLE IF NOT EXISTS public.modules (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id   UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons Table
CREATE TABLE IF NOT EXISTS public.lessons (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id       UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  type            TEXT DEFAULT 'video' CHECK (type IN ('video','article','quiz')),
  video_url       TEXT,
  wistia_id       TEXT,
  article         TEXT,
  duration        TEXT DEFAULT '0m',
  overview        TEXT,
  resources       JSONB DEFAULT '[]',
  is_free_preview BOOLEAN DEFAULT FALSE,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson Progress Table
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id   UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  watched_sec INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference         TEXT UNIQUE NOT NULL,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_id        UUID REFERENCES public.products(id) ON DELETE SET NULL,
  amount            INTEGER NOT NULL,
  delivery_fee      INTEGER DEFAULT 0,
  discount_amount   INTEGER DEFAULT 0,
  total_paid        INTEGER NOT NULL,
  currency          TEXT DEFAULT 'NGN',
  status            TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','abandoned','cancelled','refunded')),
  payment_method    TEXT DEFAULT 'paystack',
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_phone    TEXT,
  shipping_street   TEXT,
  shipping_city     TEXT,
  shipping_state    TEXT,
  shipping_zip      TEXT,
  bank_receipt_url  TEXT,
  affiliate_code    TEXT,
  commission_earned INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id   UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  price      INTEGER NOT NULL,
  quantity   INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  type        TEXT DEFAULT 'percentage' CHECK (type IN ('percentage','fixed')),
  value       INTEGER NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  expires_at  TIMESTAMPTZ,
  is_active   BOOLEAN DEFAULT TRUE,
  product_id  UUID REFERENCES public.products(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments Table (Access rights to courses)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id  UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Q&A Questions Table
CREATE TABLE IF NOT EXISTS public.qna_questions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id   UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id   UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  question    TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Q&A Answers Table
CREATE TABLE IF NOT EXISTS public.qna_answers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.qna_questions(id) ON DELETE CASCADE NOT NULL,
  author_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  answer      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates Table
CREATE TABLE IF NOT EXISTS public.certificates (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  course_id      UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  certificate_no TEXT UNIQUE NOT NULL,
  issued_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id  UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  sent_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title        TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  summary      TEXT,
  content      TEXT NOT NULL,
  cover_image  TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliates Table
CREATE TABLE IF NOT EXISTS public.affiliates (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  affiliate_code TEXT UNIQUE NOT NULL,
  status         TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  tier           TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  commission_rate INTEGER DEFAULT 20, -- percentage
  custom_rate    NUMERIC(5,2),
  total_clicks   INTEGER DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  total_earnings BIGINT DEFAULT 0,
  total_paid     BIGINT DEFAULT 0,
  balance        INTEGER DEFAULT 0,
  payout_method  TEXT,
  payout_details TEXT,
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Referrals Table
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address   TEXT,
  referrer_url TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Commissions Table
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  order_id     UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount       INTEGER NOT NULL,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate Payouts Table
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  amount       INTEGER NOT NULL,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  reference    TEXT,
  processed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Upsell Offers Table
CREATE TABLE IF NOT EXISTS public.upsell_offers (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id       UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  upsell_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  discount_price   INTEGER NOT NULL,
  title            TEXT,
  description      TEXT,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Upsell Impressions Table
CREATE TABLE IF NOT EXISTS public.upsell_impressions (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id  UUID REFERENCES public.upsell_offers(id) ON DELETE CASCADE NOT NULL,
  action    TEXT CHECK (action IN ('show', 'accept', 'decline')),
  user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic Events Table
CREATE TABLE IF NOT EXISTS public.traffic_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visitor_id      TEXT,
  session_id      TEXT,
  event_name      TEXT,
  page_path       TEXT,
  referrer        TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_term        TEXT,
  utm_content     TEXT,
  metadata        JSONB DEFAULT '{}',
  ip_address      TEXT,
  affiliate_id    UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Funnel Campaigns Table
CREATE TABLE IF NOT EXISTS public.funnel_campaigns (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  settings   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freelance Training Lead List Table
CREATE TABLE IF NOT EXISTS public.freelance_training_list (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debug System Logs Table
CREATE TABLE IF NOT EXISTS public.debug_logs (
  id            SERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  action        TEXT,
  error_message TEXT,
  error_detail  TEXT,
  error_state   TEXT
);

-- ─── 3. FUNCTIONS & STORED PROCEDURES ────────────────────────────────────────

-- Helper function: Is Current User an Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin',
    FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Secure User Profile Creation on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.debug_logs (action, error_message, error_detail, error_state)
  VALUES ('handle_new_user', SQLERRM, SQLDETAIL, SQLSTATE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Safely Increment Coupon Usage on checkout
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.coupons
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 4. TRIGGERS REGISTRATION ────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure profile codes triggers do not crash Auth
DROP TRIGGER IF EXISTS trigger_assign_affiliate_code ON public.profiles;
DROP TRIGGER IF EXISTS trigger_sync_profile_role ON public.profiles;
DROP TRIGGER IF EXISTS trigger_create_affiliate ON public.profiles;

-- ─── 5. STORAGE BUCKETS CONFIGURATION ────────────────────────────────────────

-- Buckets Registration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('avatars', 'avatars', true, 3145728, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('course-assets', 'course-assets', true, null, null),
  ('payment-receipts', 'payment-receipts', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('products', 'products', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies: Avatars Bucket
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar auth upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatar auth update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar auth delete" ON storage.objects;

CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Avatar auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Avatar auth update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Avatar auth delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- Storage Policies: Course Assets Bucket
DROP POLICY IF EXISTS "course-assets public read" ON storage.objects;
DROP POLICY IF EXISTS "course-assets auth upload" ON storage.objects;
DROP POLICY IF EXISTS "course-assets auth delete" ON storage.objects;

CREATE POLICY "course-assets public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'course-assets');
CREATE POLICY "course-assets auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-assets');
CREATE POLICY "course-assets auth delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'course-assets');

-- Storage Policies: Products Bucket
DROP POLICY IF EXISTS "products public read" ON storage.objects;
DROP POLICY IF EXISTS "products auth upload" ON storage.objects;
DROP POLICY IF EXISTS "products auth delete" ON storage.objects;

CREATE POLICY "products public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'products');
CREATE POLICY "products auth upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');
CREATE POLICY "products auth delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'products');

-- Storage Policies: Payment Receipts Bucket
DROP POLICY IF EXISTS "Anyone can upload payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view payment receipts" ON storage.objects;

CREATE POLICY "Anyone can upload payment receipts" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'payment-receipts');
CREATE POLICY "Anyone can view payment receipts" ON storage.objects FOR SELECT TO public USING (bucket_id = 'payment-receipts');


-- ─── 6. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qna_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upsell_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freelance_training_list ENABLE ROW LEVEL SECURITY;

-- 6.1 PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT TO public USING (true);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (public.is_admin());

-- 6.2 SETTINGS POLICIES
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
DROP POLICY IF EXISTS "settings_admin" ON public.settings;

CREATE POLICY "settings_public_read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_admin" ON public.settings FOR ALL USING (public.is_admin());

-- 6.3 CATEGORIES POLICIES
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;

CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "categories_admin_write" ON public.categories FOR ALL USING (public.is_admin());

-- 6.4 PRODUCTS POLICIES
DROP POLICY IF EXISTS "products_public_read" ON public.products;
DROP POLICY IF EXISTS "products_admin_all" ON public.products;

CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "products_admin_all" ON public.products FOR ALL USING (public.is_admin());

-- 6.5 COURSES POLICIES
DROP POLICY IF EXISTS "courses_public_read" ON public.courses;
DROP POLICY IF EXISTS "courses_admin_all" ON public.courses;

CREATE POLICY "courses_public_read" ON public.courses FOR SELECT TO public USING (true);
CREATE POLICY "courses_admin_all" ON public.courses FOR ALL USING (public.is_admin());

-- 6.6 MODULES POLICIES
DROP POLICY IF EXISTS "modules_public_read" ON public.modules;
DROP POLICY IF EXISTS "modules_admin_all" ON public.modules;

CREATE POLICY "modules_public_read" ON public.modules FOR SELECT TO public USING (true);
CREATE POLICY "modules_admin_all" ON public.modules FOR ALL USING (public.is_admin());

-- 6.7 LESSONS POLICIES
DROP POLICY IF EXISTS "lessons_public_read" ON public.lessons;
DROP POLICY IF EXISTS "lessons_admin_all" ON public.lessons;

CREATE POLICY "lessons_public_read" ON public.lessons FOR SELECT USING (
  public.is_admin() OR
  is_free_preview = true OR
  EXISTS (
    SELECT 1 FROM public.enrollments 
    WHERE user_id = auth.uid() 
    AND course_id = (SELECT course_id FROM public.modules WHERE id = module_id)
  )
);
CREATE POLICY "lessons_admin_all" ON public.lessons FOR ALL USING (public.is_admin());

-- 6.8 LESSON PROGRESS POLICIES
DROP POLICY IF EXISTS "progress_self_all" ON public.lesson_progress;
DROP POLICY IF EXISTS "progress_admin_all" ON public.lesson_progress;

CREATE POLICY "progress_self_all" ON public.lesson_progress FOR ALL USING (user_id = auth.uid());
CREATE POLICY "progress_admin_all" ON public.lesson_progress FOR ALL USING (public.is_admin());

-- 6.9 ENROLLMENTS POLICIES
DROP POLICY IF EXISTS "enrollments_read_own" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_update_own" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_authenticated" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_insert_anon" ON public.enrollments;
DROP POLICY IF EXISTS "enrollments_admin_all" ON public.enrollments;

CREATE POLICY "enrollments_read_own" ON public.enrollments FOR SELECT TO authenticated, anon USING (user_id = auth.uid());
CREATE POLICY "enrollments_update_own" ON public.enrollments FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "enrollments_insert_authenticated" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "enrollments_insert_anon" ON public.enrollments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "enrollments_admin_all" ON public.enrollments FOR ALL USING (public.is_admin());

-- 6.10 ORDERS & ORDER ITEMS POLICIES
DROP POLICY IF EXISTS "orders_self_read" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_authenticated" ON public.orders;
DROP POLICY IF EXISTS "orders_insert_anon" ON public.orders;
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
DROP POLICY IF EXISTS "payment callback pending to paid" ON public.orders;

CREATE POLICY "orders_self_read" ON public.orders FOR SELECT USING (customer_email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR public.is_admin());
CREATE POLICY "orders_insert_authenticated" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "orders_insert_anon" ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "payment callback pending to paid" ON public.orders FOR UPDATE TO anon, authenticated USING (status = 'pending') WITH CHECK (status IN ('paid', 'failed', 'abandoned', 'cancelled'));
CREATE POLICY "orders_admin_all" ON public.orders FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "items_read_all" ON public.order_items;
DROP POLICY IF EXISTS "items_insert_all" ON public.order_items;
DROP POLICY IF EXISTS "items_admin_all" ON public.order_items;

CREATE POLICY "items_read_all" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "items_insert_all" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "items_admin_all" ON public.order_items FOR ALL USING (public.is_admin());

-- 6.11 COUPONS POLICIES
DROP POLICY IF EXISTS "anyone can read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "coupons_admin" ON public.coupons;

CREATE POLICY "anyone can read active coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));
CREATE POLICY "coupons_admin" ON public.coupons FOR ALL USING (public.is_admin());

-- 6.12 REVIEWS POLICIES
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_self_write" ON public.reviews;
DROP POLICY IF EXISTS "reviews_admin_all" ON public.reviews;

CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (is_approved = true OR public.is_admin());
CREATE POLICY "reviews_self_write" ON public.reviews FOR ALL USING (user_id = auth.uid());
CREATE POLICY "reviews_admin_all" ON public.reviews FOR ALL USING (public.is_admin());

-- 6.13 QNA QUESTIONS & ANSWERS POLICIES
DROP POLICY IF EXISTS "qna_q_enrolled_read" ON public.qna_questions;
DROP POLICY IF EXISTS "qna_q_self_write" ON public.qna_questions;
DROP POLICY IF EXISTS "qna_q_admin_all" ON public.qna_questions;

CREATE POLICY "qna_q_enrolled_read" ON public.qna_questions FOR SELECT USING (public.is_admin() OR EXISTS(SELECT 1 FROM public.enrollments WHERE user_id=auth.uid() AND course_id=public.qna_questions.course_id));
CREATE POLICY "qna_q_self_write" ON public.qna_questions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "qna_q_admin_all" ON public.qna_questions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "qna_a_public_read" ON public.qna_answers;
DROP POLICY IF EXISTS "qna_a_self_write" ON public.qna_answers;
DROP POLICY IF EXISTS "qna_a_admin_all" ON public.qna_answers;

CREATE POLICY "qna_a_public_read" ON public.qna_answers FOR SELECT TO public USING (true);
CREATE POLICY "qna_a_self_write" ON public.qna_answers FOR ALL USING (author_id = auth.uid());
CREATE POLICY "qna_a_admin_all" ON public.qna_answers FOR ALL USING (public.is_admin());

-- 6.14 CERTIFICATES POLICIES
DROP POLICY IF EXISTS "certs_public_read" ON public.certificates;
DROP POLICY IF EXISTS "certs_admin_all" ON public.certificates;

CREATE POLICY "certs_public_read" ON public.certificates FOR SELECT TO public USING (true);
CREATE POLICY "certs_admin_all" ON public.certificates FOR ALL USING (public.is_admin());

-- 6.15 ANNOUNCEMENTS POLICIES
DROP POLICY IF EXISTS "ann_enrolled_read" ON public.announcements;
DROP POLICY IF EXISTS "ann_admin_all" ON public.announcements;

CREATE POLICY "ann_enrolled_read" ON public.announcements FOR SELECT USING (
  public.is_admin() OR course_id IS NULL OR
  EXISTS(SELECT 1 FROM public.enrollments WHERE user_id=auth.uid() AND course_id=public.announcements.course_id)
);
CREATE POLICY "ann_admin_all" ON public.announcements FOR ALL USING (public.is_admin());

-- 6.16 BLOG POSTS POLICIES
DROP POLICY IF EXISTS "blog_public_read" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_admin_all" ON public.blog_posts;

CREATE POLICY "blog_public_read" ON public.blog_posts FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "blog_admin_all" ON public.blog_posts FOR ALL USING (public.is_admin());

-- 6.17 AFFILIATES POLICIES
DROP POLICY IF EXISTS "affiliates_self_read" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_self_insert" ON public.affiliates;
DROP POLICY IF EXISTS "affiliates_admin_all" ON public.affiliates;

CREATE POLICY "affiliates_self_read" ON public.affiliates FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "affiliates_self_insert" ON public.affiliates FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "affiliates_admin_all" ON public.affiliates FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "referrals_self_read" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "referrals_anon_insert" ON public.affiliate_referrals;
DROP POLICY IF EXISTS "referrals_admin_all" ON public.affiliate_referrals;

CREATE POLICY "referrals_self_read" ON public.affiliate_referrals FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "referrals_anon_insert" ON public.affiliate_referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "referrals_admin_all" ON public.affiliate_referrals FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "commissions_self_read" ON public.affiliate_commissions;
DROP POLICY IF EXISTS "commissions_admin_all" ON public.affiliate_commissions;

CREATE POLICY "commissions_self_read" ON public.affiliate_commissions FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "commissions_admin_all" ON public.affiliate_commissions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "payouts_self_read" ON public.affiliate_payouts;
DROP POLICY IF EXISTS "payouts_admin_all" ON public.affiliate_payouts;

CREATE POLICY "payouts_self_read" ON public.affiliate_payouts FOR SELECT USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "payouts_admin_all" ON public.affiliate_payouts FOR ALL USING (public.is_admin());

-- 6.18 UPSELL POLICIES
DROP POLICY IF EXISTS "upsell_offers_public_read" ON public.upsell_offers;
DROP POLICY IF EXISTS "upsell_offers_admin_all" ON public.upsell_offers;

CREATE POLICY "upsell_offers_public_read" ON public.upsell_offers FOR SELECT USING (is_active = TRUE OR public.is_admin());
CREATE POLICY "upsell_offers_admin_all" ON public.upsell_offers FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "upsell_impressions_anon_ins" ON public.upsell_impressions;
DROP POLICY IF EXISTS "upsell_impressions_auth_ins" ON public.upsell_impressions;
DROP POLICY IF EXISTS "upsell_impressions_admin_all" ON public.upsell_impressions;

CREATE POLICY "upsell_impressions_anon_ins" ON public.upsell_impressions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "upsell_impressions_auth_ins" ON public.upsell_impressions FOR INSERT WITH CHECK (true);
CREATE POLICY "upsell_impressions_admin_all" ON public.upsell_impressions FOR ALL USING (public.is_admin());

-- 6.19 TRAFFIC EVENTS POLICIES
DROP POLICY IF EXISTS "traffic_events_anon_ins" ON public.traffic_events;
DROP POLICY IF EXISTS "traffic_events_auth_ins" ON public.traffic_events;
DROP POLICY IF EXISTS "traffic_events_admin_all" ON public.traffic_events;

CREATE POLICY "traffic_events_anon_ins" ON public.traffic_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "traffic_events_auth_ins" ON public.traffic_events FOR INSERT WITH CHECK (true);
CREATE POLICY "traffic_events_admin_all" ON public.traffic_events FOR ALL USING (public.is_admin());

-- 6.20 FUNNEL CAMPAIGNS POLICIES
DROP POLICY IF EXISTS "funnel_campaigns_public_read" ON public.funnel_campaigns;
DROP POLICY IF EXISTS "funnel_campaigns_admin" ON public.funnel_campaigns;

CREATE POLICY "funnel_campaigns_public_read" ON public.funnel_campaigns FOR SELECT TO public USING (true);
CREATE POLICY "funnel_campaigns_admin" ON public.funnel_campaigns FOR ALL USING (public.is_admin());

-- 6.21 FREELANCE TRAINING LEAD LIST POLICIES
DROP POLICY IF EXISTS "Allow public insert on freelance_training_list" ON public.freelance_training_list;
DROP POLICY IF EXISTS "freelance_training_list_admin" ON public.freelance_training_list;

CREATE POLICY "Allow public insert on freelance_training_list" ON public.freelance_training_list FOR INSERT WITH CHECK (true);
CREATE POLICY "freelance_training_list_admin" ON public.freelance_training_list FOR ALL USING (public.is_admin());

-- 6.22 DEBUG LOGS POLICIES
DROP POLICY IF EXISTS "debug_logs_admin" ON public.debug_logs;
DROP POLICY IF EXISTS "debug_logs_insert" ON public.debug_logs;
DROP POLICY IF EXISTS "Allow public read on debug_logs" ON public.debug_logs;
DROP POLICY IF EXISTS "Allow public insert on debug_logs" ON public.debug_logs;

CREATE POLICY "Allow public read on debug_logs" ON public.debug_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on debug_logs" ON public.debug_logs FOR INSERT WITH CHECK (true);

-- 6.23 WISHLIST POLICIES
DROP POLICY IF EXISTS "wishlist_self" ON public.wishlist;
CREATE POLICY "wishlist_self" ON public.wishlist FOR ALL USING (user_id = auth.uid());


-- ─── 7. SAINT GLOBAL SOLAR BRAND SEED DATA ────────────────────────────────────
INSERT INTO public.settings (id, value) VALUES
  ('site_config', '{"platform_name":"SAINT GLOBAL SOLAR","support_email":"info@saintglobalsolar.com","refund_days":7}'),
  ('certificate_config', '{"completion_threshold":80,"template":"default"}'),
  ('affiliate_config', '{
    "enabled": true,
    "default_commission_rate": 10,
    "bronze_rate": 10,
    "silver_rate": 15,
    "gold_rate": 20,
    "platinum_rate": 25,
    "cookie_duration_days": 30,
    "min_payout_amount": 5000,
    "payout_currency": "NGN"
  }')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;

-- ─── 8. SEED ADMIN USER CONFIGURATION ────────────────────────────────────────
DO $$
DECLARE
  admin_id UUID := 'd0d93708-3cb7-4d7a-8fcd-1a89c8a98b47';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@saintglobalsolar.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'admin@saintglobalsolar.com',
      extensions.crypt('password123', extensions.gen_salt('bf', 10)),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "SAINT GLOBAL SOLAR Administrator"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  ELSE
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@saintglobalsolar.com';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = admin_id) THEN
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      admin_id,
      admin_id::text,
      admin_id,
      format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@saintglobalsolar.com')::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (admin_id, 'admin@saintglobalsolar.com', 'SAINT GLOBAL SOLAR Administrator', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@saintglobalsolar.com';
END $$;
