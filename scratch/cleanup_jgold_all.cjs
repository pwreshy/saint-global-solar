const fs = require('fs');
const path = require('path');

const files = [
  'public/robots.txt',
  'public/sitemap.xml',
  'scratch/make_admin.js',
  'WIPE_DUMMY_DATA.sql',
  'SUPABASE_INTEGRATION_GUIDE.md',
  'src/components/WhatsAppWidget.jsx',
  'src/context/AuthContext.jsx',
  'src/pages/AdminLandingPages.jsx',
  'src/pages/AdminSettings.jsx',
  'src/pages/ForgotPasswordPage.jsx',
  'src/pages/HomePage.jsx',
  'src/pages/LMSDashboard.jsx',
  'src/pages/LandingPageRenderer.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/PaymentPage.jsx',
  'src/pages/ProductDetailsPage.jsx',
  'src/pages/RegisterPage.jsx',
  'src/pages/ResetPasswordPage.jsx',
  'src/pages/RefundPage.jsx',
  'src/pages/PrivacyPage.jsx',
  'src/pages/TermsPage.jsx',
  'src/pages/ThankYouPage.jsx',
  'src/pages/ProductsPage.jsx',
  'supabase/functions/send-email/index.ts',
  'supabase_master_setup.sql',
  'SUPABASE_CATEGORIES_UPGRADE.sql',
  'SUPABASE_LANDING_PAGES.sql',
  'SUPABASE_LANDING_PAGES_COPY_ADDITION.sql',
  'SUPABASE_LANDING_PAGES_DISCLAIMER_ADDITION.sql'
];

function performReplacements() {
  for (const relativePath of files) {
    const fullPath = path.resolve('c:/Users/Admin/Downloads/SAINT GLOBAL STAR', relativePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${fullPath}`);
      continue;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Perform regex replacements
    content = content.replace(/jgold\s*signatures/gi, 'SAINT GLOBAL SOLAR');
    content = content.replace(/jgold\s*store/gi, 'SAINT GLOBAL SOLAR Store');
    content = content.replace(/jgold/gi, 'SAINT GLOBAL SOLAR');

    // Fix double-replacements if any
    content = content.replace(/SAINT GLOBAL SOLAR SIGNATURES/g, 'SAINT GLOBAL SOLAR');
    content = content.replace(/SAINT GLOBAL SOLAR Store Store/g, 'SAINT GLOBAL SOLAR Store');
    content = content.replace(/SAINT GLOBAL SOLAR Product/g, 'Solar Product');
    content = content.replace(/SAINT GLOBAL SOLAR Stylist/g, 'Solar Expert');

    // Additional replacements for privacy/terms content
    if (relativePath === 'src/pages/TermsPage.jsx') {
      content = content.replace(/footwear and accessories/g, 'solar panels, lithium batteries, and general contracting');
      content = content.replace(/shoes, clothing accessories/g, 'solar equipment, backup batteries, and wiring materials');
      content = content.replace(/size exchange/g, 'equipment return/exchange');
      content = content.replace(/original signature box/g, 'original packaging');
    }

    if (relativePath === 'src/pages/PrivacyPage.jsx') {
      content = content.replace(/retail checkout, order panels, and styling query forms/g, 'solar sales panels, quotes, and project forms');
      content = content.replace(/genuine leather certificates/g, 'warranty and efficiency certificates');
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Cleaned JGOLD references in ${relativePath}`);
  }
}

performReplacements();
console.log('Global JGOLD cleanup completed!');
