import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const source = [
  'index.html',
  'README.md',
  'js/main.js',
  'js/boot.js',
  'js/desktop.js',
  'js/windows.js',
  'js/taskbar.js',
  'js/startMenu.js',
  'js/sounds.js',
  'js/apps.js',
  'js/api-center.js',
  'js/minesweeper.js',
  'js/paint.js',
  'js/pdf-studio.js',
  'js/pinball.js',
  'js/solitaire.js',
  'js/winamp-pro.js',
  'css/desktop.css',
  'css/windows.css',
  'css/taskbar.css',
  'css/startMenu.css',
  'css/xp-apps.css',
  'css/proyectos-explorer.css'
].map(read).join('\n');

const checks = [
  ['boot/login XP flow', /boot-screen/],
  ['keyboard login', /Iniciar sesion como Ivan Agustin Zarate/],
  ['desktop icons', /desktop-icon/],
  ['desktop keyboard access', /Shift\+F10|ContextMenu/],
  ['desktop context menu', /data-context-action="properties"/],
  ['restore icon positions', /zarateXP\.desktopIconPositions/],
  ['window focus/minimize/maximize/close', /toggleMaximize[\s\S]*closeWindow/],
  ['bounded resize', /maxBottom[\s\S]*nextWidth[\s\S]*nextHeight/],
  ['taskbar programs', /taskbar-program/],
  ['show desktop quick launch', /show-desktop-button/],
  ['start menu all programs', /all-programs-menu/],
  ['recent programs', /addRecentProgram/],
  ['system tray notifications', /notification-balloon/],
  ['generated XP sounds', /playTone[\s\S]*AudioContext/],
  ['sound controls', /soundEnabled[\s\S]*soundVolume/],
  ['control panel personalization', /zarateXP\.settings/],
  ['system properties', /system-properties/],
  ['recruiter route', /recruiter-route/],
  ['CV PDF viewer', /Ivan_Zarate_CV\.pdf#view=FitH/],
  ['PDF Studio', /initPdfStudioApp/],
  ['documents explorer', /xp-documents-app/],
  ['projects explorer', /proyectos-explorer\.html/],
  ['project iframe fallback', /project-preview-fallback/],
  ['project impact evidence', /xp-project-impact/],
  ['contact validation', /Por favor completa todos los campos/],
  ['contact mail fallback', /mailto:ivan\.agustin\.95@gmail\.com/],
  ['API Center live integrations', /Open-Meteo[\s\S]*GitHub REST[\s\S]*REST Countries/],
  ['API cache/error states', /zarateXP\.apiCache[\s\S]*errorMarkup/],
  ['n8n flows demo', /data-flow-run/],
  ['Paint app', /initPaintApp/],
  ['Minesweeper first click safe', /firstClick[\s\S]*placeMines/],
  ['Solitaire app', /initSolitaireApp/],
  ['Pinball app', /initPinballApp/],
  ['Winamp Web Audio', /initWinampProApp/],
  ['Clippy assistant', /ClippyManager/],
  ['responsive mobile guard', /landscape-block/],
  ['debug logs gated', /ZARATEXP_DEBUG/],
  ['XP icon dialogs', /Windows XP High Resolution Icon Pack\/Windows XP Icons\/Critical\.png/]
];

const missing = checks.filter(([, pattern]) => !pattern.test(source));

if (missing.length) {
  console.error('Missing experience checks:');
  for (const [label] of missing) console.error(`- ${label}`);
  process.exit(1);
}

console.log(`Experience checks passed: ${checks.length}/${checks.length}`);
