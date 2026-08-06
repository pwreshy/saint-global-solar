export const CONFIG = {
  PAYSTACK_PUBLIC_KEY: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_f5ca548b75fd9f37b9ff2bfe93a1ae0f07021856',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://uivlyvewbdxvbitavfva.supabase.co',
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  ENABLE_DIGITAL_PRODUCTS: false, // Set to true to re-enable Courses and E-Books
  PRICE_KOBO: 25000000,           // ₦250,000 in kobo (sample Lithium Battery price)
  PRICE_NAIRA: 250000,
  PRICE_DISPLAY: '₦250,000',
  ORIGINAL_PRICE: '₦350,000',
  BOOK_TITLE: 'Premium Solar Pack',
  AUTHOR: 'Saint Global Solar',
}

