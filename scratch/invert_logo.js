import Jimp from 'jimp';
import fs from 'fs';

const srcPath = 'C:\\Users\\Admin\\Downloads\\SAINT GLOBAL STAR WEB FILES\\Saint global star logo.jpeg';
const whiteDestPath = 'c:\\Users\\Admin\\Downloads\\SAINT GLOBAL STAR\\public\\logo_white.jpg';
const blackDestPath = 'c:\\Users\\Admin\\Downloads\\SAINT GLOBAL STAR\\public\\logo_black.jpg';

async function processLogo() {
  try {
    console.log('Copying original logo to public/logo_white.jpg...');
    fs.copyFileSync(srcPath, whiteDestPath);
    console.log('Original logo copied.');

    console.log('Loading logo with Jimp to create inverted black version...');
    const image = await Jimp.read(whiteDestPath);
    
    console.log('Inverting colors...');
    image.invert();
    
    console.log('Writing black version to public/logo_black.jpg...');
    await image.writeAsync(blackDestPath);
    console.log('Logo processing completed successfully!');
  } catch (err) {
    console.error('Error processing logo:', err);
  }
}

processLogo();
