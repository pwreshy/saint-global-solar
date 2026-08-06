const fs = require('fs');
const path = require('path');

const sweepDir = path.resolve('src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const colorReplacements = [
  { target: /#c5a880/gi, replacement: 'var(--gold)' },
  { target: /#dfb26c/gi, replacement: 'var(--gold)' },
  { target: /#c2410c/gi, replacement: '#ea580c' }, // normalize dark orange
  { target: /#332b21/gi, replacement: '#ffedd5' }  // normalize borders
];

walkDir(sweepDir, filePath => {
  const ext = path.extname(filePath);
  if (['.jsx', '.js', '.css', '.html'].includes(ext)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const rep of colorReplacements) {
      if (rep.target.test(content)) {
        content = content.replace(rep.target, rep.replacement);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated theme colors in: ${filePath}`);
    }
  }
});

console.log('Static theme color sweep completed.');
