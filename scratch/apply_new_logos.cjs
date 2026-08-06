const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, targets) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [target, replacement] of Object.entries(targets)) {
    if (content.includes(target)) {
      content = content.split(target).join(replacement);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated logo references in: ${filePath}`);
  }
}

const fileList = [
  'index.html',
  'src/App.jsx',
  'src/components/Header.jsx',
  'src/components/Footer.jsx',
  'src/components/ContactWidgets.jsx',
  'src/context/AuthContext.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/RegisterPage.jsx',
  'src/pages/ForgotPasswordPage.jsx',
  'src/pages/ResetPasswordPage.jsx',
  'src/pages/PaymentPage.jsx',
  'src/pages/AccountPage.jsx',
  'src/pages/ProductDetailsPage.jsx',
  'src/pages/LandingPageRenderer.jsx',
  'src/pages/HomePage.jsx',
  'src/pages/AboutPage.jsx',
  'src/pages/FAQPage.jsx',
  'src/pages/QualityPage.jsx',
  'src/pages/ContactPage.jsx'
];

const replacements = {
  '/logo_white.jpg': '/logo_white.png',
  '/logo_black.jpg': '/logo_black.png',
  '/logo.webp': '/logo.png'
};

for (const relPath of fileList) {
  const fullPath = path.resolve(relPath);
  replaceInFile(fullPath, replacements);
}
console.log('Finished updating logo extensions across key files.');
