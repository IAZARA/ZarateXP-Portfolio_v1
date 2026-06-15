import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourceExtensions = new Set(['.html', '.css', '.js', '.mjs']);
const assetExtensions = '(?:png|jpe?g|gif|webp|svg|mp3|pdf|html|css|js|mjs|woff2?|ico)';
const ignoredDirs = new Set(['.git', 'node_modules', 'output']);

function listSourceFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    if (ignoredDirs.has(entry.name)) return [];
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    if (sourceExtensions.has(path.extname(entry.name))) return [fullPath];
    return [];
  });
}

function cleanReference(ref) {
  return ref.split('#')[0].split('?')[0].trim();
}

function shouldSkip(ref) {
  return !ref
    || ref.includes('${')
    || /^[a-z][a-z0-9+.-]*:/i.test(ref)
    || (!ref.startsWith('./') && !ref.startsWith('../') && !ref.startsWith('/') && !/^(?:assets|images|components|css|js|scripts)\//.test(ref) && !new RegExp(`\\.${assetExtensions}(?:[#?].*)?$`, 'i').test(ref));
}

function existsFrom(baseDir, ref) {
  const cleanRef = cleanReference(ref);
  if (shouldSkip(cleanRef)) return true;
  if (cleanRef.startsWith('/')) return fs.existsSync(path.join(root, cleanRef.slice(1)));
  return fs.existsSync(path.resolve(baseDir, cleanRef));
}

function collectReferences(file) {
  const source = fs.readFileSync(file, 'utf8');
  const relativeFile = path.relative(root, file);
  const ext = path.extname(file);
  const refs = [];

  if (ext === '.html') {
    for (const match of source.matchAll(/\b(?:src|href|data)=["']([^"']+)["']/g)) {
      const baseDir = relativeFile.startsWith('components/') ? root : path.dirname(file);
      refs.push({ ref: match[1], baseDir, relativeFile });
    }
  }

  if (ext === '.css' || ext === '.html') {
    for (const match of source.matchAll(/url\((?!['"]?data:)(['"]?)([^)'"]+)\1\)/g)) {
      refs.push({ ref: match[2], baseDir: path.dirname(file), relativeFile });
    }
  }

  if (ext === '.js' || ext === '.mjs') {
    for (const match of source.matchAll(/\b(?:import|export)\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g)) {
      refs.push({ ref: match[1], baseDir: path.dirname(file), relativeFile });
    }

    const literalPattern = new RegExp(`["']((?:\\\\./|(?:assets|images|components|css|js|scripts)/|Ivan_|mipc|paint|minesweeper|logo|icono|osintargy|limpia)[^"'\\\\$]*\\.${assetExtensions})(?:[#?][^"']*)?["']`, 'g');
    for (const match of source.matchAll(literalPattern)) {
      const lineStart = source.lastIndexOf('\n', match.index) + 1;
      const lineEnd = source.indexOf('\n', match.index);
      const line = source.slice(lineStart, lineEnd === -1 ? source.length : lineEnd);
      const baseDir = /\b(?:import|export)\b/.test(line) && match[1].startsWith('./')
        ? path.dirname(file)
        : root;
      refs.push({ ref: match[1], baseDir, relativeFile });
    }
  }

  return refs;
}

const missing = [];
const checked = [];

for (const file of listSourceFiles(root)) {
  for (const item of collectReferences(file)) {
    checked.push(item);
    if (!existsFrom(item.baseDir, item.ref)) {
      missing.push(`${item.relativeFile}: ${item.ref}`);
    }
  }
}

if (missing.length) {
  console.error('Missing local asset references:');
  for (const item of [...new Set(missing)].sort()) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log(`Asset reference checks passed: ${checked.length}/${checked.length}`);
