import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const statSize = (file) => fs.statSync(path.join(root, file)).size;

const index = read('index.html');
const apps = read('js/apps.js');
const startMenu = read('js/startMenu.js');
const contact = read('components/contacto.html');
const projectsExplorer = read('components/proyectos-explorer.html');
const desktopCss = read('css/desktop.css');
const appsCss = read('css/xp-apps.css');
const manifest = read('site.webmanifest');
const mipc = read('mipc.html');

const checkedSources = [index, apps, startMenu, contact, projectsExplorer, desktopCss, appsCss, manifest, mipc];

const forbiddenEagerReferences = [
  ['wallpaper PNG prefetch', /rel="prefetch"\s+href="\.\/assets\/images\/zaratexp-hd-wallpaper\.png"/],
  ['login PNG eager background', /fondo_windows\.png\?v=6/],
  ['shutdown PNG eager image', /src="images\/off\.png"/],
  ['logoff PNG eager image', /src="images\/logoff-window\.png"/],
  ['logoff dialog PNG eager image', /src="images\/tarjeta_windos\.png"/],
  ['high resolution XP icon pack reference', /Windows XP High Resolution Icon Pack\/Windows XP Icons\//],
  ['eager high resolution volume icon', /assets\/images\/volume\.png/],
  ['eager high resolution power icon', /assets\/images\/power\.png/],
  ['eager high resolution restart icon', /assets\/images\/restart\.png/],
  ['eager high resolution shutdown icon', /assets\/images\/shutdown\.png/],
  ['eager high resolution logout icon', /images\/icons\/logout\.png/],
  ['eager oversized XP metadata icon', /assets\/images\/windows-xp-icon\.png/],
  ['about-me oversized PNG image', /images\/sobremi\/[^"')\s]+\.png/]
];

const requiredReferences = [
  ['wallpaper WebP prefetch', index, /assets\/images\/zaratexp-hd-wallpaper\.webp/],
  ['login WebP background', index, /fondo_windows\.webp\?v=6/],
  ['desktop WebP image-set', desktopCss, /zaratexp-hd-wallpaper\.webp/],
  ['clean wallpaper WebP image-set', appsCss, /fondo_windows\.webp/],
  ['lazy shutdown WebP', index, /data-lazy-src="images\/off\.webp"/],
  ['lazy logoff WebP', index, /data-lazy-src="images\/logoff-window\.webp"/],
  ['lazy dialog WebP', index, /data-lazy-src="images\/tarjeta_windos\.webp"/],
  ['small favicon icon', index, /assets\/images\/xp-small-icons\/windows-xp-icon-192\.png/],
  ['small manifest icon', manifest, /assets\/images\/xp-small-icons\/windows-xp-icon-512\.png/],
  ['small taskbar volume icon', index, /assets\/images\/xp-small-icons\/volume\.png/],
  ['small start menu power icon', index, /assets\/images\/xp-small-icons\/power\.png/],
  ['small start menu restart icon', index, /assets\/images\/xp-small-icons\/restart\.png/],
  ['small shutdown dialog icons', startMenu, /assets\/images\/xp-small-icons\/shutdown\.png/],
  ['small logoff dialog icon', startMenu, /assets\/images\/xp-small-icons\/logout\.png/],
  ['contact small toolbar icons', contact, /assets\/images\/xp-small-icons\/email\.png/],
  ['project explorer small navigation icons', projectsExplorer, /assets\/images\/xp-small-icons\/back\.png/],
  ['about-me WebP images', apps, /images\/sobremi\/fullstack-developer\.webp/],
  ['app small critical icon', apps, /assets\/images\/xp-small-icons\/critical\.png/],
  ['app small information icon', apps, /assets\/images\/xp-small-icons\/information\.png/],
  ['app small folder icons', apps, /assets\/images\/xp-small-icons\/folder-opened\.png/],
  ['resume small print icon', apps, /assets\/images\/xp-small-icons\/print-to-file\.png/]
];

const sizeBudgets = [
  ['assets/music/acdc-thunderstruck.mp3', 8 * 1024 * 1024],
  ['assets/music/soda-stereo-tratame-suavemente.mp3', 6 * 1024 * 1024],
  ['assets/images/zaratexp-hd-wallpaper.webp', 400 * 1024],
  ['fondo_windows.webp', 80 * 1024],
  ['images/tarjeta_windos.webp', 80 * 1024],
  ['images/off.webp', 500 * 1024],
  ['images/logoff-window.webp', 500 * 1024],
  ['assets/images/xp-small-icons/email.png', 16 * 1024],
  ['assets/images/xp-small-icons/outlook-express.png', 16 * 1024],
  ['assets/images/xp-small-icons/cut.png', 16 * 1024],
  ['assets/images/xp-small-icons/copy.png', 16 * 1024],
  ['assets/images/xp-small-icons/paste.png', 16 * 1024],
  ['assets/images/xp-small-icons/address-book.png', 16 * 1024],
  ['assets/images/xp-small-icons/critical.png', 16 * 1024],
  ['assets/images/xp-small-icons/back.png', 16 * 1024],
  ['assets/images/xp-small-icons/forward.png', 16 * 1024],
  ['assets/images/xp-small-icons/up.png', 16 * 1024],
  ['assets/images/xp-small-icons/detail-view.png', 16 * 1024],
  ['assets/images/xp-small-icons/volume.png', 16 * 1024],
  ['assets/images/xp-small-icons/power.png', 16 * 1024],
  ['assets/images/xp-small-icons/restart.png', 16 * 1024],
  ['assets/images/xp-small-icons/shutdown.png', 16 * 1024],
  ['assets/images/xp-small-icons/logout.png', 16 * 1024],
  ['assets/images/xp-small-icons/information.png', 16 * 1024],
  ['assets/images/xp-small-icons/folder-closed.png', 16 * 1024],
  ['assets/images/xp-small-icons/folder-opened.png', 16 * 1024],
  ['assets/images/xp-small-icons/save.png', 16 * 1024],
  ['assets/images/xp-small-icons/print-to-file.png', 16 * 1024],
  ['assets/images/xp-small-icons/search.png', 16 * 1024],
  ['assets/images/xp-small-icons/control-panel.png', 16 * 1024],
  ['assets/images/xp-small-icons/my-documents.png', 16 * 1024],
  ['assets/images/xp-small-icons/windows-xp-icon-192.png', 64 * 1024],
  ['assets/images/xp-small-icons/windows-xp-icon-512.png', 220 * 1024],
  ['images/sobremi/fullstack-developer.webp', 40 * 1024],
  ['images/sobremi/ai-automation.webp', 40 * 1024],
  ['images/sobremi/forzatech-founder.webp', 40 * 1024],
  ['images/sobremi/privacy-data-products.webp', 40 * 1024],
  ['images/sobremi/shipping-projects.webp', 40 * 1024]
];

const failures = [];

for (const [label, pattern] of forbiddenEagerReferences) {
  if (checkedSources.some((source) => pattern.test(source))) {
    failures.push(`Forbidden eager reference: ${label}`);
  }
}

for (const [label, source, pattern] of requiredReferences) {
  if (!pattern.test(source)) failures.push(`Missing optimized reference: ${label}`);
}

for (const [file, maxBytes] of sizeBudgets) {
  const size = statSize(file);
  if (size > maxBytes) {
    failures.push(`${file} is ${(size / 1024).toFixed(0)}KB, budget ${(maxBytes / 1024).toFixed(0)}KB`);
  }
}

if (failures.length) {
  console.error('Performance budget checks failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Performance budget checks passed: ${sizeBudgets.length} optimized assets`);
