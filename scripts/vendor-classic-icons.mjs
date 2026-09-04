// Copy a small, reviewed subset of Tango 0.8.90 (public domain).
// Run: node scripts/vendor-classic-icons.mjs /path/to/tango-icon-theme-0.8.90
import fs from 'node:fs';
import path from 'node:path';

const source = process.argv[2];
if (!source) throw new Error('Pass the extracted Tango 0.8.90 directory');
const destination = path.resolve(import.meta.dirname, '../assets/images/classic-icons');
const icons = {
  profile: 'mimetypes/x-office-address-book',
  cv: 'mimetypes/x-office-document',
  projects: 'places/folder-saved-search',
  contact: 'apps/internet-mail',
  documents: 'places/folder',
  certificates: 'mimetypes/application-certificate',
  api: 'apps/utilities-terminal',
  n8n: 'places/network-workgroup',
  'my-computer': 'devices/computer',
  about: 'apps/system-users',
  notepad: 'apps/accessories-text-editor',
  wordpad: 'mimetypes/text-x-generic',
  'control-panel': 'categories/preferences-system'
};
fs.mkdirSync(destination, { recursive: true });
for (const [name, original] of Object.entries(icons)) {
  const svg = fs.readFileSync(path.join(source, 'scalable', original + '.svg'), 'utf8');
  // Tango sources use a 48 px canvas without a viewBox; add one for HiDPI scaling.
  fs.writeFileSync(path.join(destination, name + '.svg'), svg.replace('<svg', '<svg viewBox="0 0 48 48"'));
}
fs.copyFileSync(path.join(source, 'COPYING'), path.join(destination, 'COPYING'));
fs.copyFileSync(path.join(source, 'AUTHORS'), path.join(destination, 'AUTHORS'));
console.log('Vendored ' + Object.keys(icons).length + ' classic SVG icons.');
