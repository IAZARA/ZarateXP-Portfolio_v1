// Arma dist/ con lo que el navegador necesita y nada más: sin scripts, tests,
// documentación interna ni originales de diseño. También fija una única clave de
// caché por versión del código, así ya no hay que subir los ?v= a mano.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, process.env.SITE_OUT_DIR || 'dist');

// Rutas que existen para desarrollar o documentar el repo, no para el sitio.
const excludedPrefixes = ['.github/', 'docs/', 'scripts/', 'tests/', 'assets/readme/'];
const excludedFiles = new Set(['.gitignore', 'AGENTS.md', 'README.md', 'package.json', 'package-lock.json']);
// La imagen social sí se publica: la leen LinkedIn, WhatsApp y otros al compartir el link.
const includedExceptions = new Set(['assets/readme/zaratexp-social-ai-architect.jpg']);

const versionedExtensions = new Set(['.html', '.js', '.css']);
// Los JSON de datos (actividad de GitHub) cambian a diario y se piden aparte:
// no deben invalidar la caché del código.
const hashedExtensions = new Set(['.html', '.js', '.css', '.webmanifest']);

function trackedFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], { cwd: root });
  return output.toString('utf8').split('\0').filter(Boolean);
}

function isPublished(file) {
  if (includedExceptions.has(file)) return true;
  if (excludedFiles.has(file)) return false;
  return !excludedPrefixes.some((prefix) => file.startsWith(prefix));
}

function buildVersion(files) {
  const hash = createHash('sha256');
  for (const file of files) {
    if (!hashedExtensions.has(path.extname(file))) continue;
    hash.update(file);
    hash.update(fs.readFileSync(path.join(root, file)));
  }
  return hash.digest('hex').slice(0, 12);
}

function applyVersion(source, file, version) {
  // Reemplaza cualquier clave previa de módulos, hojas de estilo y fragmentos HTML.
  let result = source.replace(/(\.(?:js|css|html))\?v=[A-Za-z0-9._-]+/g, `$1?v=${version}`);
  if (file.endsWith('.html')) {
    // Hojas de estilo y scripts locales que todavía no tenían clave.
    result = result.replace(/(<link\b[^>]*\bhref=")((?!https?:|\/\/)[^"?#]+\.css)(")/g, `$1$2?v=${version}$3`);
    result = result.replace(/(<script\b[^>]*\bsrc=")((?!https?:|\/\/)[^"?#]+\.js)(")/g, `$1$2?v=${version}$3`);
  }
  if (file.endsWith('.js')) {
    // Imports estáticos relativos sin clave: todos los módulos comparten la misma URL.
    result = result.replace(/(\b(?:import|export)\s+(?:[^'"]+\s+from\s+)?["'])(\.{1,2}\/[^"'?#]+\.js)(["'])/g, `$1$2?v=${version}$3`);
  }
  return result;
}

const files = trackedFiles().filter(isPublished);
const version = buildVersion(files);

fs.rmSync(outDir, { recursive: true, force: true });
let bytes = 0;
for (const file of files) {
  const source = path.join(root, file);
  const target = path.join(outDir, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (versionedExtensions.has(path.extname(file))) {
    const content = applyVersion(fs.readFileSync(source, 'utf8'), file, version);
    fs.writeFileSync(target, content);
    bytes += Buffer.byteLength(content);
  } else {
    fs.copyFileSync(source, target);
    bytes += fs.statSync(source).size;
  }
}
fs.writeFileSync(path.join(outDir, 'version.txt'), `${version}\n`);

console.log(`Sitio armado en ${path.relative(root, outDir)}/: ${files.length} archivos, ${(bytes / 1048576).toFixed(1)} MB, versión ${version}`);
