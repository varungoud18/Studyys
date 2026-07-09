import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const destDir = path.join(__dirname, 'public');
const dest = path.join(destDir, 'pdf.worker.min.mjs');

try {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
  }
  fs.copyFileSync(src, dest);
  console.log('🎉 PDF.js worker copied to public folder successfully!');
} catch (err) {
  console.error('❌ Failed to copy worker file:', err);
}
