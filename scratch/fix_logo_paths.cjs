const fs = require('fs');
const path = require('path');

// 1. Fix HTML Loader
const indexHtmlPath = path.resolve('index.html');
if (fs.existsSync(indexHtmlPath)) {
  let content = fs.readFileSync(indexHtmlPath, 'utf8');
  content = content.replace(/\/logo\.(png|webp|svg)/g, '/logo_white.jpg');
  fs.writeFileSync(indexHtmlPath, content, 'utf8');
  console.log('Fixed logo path in index.html');
}

// 2. Fix Header.jsx (loads black logo)
const headerPath = path.resolve('src/components/Header.jsx');
if (fs.existsSync(headerPath)) {
  let content = fs.readFileSync(headerPath, 'utf8');
  content = content.replace(/\/logo\.(png|webp|svg)/g, '/logo_black.jpg');
  fs.writeFileSync(headerPath, content, 'utf8');
  console.log('Fixed logo paths in Header.jsx');
}

// 3. Fix Footer.jsx (loads white logo)
const footerPath = path.resolve('src/components/Footer.jsx');
if (fs.existsSync(footerPath)) {
  let content = fs.readFileSync(footerPath, 'utf8');
  content = content.replace(/\/logo\.(png|webp|svg)/g, '/logo_white.jpg');
  fs.writeFileSync(footerPath, content, 'utf8');
  console.log('Fixed logo paths in Footer.jsx');
}

// 4. Fix Auth and Public Pages (load black logo)
const lightBgFiles = [
  'src/context/AuthContext.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/RegisterPage.jsx',
  'src/pages/ForgotPasswordPage.jsx',
  'src/pages/ResetPasswordPage.jsx',
  'src/pages/PaymentPage.jsx',
  'src/pages/AccountPage.jsx',
  'src/components/WhatsAppWidget.jsx',
  'src/pages/ProductDetailsPage.jsx'
];

for (const relPath of lightBgFiles) {
  const fullPath = path.resolve(relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/\/logo\.(png|webp|svg)/g, '/logo_black.jpg');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed logo paths in ${relPath}`);
  }
}

// 5. Fix LandingPageRenderer.jsx (loads white logo on dark footer)
const landingRendererPath = path.resolve('src/pages/LandingPageRenderer.jsx');
if (fs.existsSync(landingRendererPath)) {
  let content = fs.readFileSync(landingRendererPath, 'utf8');
  content = content.replace(/\/logo\.(png|webp|svg)/g, '/logo_white.jpg');
  fs.writeFileSync(landingRendererPath, content, 'utf8');
  console.log('Fixed logo paths in LandingPageRenderer.jsx');
}
