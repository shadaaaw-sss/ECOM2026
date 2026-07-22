// next build with output:'standalone' doesn't copy public/ or .next/static
// into the standalone folder, so the server can't serve assets on `npm start`.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const standaloneDir = path.join(root, '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.warn('Skipping asset copy: .next/standalone not found (did the build produce a standalone output?)');
  process.exit(0);
}

const copies = [
  [path.join(root, 'public'), path.join(standaloneDir, 'public')],
  [path.join(root, '.next', 'static'), path.join(standaloneDir, '.next', 'static')],
];

for (const [src, dest] of copies) {
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Copied ${path.relative(root, src)} -> ${path.relative(root, dest)}`);
  }
}
