import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const source = [
  'index.html',
  'README.md',
  'THIRD_PARTY_ASSETS.md',
  'site.webmanifest',
  'components/contacto.html',
  'minesweeper.html',
  'js/main.js',
  'js/boot.js',
  'js/desktop.js',
  'js/windows.js',
  'js/taskbar.js',
  'js/startMenu.js',
  'js/sounds.js',
  'js/apps.js',
  'js/data/projects.js',
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
  'css/minesweeper.css',
  'css/proyectos-explorer.css',
  'assets/images/hd-icons/minesweeper.svg',
  'assets/images/hd-icons/pinball.svg'
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
  ['official LinkedIn headline', /Software Analyst &amp; Project Manager \| Software, Data &amp; AI Solutions \| Java, Spring Boot, React, Oracle/],
  ['honest current role schema', /"jobTitle":\s*"Software Analyst & Project Manager"/],
  ['FDE opportunity positioning', /(?:orientado|oriented) (?:a|to) oportunidades?(?: de)? Forward Deployed Engineer|Profile oriented to Forward Deployed Engineer opportunities/i],
  ['institutional case evidence', /CUFRE[\s\S]*SIFEBU[\s\S]*CRIACO[\s\S]*OSINTArgy/],
  ['professional experience timeline', /2024 - Actualidad[\s\S]*2018 - 2024[\s\S]*2016 - 2018[\s\S]*2013 - 2015/],
  ['education and languages', /Google Data Analytics[\s\S]*Inglés/],
  ['CV PDF viewer', /Ivan_Zarate_CV\.pdf#view=FitH/],
  ['PDF Studio', /initPdfStudioApp/],
  ['documents explorer', /xp-documents-app/],
  ['projects explorer', /proyectos-explorer\.html/],
  ['project iframe fallback', /project-preview-fallback/],
  ['project impact evidence', /xp-project-impact/],
  ['contact validation', /Por favor completa todos los campos/],
  ['contact mail fallback', /mailto:ivan\.agustin\.95@gmail\.com/],
  ['API Center live integrations', /Open-Meteo[\s\S]*GitHub REST[\s\S]*(?:Countries \+ Banco Mundial|mledoze Countries)/],
  ['API cache/error states', /zarateXP\.apiCache[\s\S]*errorMarkup/],
  ['API cancellation and stale-response guard', /AbortController[\s\S]*assertCurrent[\s\S]*cancelAll/],
  ['API parallel execution and freshness', /Promise\.all\([\s\S]*preferFreshCache[\s\S]*data-api-last-updated/],
  ['API keyboard and provider health', /handleTabKeydown[\s\S]*data-api-health/],
  ['n8n flows demo', /data-flow-run/],
  ['Paint app', /initPaintApp/],
  ['Minesweeper exact difficulties', /beginner:[\s\S]*mines:\s*10[\s\S]*intermediate:[\s\S]*mines:\s*40[\s\S]*expert:[\s\S]*mines:\s*99/],
  ['Minesweeper first click and neighborhood safe', /firstClick[\s\S]*placeMines[\s\S]*safeCells[\s\S]*neighbors/],
  ['Minesweeper visible mines on loss', /data-mine[\s\S]*mine-visible[\s\S]*appendMineGlyph/],
  ['Minesweeper keyboard, touch and cleanup', /handleKey[\s\S]*LONG_PRESS_MS[\s\S]*destroyMinesweeperGame/],
  ['Solitaire app', /initSolitaireApp/],
  ['Solitaire validated persistence', /zarateXP\.solitaire\.v2[\s\S]*normalizeGameState[\s\S]*identities\.size !== 52/],
  ['Solitaire advanced interaction', /handleDoubleClick[\s\S]*handleDragStart[\s\S]*showHint[\s\S]*autoComplete/],
  ['Solitaire scoring, timer and cleanup', /scoreValue[\s\S]*startTimer[\s\S]*destroySolitaireApp/],
  ['Pinball app', /initPinballApp/],
  ['Pinball fixed-step physics', /FIXED_STEP[\s\S]*MAX_PHYSICS_STEPS[\s\S]*physicsStep/],
  ['Pinball missions and ball save', /BALL_SAVE_SECONDS[\s\S]*advanceMission[\s\S]*checkExtraBall/],
  ['Pinball accessibility and cleanup', /toggleFullscreen[\s\S]*destroyPinballApp/],
  ['Winamp Web Audio', /initWinampProApp/],
  ['Clippy assistant', /ClippyManager/],
  ['Clippy waits for desktop', /desktopReady[\s\S]*scheduleClippyWelcome/],
  ['responsive mobile guard', /landscape-block/],
  ['debug logs gated', /ZARATEXP_DEBUG/],
  ['XP icon dialogs', /(?:Windows XP High Resolution Icon Pack\/Windows XP Icons\/Critical\.png|assets\/images\/xp-small-icons\/critical\.png)/],
  ['reduced motion support', /prefers-reduced-motion/],
  ['scoped window transitions', /opacity 220ms[\s\S]*transform 220ms/],
  ['crisp window control glyphs', /window-control-glyph[\s\S]*close-btn/],
  ['animated window geometry', /animateWindowGeometry[\s\S]*scaleX[\s\S]*scaleY/],
  ['taskbar-aware minimize motion', /targetRect[\s\S]*targetX[\s\S]*targetY/],
  ['original XP-inspired game icons', /Buscaminas XP[\s\S]*Mina tridimensional azul[\s\S]*Pinball XP[\s\S]*Bola cromada/],
  ['third-party icon provenance', /original ZarateXP compositions[\s\S]*CC0 references/]
];

const missing = checks.filter(([, pattern]) => !pattern.test(source));
const forbidden = [
  ['unscoped CSS transitions', /transition:\s*all\b/],
  ['inline start menu opacity override', /class="startmenu"[^>]*opacity:\s*0/],
  ['false FDE login title', /class="user-title"[^>]*>\s*Forward Deployed Engineer/i],
  ['false FDE structured job title', /"jobTitle"\s*:\s*"[^"]*(?:Forward Deployed|\bFDE\b)/i],
  ['false FDE contact title', /class="contact-profile-strip"[\s\S]{0,500}<span>\s*Forward Deployed Engineering\s*<\/span>/i],
  ['false FDE author title', /Analista en Sistemas\s*\|\s*Forward Deployed Engineering/i],
  ['unqualified FDE profile label', /name:\s*['"]Perfil FDE['"]/i]
].filter(([, pattern]) => pattern.test(source));

if (missing.length || forbidden.length) {
  if (missing.length) {
    console.error('Missing experience checks:');
    for (const [label] of missing) console.error(`- ${label}`);
  }
  if (forbidden.length) {
    console.error('Forbidden experience patterns:');
    for (const [label] of forbidden) console.error(`- ${label}`);
  }
  process.exit(1);
}

console.log(`Experience checks passed: ${checks.length}/${checks.length}`);
