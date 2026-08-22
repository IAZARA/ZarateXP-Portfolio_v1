import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

function createVerifiedGitHubFixture() {
  const end = new Date();
  end.setUTCHours(12, 0, 0, 0);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 364);
  let bonusRemaining = 72;
  const days = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    let count = 0;
    if (index % 2 === 0) {
      count = 4 + (bonusRemaining > 0 ? 1 : 0);
      bonusRemaining -= bonusRemaining > 0 ? 1 : 0;
    }
    return {
      date: date.toISOString().slice(0, 10),
      weekday: date.getUTCDay(),
      count,
      level: count === 0 ? 0 : count >= 5 ? 4 : 3
    };
  });
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    const chunk = days.slice(index, index + 7);
    weeks.push({ firstDay: chunk[0].date, days: chunk });
  }
  const activeDays = days.filter((day) => day.count > 0);
  return {
    schemaVersion: 3,
    generatedAt: new Date().toISOString(),
    source: { provider: 'GitHub GraphQL API', scope: 'authenticated-owner', viewerLogin: 'IAZARA', privateCountsAnonymized: true, privateActivityIncluded: true, valid: true },
    profile: { username: 'IAZARA', name: 'Ivan Agustin Zarate', url: 'https://github.com/IAZARA', avatarUrl: '', publicRepositories: 15 },
    period: { from: days[0].date, to: days.at(-1).date },
    summary: {
      totalContributions: days.reduce((sum, day) => sum + day.count, 0),
      activeDays: activeDays.length,
      longestStreak: 1,
      currentStreak: days.at(-1).count > 0 ? 1 : 0,
      busiestDay: activeDays.reduce((best, day) => !best || day.count > best.count ? day : best, null),
      latestActiveDay: activeDays.at(-1)
    },
    weeks
  };
}

const githubActivityFixture = createVerifiedGitHubFixture();

function createStaticServer() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://localhost');
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
    const filePath = path.normalize(path.join(root, requestedPath));

    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    const fileSize = fs.statSync(filePath).size;
    const range = request.headers.range;

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = Number(match[1]);
        const end = match[2] ? Number(match[2]) : fileSize - 1;
        response.writeHead(206, {
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
        });
        fs.createReadStream(filePath, { start, end }).pipe(response);
        return;
      }
    }

    response.writeHead(200, {
      'Accept-Ranges': 'bytes',
      'Content-Length': fileSize,
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream'
    });
    fs.createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function jsonRoute(route, payload, headers = {}) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json; charset=utf-8',
    headers,
    body: JSON.stringify(payload)
  });
}

async function installApiFixtures(page) {
  await page.route('**/assets/data/github-activity.json*', (route) => jsonRoute(route, githubActivityFixture));
  const countryFixture = {
    name: {
      common: 'Argentina',
      official: 'República Argentina',
      native: { spa: { common: 'Argentina', official: 'República Argentina' } }
    },
    capital: ['Buenos Aires'],
    region: 'Americas',
    subregion: 'South America',
    population: 45808747,
    area: 2780400,
    languages: { spa: 'Spanish' },
    currencies: { ARS: { name: 'Argentine peso', symbol: '$' } },
    timezones: ['UTC-03:00'],
    cca2: '',
    cca3: 'ARG',
    borders: ['BOL', 'BRA', 'CHL', 'PRY', 'URY']
  };
  const countries = [
    countryFixture,
    ...Array.from({ length: 101 }, (_, index) => ({
      name: { common: `Fixture Country ${index}`, official: `Fixture Country ${index}` },
      cca3: `X${String(index).padStart(2, '0')}`,
      capital: [],
      region: 'Fixture',
      area: 1,
      population: 1,
      languages: {},
      currencies: {},
      timezones: []
    }))
  ];

  await page.route('https://geocoding-api.open-meteo.com/**', (route) => jsonRoute(route, {
    results: [{
      id: 3435910,
      name: 'Buenos Aires',
      latitude: -34.6037,
      longitude: -58.3816,
      country: 'Argentina',
      admin1: 'Ciudad Autónoma de Buenos Aires',
      population: 3120612,
      timezone: 'America/Argentina/Buenos_Aires'
    }]
  }));

  await page.route('https://api.open-meteo.com/**', (route) => jsonRoute(route, {
    timezone: 'America/Argentina/Buenos_Aires',
    timezone_abbreviation: '-03',
    current: {
      time: '2026-07-11T18:00',
      temperature_2m: 13.4,
      relative_humidity_2m: 72,
      apparent_temperature: 12.1,
      precipitation: 0,
      wind_speed_10m: 11.5,
      weather_code: 2,
      is_day: 1
    },
    current_units: {
      relative_humidity_2m: '%',
      precipitation: 'mm',
      wind_speed_10m: 'km/h'
    },
    daily: {
      time: ['2026-07-11', '2026-07-12', '2026-07-13', '2026-07-14', '2026-07-15'],
      weather_code: [2, 3, 61, 1, 0],
      temperature_2m_max: [16, 17, 14, 18, 19],
      temperature_2m_min: [8, 9, 7, 8, 10],
      precipitation_probability_max: [10, 20, 70, 15, 5],
      sunrise: [],
      sunset: []
    }
  }));

  await page.route('https://api.github.com/users/**', (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/repos')) {
      return jsonRoute(route, [{
        id: 1,
        name: 'ZarateXP-Portfolio_v1',
        html_url: 'https://github.com/IAZARA/ZarateXP-Portfolio_v1',
        description: 'Portfolio interactivo con estética Windows XP.',
        language: 'JavaScript',
        stargazers_count: 7,
        forks_count: 2,
        pushed_at: '2026-07-11T12:00:00Z',
        archived: false
      }], { 'x-ratelimit-remaining': '58', 'x-ratelimit-reset': '1783800000' });
    }
    return jsonRoute(route, {
      login: 'IAZARA',
      name: 'Ivan Agustin Zarate',
      html_url: 'https://github.com/IAZARA',
      public_repos: 18,
      followers: 12,
      following: 9,
      location: 'Buenos Aires, Argentina',
      bio: 'Software Analyst & Project Manager | Software, Data & AI Solutions'
    }, { 'x-ratelimit-remaining': '59', 'x-ratelimit-reset': '1783800000' });
  });

  await page.route('https://raw.githubusercontent.com/mledoze/countries/**', (route) => jsonRoute(route, countries));
  await page.route('https://api.worldbank.org/**', (route) => jsonRoute(route, [
    { page: 1, pages: 1, per_page: 1, total: 1 },
    [{ countryiso3code: 'ARG', date: '2025', value: 45851378 }]
  ]));
}

async function openApp(page, appId) {
  await page.evaluate((id) => window.zarateXP.appManager.openApp(id), appId);
  const appWindow = page.locator(`#windows-container .window[data-window-id="${appId}"]`);
  await appWindow.waitFor({ state: 'visible', timeout: 12000 });
  return appWindow;
}

const MOBILE_HOME_IDS = [
  'recruiter-route',
  'resume',
  'projects',
  'contact',
  'documents',
  'api-center',
  'n8n-flows',
  'my-computer',
  'pinball'
];

const MOBILE_GROUPED_IDS = [
  'about-me',
  'certificates',
  'winamp',
  'notepad',
  'control-panel',
  'pdf-studio',
  'minesweeper',
  'solitaire'
];

async function auditMobileDesktopViewport(browser, baseUrl, viewport) {
  const context = await browser.newContext({
    viewport,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  try {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('zarateXP_session', 'active');
      } catch (error) {
        // about:blank no expone localStorage; la inicializacion se repite al navegar.
      }
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.desktop', { state: 'visible', timeout: 12000 });
    await page.waitForFunction(() => Boolean(window.zarateXP?.desktopManager && window.zarateXP?.appManager?.windowManager), null, { timeout: 12000 });

    const desktopAudit = await page.evaluate(({ expectedHome, expectedGrouped }) => {
      const icons = Array.from(document.querySelectorAll('.desktop-icons > .desktop-icon'));
      const visible = icons.filter((icon) => getComputedStyle(icon).display !== 'none');
      const visibleByOrder = [...visible].sort((left, right) => Number(left.dataset.mobileOrder) - Number(right.dataset.mobileOrder));
      const taskbarRect = document.querySelector('.taskbar').getBoundingClientRect();
      const rects = visible.map((icon) => ({ id: icon.dataset.programName, rect: icon.getBoundingClientRect() }));
      const overlapPairs = [];
      for (let leftIndex = 0; leftIndex < rects.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < rects.length; rightIndex += 1) {
          const left = rects[leftIndex];
          const right = rects[rightIndex];
          const overlaps = left.rect.left < right.rect.right
            && left.rect.right > right.rect.left
            && left.rect.top < right.rect.bottom
            && left.rect.bottom > right.rect.top;
          if (overlaps) overlapPairs.push(`${left.id}:${right.id}`);
        }
      }

      return {
        visibleIds: visibleByOrder.map((icon) => icon.dataset.programName),
        groupedHidden: expectedGrouped.every((id) => {
          const icon = icons.find((candidate) => candidate.dataset.programName === id);
          return icon && getComputedStyle(icon).display === 'none';
        }),
        declarativeOrder: visibleByOrder.every((icon, index) => Number(icon.dataset.mobileOrder) === index + 1),
        twoColumns: new Set(rects.map(({ rect }) => Math.round(rect.left))).size === 2,
        contained: rects.every(({ rect }) => rect.left >= -1
          && rect.right <= window.innerWidth + 1
          && rect.top >= -1
          && rect.bottom <= taskbarRect.top + 1),
        overlapPairs,
        expectedHome
      };
    }, { expectedHome: MOBILE_HOME_IDS, expectedGrouped: MOBILE_GROUPED_IDS });

    ensure(desktopAudit.visibleIds.join(',') === MOBILE_HOME_IDS.join(','), `La portada móvil no respetó los 9 accesos y su orden (${JSON.stringify(desktopAudit)})`);
    ensure(desktopAudit.groupedHidden && desktopAudit.declarativeOrder, `La portada móvil mostró accesos agrupados o perdió su contrato declarativo (${JSON.stringify(desktopAudit)})`);
    ensure(desktopAudit.twoColumns && desktopAudit.contained && desktopAudit.overlapPairs.length === 0, `Los iconos móviles se superponen, desbordan o no forman dos columnas (${JSON.stringify(desktopAudit)})`);

    const profileIcon = page.locator('.desktop-icon[data-program-name="recruiter-route"]');
    await profileIcon.tap();
    await page.locator('.window[data-window-id="recruiter-route"]').waitFor({ state: 'visible', timeout: 12000 });
    ensure(await page.locator('.window[data-window-id="recruiter-route"]').count() === 1, 'Un toque móvil no abrió el Perfil orientado a FDE');
    await page.evaluate(() => window.zarateXP.windowManager.closeWindow('recruiter-route'));

    const documentsWindow = await openApp(page, 'documents');
    ensure(await documentsWindow.locator('[data-documents-content]').getAttribute('data-view-mode') === 'list', 'Mis Documentos no eligió Lista como vista móvil inicial');
    ensure(await documentsWindow.locator('.xp-document-list-row').count() === 13, 'La lista móvil de Mis Documentos no mostró los 13 accesos');
    await documentsWindow.locator('[data-view-trigger]').click();
    await documentsWindow.locator('[data-view-choice="details"]').click();
    ensure(await documentsWindow.locator('.xp-documents-details-row').count() === 13, 'Detalles de Mis Documentos no mostró los 13 accesos');
    ensure(await page.evaluate(() => localStorage.getItem('zarateXP.documents.viewMode')) === 'details', 'Mis Documentos no guardó la vista elegida');
    await documentsWindow.locator('[data-view-trigger]').click();
    await documentsWindow.locator('[data-view-choice="list"]').click();
    const groups = documentsWindow.locator('[data-document-group]');
    ensure(await groups.count() === 3, 'Mis Documentos no expuso sus tres grupos');
    ensure(await documentsWindow.locator('[data-document-group="profile"] [data-doc-open="certificates"]').isVisible(), 'Certificados no quedó visible dentro de Perfil y credenciales');

    const spanishHeadings = await groups.locator('.xp-folder-group-title').allInnerTexts();
    ensure(spanishHeadings.join('|') === 'Perfil y credenciales|Proyectos y soluciones|Utilidades y demos', `Los grupos de Mis Documentos no tienen los títulos acordados (${spanishHeadings.join('|')})`);
    await page.evaluate(() => window.zarateXP.i18nManager.setLocale('en', { announce: false }));
    await page.waitForFunction(() => document.querySelector('[data-document-group="profile"] .xp-folder-group-title')?.textContent === 'Profile and credentials');
    const englishHeadings = await groups.locator('.xp-folder-group-title').allInnerTexts();
    ensure(englishHeadings.join('|') === 'Profile and credentials|Projects and solutions|Utilities and demos', `Los grupos de Mis Documentos no se tradujeron al inglés (${englishHeadings.join('|')})`);

    await documentsWindow.locator('[data-document-group="profile"] [data-doc-open="certificates"]').click();
    await page.locator('.window[data-window-id="certificates"] [data-certificates-root]').waitFor({ state: 'visible', timeout: 12000 });
    ensure(await page.locator('.window[data-window-id="certificates"] [data-certificate-id]').count() === 16, 'Certificados no abrió el catálogo completo desde Mis Documentos');

    ensure(await page.locator('#menu-certificates[data-program-name="certificates"]').count() === 1, 'Certificados dejó de estar disponible desde Inicio');
    ensure(await page.locator('.all-programs-item[data-program-name="minesweeper"]').count() === 1, 'Buscaminas dejó de estar disponible en Todos los programas');
    return `${viewport.width}x${viewport.height}`;
  } finally {
    await context.close();
  }
}

async function auditDesktopPositionPreservation(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  try {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('zarateXP_session', 'active');
        localStorage.setItem('zarateXP.desktopIconPositions', JSON.stringify({
          'recruiter-route': { x: 310, y: 120 }
        }));
      } catch (error) {
        // about:blank no expone localStorage; la inicializacion se repite al navegar.
      }
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.desktop', { state: 'visible', timeout: 12000 });
    await page.waitForFunction(() => Boolean(window.zarateXP?.desktopManager), null, { timeout: 12000 });
    await page.evaluate(() => {
      localStorage.setItem('zarateXP.desktopIconPositions', JSON.stringify({
        'recruiter-route': { x: 310, y: 120 }
      }));
      window.zarateXP.desktopManager.applyIconPositions();
    });

    const desktopIcon = page.locator('.desktop-icon[data-program-name="recruiter-route"]');
    ensure(Math.round(await desktopIcon.evaluate((icon) => Number.parseFloat(icon.style.left))) === 310, 'El escritorio no restauró la posición guardada inicialmente');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => {
      const icon = document.querySelector('.desktop-icon[data-program-name="recruiter-route"]');
      return window.matchMedia('(max-width: 768px)').matches && Number.parseFloat(icon?.style.left) !== 310;
    });
    ensure(Math.round(await desktopIcon.evaluate((icon) => Number.parseFloat(icon.style.left))) !== 310, 'El escritorio móvil reutilizó una coordenada guardada de desktop');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => {
      const icon = document.querySelector('.desktop-icon[data-program-name="recruiter-route"]');
      return !window.matchMedia('(max-width: 768px)').matches
        && Number.parseFloat(icon?.style.left) === 310
        && Number.parseFloat(icon?.style.top) === 120;
    });
    const restored = await desktopIcon.evaluate((icon) => ({
      left: Number.parseFloat(icon.style.left),
      top: Number.parseFloat(icon.style.top)
    }));
    ensure(Math.round(restored.left) === 310 && Math.round(restored.top) === 120, `La posición desktop no sobrevivió al cambio responsive (${JSON.stringify(restored)})`);
    ensure(await page.locator('.desktop-icons > .desktop-icon:visible').count() === 17, 'El escritorio grande no restauró sus 17 accesos');
  } finally {
    await context.close();
  }
}

async function exerciseResponsiveDesktop(browser, baseUrl) {
  const viewports = [];
  for (const viewport of [{ width: 390, height: 844 }, { width: 430, height: 932 }]) {
    viewports.push(await auditMobileDesktopViewport(browser, baseUrl, viewport));
  }
  await auditDesktopPositionPreservation(browser, baseUrl);
  return `Escritorio responsive: 9 accesos en ${viewports.join(', ')}, toque único, carpetas bilingües y posiciones desktop preservadas`;
}

async function exerciseBootSkip(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    const startedAt = Date.now();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const skip = page.locator('#boot-skip');
    await skip.waitFor({ state: 'visible' });
    await skip.tap();
    await page.locator('#login-screen').waitFor({ state: 'visible', timeout: 3000 });
    ensure(Date.now() - startedAt < 3000, 'Omitir introducción no adelantó el acceso al login');
    await page.evaluate(() => window.zarateXP.i18nManager.setLocale('en', { announce: false }));
    ensure(await skip.textContent() === 'Skip intro', 'El botón para omitir la introducción no se tradujo al inglés');
    return 'Arranque: introducción omitible con toque, teclado e i18n';
  } finally {
    await context.close();
  }
}

async function exerciseProjectExplorer(page) {
  const originalViewport = page.viewportSize();
  const appWindow = await openApp(page, 'projects');
  await appWindow.locator('#explorer-content .project-item').first().waitFor({ state: 'visible' });
  ensure(await appWindow.locator('#explorer-content .project-item').count() === 19, 'El Explorador no abrió con los 19 proyectos');

  await appWindow.locator('[data-view-trigger]').click();
  await appWindow.locator('[data-view-choice="list"]').click();
  ensure(await appWindow.locator('#explorer-content .list-row').count() === 19, 'La vista Lista no mostró los 19 proyectos');
  await appWindow.locator('[data-view-trigger]').click();
  await appWindow.locator('[data-view-choice="details"]').click();
  ensure(await appWindow.locator('#explorer-content .details-row').count() === 19, 'La vista Detalles no mostró los 19 proyectos');
  ensure(await page.evaluate(() => localStorage.getItem('zarateXP.projects.viewMode')) === 'details', 'El Explorador no guardó la vista elegida');
  await appWindow.locator('[data-view-trigger]').click();
  await appWindow.locator('[data-view-choice="icons"]').click();

  await appWindow.locator('#project-location').selectOption('featured');
  await appWindow.locator('#address-go').click();
  await page.waitForFunction(() => document.querySelector('.window[data-window-id="projects"] #items-count')?.textContent === '6 elementos');
  ensure(await appWindow.locator('#explorer-content .project-item').count() === 6, 'Destacados FDE no mostró los seis proyectos curados');
  ensure(!(await appWindow.locator('#btn-back').isDisabled()) && !(await appWindow.locator('#btn-up').isDisabled()), 'La navegación no habilitó Atrás y Arriba');

  await appWindow.locator('#btn-back').click();
  await page.waitForFunction(() => document.querySelector('.window[data-window-id="projects"] #project-location')?.value === 'root');
  await appWindow.locator('#btn-forward').click();
  await page.waitForFunction(() => document.querySelector('.window[data-window-id="projects"] #project-location')?.value === 'featured');

  await appWindow.locator('#btn-search').click();
  const search = appWindow.locator('#project-search-input');
  await search.fill('Oracle');
  await page.waitForFunction(() => document.querySelectorAll('.window[data-window-id="projects"] #explorer-content .project-item').length >= 2);
  ensure(await appWindow.locator('#explorer-content .project-item').count() >= 2, 'La búsqueda global por tecnología no encontró proyectos Oracle');
  await search.fill('consulta-sin-resultados-xyz');
  await appWindow.locator('.project-empty-state').waitFor({ state: 'visible' });
  await appWindow.locator('#project-search-clear').click();

  await appWindow.locator('#project-location').selectOption('featured');
  await appWindow.locator('#address-go').click();
  await appWindow.locator('[data-project-id="auto-inbox"]').dblclick();
  const publicDetails = page.locator('.window[data-window-id="project-details-auto-inbox"]');
  await publicDetails.waitFor({ state: 'visible' });
  ensure((await publicDetails.innerText()).includes('revisión humana obligatoria'), 'Auto-Inbox no mostró su solución específica');
  ensure((await publicDetails.innerText()).includes('Repositorio open source'), 'Auto-Inbox no mostró evidencia verificable');

  await page.evaluate(() => window.zarateXP.windowManager.closeWindow('project-details-auto-inbox'));
  await publicDetails.waitFor({ state: 'detached' });
  await appWindow.locator('[data-project-id="art-redmine"]').dblclick();
  const artDetails = page.locator('.window[data-window-id="project-details-art-redmine"]');
  await artDetails.waitFor({ state: 'visible' });
  ensure((await artDetails.innerText()).includes('sincroniza Redmine'), 'ART Redmine no mostró su solución específica');
  ensure((await artDetails.innerText()).includes('Repositorio abierto con licencia MIT y documentación técnica'), 'Agente para Redmine no mostró evidencia verificable');
  ensure(await artDetails.locator('.xp-project-showcase img').count() === 1, 'ART Redmine no mostró su imagen de caso');
  ensure(await artDetails.locator('[data-project-open-url="https://github.com/IAZARA/Agente-para-Redmine"]').count() === 1, 'Agente para Redmine no enlazó el repositorio público');

  await page.evaluate(() => window.zarateXP.windowManager.closeWindow('project-details-art-redmine'));
  await artDetails.waitFor({ state: 'detached' });
  await appWindow.locator('[data-project-id="cufre"]').dblclick();
  const privateDetails = page.locator('.window[data-window-id="project-details-cufre"]');
  await privateDetails.waitFor({ state: 'visible' });
  ensure((await privateDetails.innerText()).includes('Caso documentado, repositorio no público.'), 'CUFRE no explicó correctamente la ausencia de repositorio público');

  await page.evaluate(() => {
    window.zarateXP.windowManager.closeWindow('project-details-cufre');
    window.zarateXP.i18nManager.setLocale('en', { announce: false });
  });
  await privateDetails.waitFor({ state: 'detached' });
  await page.waitForFunction(() => document.querySelector('.window[data-window-id="projects"] .search-panel-title')?.textContent === 'Search projects');
  await page.waitForTimeout(360);
  ensure(await privateDetails.count() === 0, 'Una ficha de proyecto cerrada reapareció al cambiar el idioma');
  await appWindow.locator('[data-project-id="art-redmine"]').dblclick();
  const englishDetails = page.locator('.window[data-window-id="project-details-art-redmine"]');
  await englishDetails.waitFor({ state: 'visible' });
  ensure((await englishDetails.innerText()).includes('Role and contribution:'), 'La ficha de proyecto no tradujo su estructura al inglés');
  ensure((await englishDetails.innerText()).includes('requires human validation'), 'ART Redmine no utilizó su contenido inglés');
  ensure((await englishDetails.innerText()).includes('Redmine Agent - Details'), 'Agente para Redmine no tradujo su nombre al inglés');
  ensure((await englishDetails.innerText()).includes('Open source (MIT)'), 'Agente para Redmine no tradujo su estado al inglés');
  await page.evaluate(() => window.zarateXP.i18nManager.setLocale('es', { announce: false }));
  await page.waitForFunction(() => document.querySelector('.window[data-window-id="project-details-art-redmine"]')?.textContent.includes('validación humana antes de publicar'));
  await page.evaluate(() => window.zarateXP.windowManager.closeWindow('project-details-art-redmine'));
  await englishDetails.waitFor({ state: 'detached' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(180);
  const mobileToolbar = await appWindow.evaluate((windowNode) => {
    const toolbar = windowNode.querySelector('.explorer-toolbar').getBoundingClientRect();
    const controls = ['#btn-back', '#btn-forward', '#btn-up', '#btn-search', '#btn-folders', '#btn-views']
      .map((selector) => windowNode.querySelector(selector)?.getBoundingClientRect())
      .filter(Boolean);
    const overlaps = controls.some((left, leftIndex) => controls.some((right, rightIndex) => rightIndex > leftIndex
      && left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top));
    return {
      contained: controls.every((rect) => rect.left >= toolbar.left - 1 && rect.right <= toolbar.right + 1),
      sameLine: controls.every((rect) => Math.abs(rect.top - controls[0].top) < 2),
      overlaps
    };
  });
  ensure(mobileToolbar.contained && mobileToolbar.sameLine && !mobileToolbar.overlaps, `La barra móvil de Proyectos se superpone o recorta (${JSON.stringify(mobileToolbar)})`);
  await appWindow.locator('[data-view-trigger]').click();
  ensure(await appWindow.locator('[data-view-choice="list"]').isVisible(), 'El menú Vistas no quedó accesible en móvil');
  await appWindow.locator('[data-view-choice="list"]').click();
  ensure(await appWindow.locator('#explorer-content .list-row').count() > 0, 'La vista Lista no renderizó filas en móvil');
  await page.setViewportSize(originalViewport);
  return 'Proyectos: destacados FDE, búsqueda global, historial, tres vistas, toolbar móvil, teclado y evidencia específica';
}

async function exerciseStartMenuAndPaint(page) {
  await page.locator('#start-button').click();
  const startMenu = page.locator('.startmenu');
  await startMenu.waitFor({ state: 'visible' });
  const primaryPrograms = await startMenu.locator('.menu-item[data-program-name]').evaluateAll((items) => items.map((item) => item.dataset.programName));
  ensure(primaryPrograms.join(',') === 'recruiter-route,projects,resume,certificates,contact,documents,paint,api-center,n8n-flows,pinball,minesweeper,my-computer,control-panel', `Inicio no conserva el orden equilibrado (${primaryPrograms.join(',')})`);

  await page.locator('#menu-all-programs').click();
  const catalogue = page.locator('.all-programs-menu');
  await catalogue.waitFor({ state: 'visible' });
  ensure(await catalogue.locator('.all-programs-group').count() === 6, 'Todos los programas no presenta sus seis grupos');
  ensure(await catalogue.getAttribute('aria-hidden') === 'false', 'Todos los programas no comunica su estado abierto');
  await page.waitForFunction(() => document.activeElement?.classList.contains('all-programs-item'));
  await page.keyboard.press('ArrowDown');
  ensure(await catalogue.locator('.all-programs-item:focus').count() === 1, 'La navegación por teclado no mueve el foco en Todos los programas');

  await page.evaluate(() => window.__zarateXPI18nManager?.setLocale('en', { announce: false }));
  await page.waitForFunction(() => document.querySelector('[data-program-group="profile"] h2')?.textContent.trim() === 'Profile and career');
  await page.evaluate(() => window.__zarateXPI18nManager?.setLocale('es', { announce: false }));
  await page.keyboard.press('Escape');
  ensure(await catalogue.getAttribute('aria-hidden') === 'true', 'Escape no cerró Todos los programas');

  if (!(await startMenu.evaluate((menu) => menu.classList.contains('show')))) await page.locator('#start-button').click();
  await startMenu.waitFor({ state: 'visible' });
  await page.waitForTimeout(220);
  await page.locator('#menu-paint').click();
  const appWindow = page.locator('#windows-container .window[data-window-id="paint"]');
  await appWindow.waitFor({ state: 'visible', timeout: 12000 });
  const rootNode = appWindow.locator('[data-paint-root]');
  await page.waitForFunction(() => Boolean(document.querySelector('[data-paint-root]')?._paintXP), null, { timeout: 12000 });

  const controlLayout = await rootNode.evaluate((root) => ({
    tools: Array.from(root.querySelectorAll('[data-tool]')).map((button) => button.getBoundingClientRect().width),
    colors: Array.from(root.querySelectorAll('.xp-paint-color')).map((button) => button.getBoundingClientRect().width)
  }));
  ensure(controlLayout.tools.every((width) => width >= 22.5 && width <= 26), `Las herramientas de Paint están deformadas (${controlLayout.tools.join(',')})`);
  ensure(controlLayout.colors.length === 24 && controlLayout.colors.every((width) => width >= 18 && width <= 21), 'La paleta de Paint está deformada o incompleta');

  await rootNode.locator('[data-color="#ed1c24"]').click();
  const canvas = rootNode.locator('#paintCanvas');
  const bounds = await canvas.boundingBox();
  ensure(Boolean(bounds), 'El lienzo de Paint no tiene dimensiones');
  await page.mouse.move(bounds.x + 35, bounds.y + 35);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 130, bounds.y + 90, { steps: 8 });
  await page.mouse.up();
  const changedPixels = await canvas.evaluate((node) => {
    const data = node.getContext('2d').getImageData(0, 0, node.width, node.height).data;
    let changed = 0;
    for (let index = 0; index < data.length; index += 4) {
      if (data[index] !== 255 || data[index + 1] !== 255 || data[index + 2] !== 255) changed += 1;
    }
    return changed;
  });
  ensure(changedPixels > 20, 'El lápiz de Paint no modificó el lienzo');
  await rootNode.locator('[data-paint-command="undo"]').click();
  const afterUndo = await canvas.evaluate((node) => Array.from(node.getContext('2d').getImageData(0, 0, node.width, node.height).data).some((value, index) => index % 4 !== 3 && value !== 255));
  ensure(!afterUndo, 'Deshacer no restauró el lienzo');
  await rootNode.locator('[data-paint-command="redo"]').click();
  ensure(!(await rootNode.locator('[data-paint-command="undo"]').isDisabled()), 'Rehacer no restauró el historial de Paint');

  await rootNode.locator('[data-tool="text"]').click();
  await canvas.click({ position: { x: 190, y: 110 } });
  await rootNode.locator('[data-paint-text-input]').fill('ZarateXP');
  await rootNode.locator('[data-paint-text-apply]').click();
  await page.waitForFunction(() => document.querySelector('[data-paint-status]')?.textContent === 'Texto insertado');

  await rootNode.locator('[data-paint-file]').setInputFiles(path.join(root, 'assets/images/hd-icons/paint-xp.png'));
  await page.waitForFunction(() => document.querySelector('[data-paint-status]')?.textContent === 'Imagen importada');
  const downloadPromise = page.waitForEvent('download');
  await rootNode.locator('[data-paint-command="download"]').click();
  const download = await downloadPromise;
  ensure(download.suggestedFilename() === 'zaratexp-paint.png', 'Paint no descargó el PNG esperado');
  await page.waitForFunction(() => Boolean(localStorage.getItem('zarateXP.paint.draft.v1')));

  const originalViewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await rootNode.evaluate((root) => {
    const canvasNode = root.querySelector('#paintCanvas');
    const wrap = root.querySelector('.xp-paint-canvas-wrap');
    const tool = root.querySelector('[data-tool]');
    return {
      canvasWidth: canvasNode.getBoundingClientRect().width,
      wrapWidth: wrap.getBoundingClientRect().width,
      toolWidth: tool.getBoundingClientRect().width,
      paletteVisible: root.querySelector('.xp-paint-palette').getBoundingClientRect().height > 40
    };
  });
  ensure(mobile.canvasWidth <= mobile.wrapWidth && mobile.toolWidth >= 34 && mobile.paletteVisible, `Paint no se adaptó al celular (${JSON.stringify(mobile)})`);
  await page.setViewportSize(originalViewport);
  return 'Inicio: catálogo agrupado y accesible; Paint: dibujo, historial, texto, importación, descarga, borrador y móvil';
}

async function exerciseCertificates(page) {
  const originalViewport = page.viewportSize();
  let appWindow = await openApp(page, 'certificates');
  const root = appWindow.locator('[data-certificates-root]');
  await root.locator('[data-certificate-preview]').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const image = document.querySelector('.window[data-window-id="certificates"] [data-certificate-preview]');
    return image?.complete && image.naturalWidth > 0;
  });

  const initial = await root.evaluate((rootNode) => ({
    items: rootNode.querySelectorAll('[data-certificate-id]').length,
    selected: rootNode.querySelectorAll('[data-certificate-id][aria-selected="true"]').length,
    filters: rootNode.querySelectorAll('[data-certificate-filter]').length,
    selectedId: rootNode.querySelector('[data-certificate-id][aria-selected="true"]')?.dataset.certificateId,
    source: rootNode.querySelector('[data-certificate-source]')?.getAttribute('href'),
    verification: rootNode.querySelector('[data-certificate-verification]')?.getAttribute('href'),
    previewLoaded: rootNode.querySelector('[data-certificate-preview]')?.naturalWidth > 0
  }));
  ensure(initial.items === 16 && initial.selected === 1 && initial.filters === 6, `Certificados no expuso el catálogo completo (${JSON.stringify(initial)})`);
  ensure(initial.selectedId === 'claude-code-101', 'El catálogo no abrió con la credencial más reciente');
  ensure(initial.previewLoaded && /claude-code-101\.jpg/.test(initial.source || ''), 'Claude Code 101 no cargó su evidencia original');
  ensure(/e759d3c0-b384-4295-ae87-8dd66724db6f/.test(initial.verification || ''), 'Claude Code 101 no conserva su enlace de verificación');

  await root.locator('[data-certificate-filter="featured"]').click();
  ensure(await root.locator('[data-certificate-id]:visible').count() === 5, 'Destacados FDE no mostró sus 5 credenciales curadas');
  const claudeVerificationCases = [
    ['claude-code-101', 'e759d3c0-b384-4295-ae87-8dd66724db6f'],
    ['claude-ai-capabilities-limitations', 'a410f5a6-bede-48ad-9128-720a1f6802a3']
  ];
  for (const [id, token] of claudeVerificationCases) {
    await root.locator(`[data-certificate-id="${id}"]`).click();
    ensure((await root.locator('[data-certificate-verification]').getAttribute('href'))?.includes(token), `La insignia ${id} no conserva su enlace Claude Academy correcto`);
    ensure((await root.locator('[data-certificate-verification]').innerText()) === 'Verificar en Claude Academy', `La insignia ${id} no identifica a Claude Academy`);
  }

  await root.locator('[data-certificate-filter="ai-data"]').click();
  ensure(await root.locator('[data-certificate-id]:visible').count() === 7, 'El filtro IA, Datos y Dev no mostró sus 7 credenciales');
  const sapVerificationCases = [
    ['sap-ai-fundamentals', 'xobal-hikug-nesog-guvap-kunuh'],
    ['sap-introducing-joule', 'xysag-gibyv-podal-sebyf-musuk'],
    ['sap-sports-one-medical', 'xurig-fovyr-ripig-vacov-hidal']
  ];
  for (const [id, token] of sapVerificationCases) {
    await root.locator(`[data-certificate-id="${id}"]`).click();
    ensure((await root.locator('[data-certificate-verification]').getAttribute('href'))?.includes(token), `La insignia ${id} no conserva su enlace SAP correcto`);
    ensure((await root.locator('[data-certificate-verification]').innerText()) === 'Verificar en SAP Learning', `La insignia ${id} no identifica a SAP Learning`);
  }

  await root.locator('[data-certificate-filter="gis"]').click();
  const visibleGis = await root.locator('[data-certificate-id]:visible').count();
  ensure(visibleGis === 6, `El filtro GIS mostró ${visibleGis}/6 credenciales`);
  await root.locator('[data-certificate-id="arcgis-experience-builder"]').click();
  ensure((await root.locator('[data-certificate-source]').getAttribute('href'))?.includes('#page=5'), 'Experience Builder no abre la página correcta del PDF ArcGIS');
  ensure(await root.locator('[data-certificate-verification]').isHidden(), 'Una credencial ArcGIS mostró un enlace de verificación Coursera incorrecto');

  await root.locator('[data-certificate-filter="security"]').click();
  ensure(await root.locator('[data-certificate-id]:visible').count() === 2, 'El filtro Seguridad no mostró ASIS y UNODC');
  await root.locator('[data-certificate-id="asis-security-defense"]').click();
  ensure((await root.locator('[data-certificate-source]').getAttribute('href'))?.includes('asis-security-defense-virtuality.png'), 'ASIS no abrió su certificado original');
  await root.locator('[data-certificate-id="unodc-online-terrorism-investigation"]').click();
  ensure((await root.locator('[data-certificate-source]').getAttribute('href'))?.includes('unodc-online-terrorism-investigation-workshop.png'), 'UNODC no abrió su certificado original');

  await root.locator('[data-certificate-filter="management"]').click();
  await page.evaluate(() => window.zarateXP.i18nManager.setLocale('en', { announce: false }));
  await page.waitForFunction(() => document.querySelector('.window[data-window-id="certificates"] [data-certificate-title]')?.textContent === 'Foundations of Project Management');
  const english = await root.evaluate((rootNode) => ({
    title: rootNode.querySelector('[data-certificate-title]')?.textContent,
    action: rootNode.querySelector('[data-certificate-source]')?.textContent,
    category: rootNode.querySelector('[data-certificate-category-label]')?.textContent
  }));
  ensure(english.title === 'Foundations of Project Management' && english.action === 'View original document' && english.category === 'Project Management', `La vista inglesa de certificados quedó incompleta (${JSON.stringify(english)})`);
  await page.evaluate(() => window.zarateXP.i18nManager.setLocale('es', { announce: false }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => {
    const node = document.querySelector('.window[data-window-id="certificates"]');
    if (!node) return false;
    const rect = node.getBoundingClientRect();
    const taskbar = document.querySelector('.taskbar')?.getBoundingClientRect();
    return rect.left >= 7
      && rect.right <= window.innerWidth - 7
      && rect.top >= 7
      && rect.bottom <= (taskbar?.top || window.innerHeight) - 7;
  });
  const resizedWindow = await appWindow.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  });
  ensure(resizedWindow.left >= 7 && resizedWindow.right <= 383, `La ventana abierta quedó recortada al pasar a móvil (${JSON.stringify(resizedWindow)})`);
  await page.setViewportSize(originalViewport);

  await page.evaluate(() => window.zarateXP.windowManager.closeWindow('certificates'));
  await appWindow.waitFor({ state: 'detached' });
  await page.setViewportSize({ width: 390, height: 740 });
  appWindow = await openApp(page, 'certificates');
  await waitForWindowAnimation(page, 'certificates');
  const mobileRoot = appWindow.locator('[data-certificates-root]');
  await mobileRoot.locator('[data-certificate-preview]').waitFor({ state: 'visible' });
  await mobileRoot.locator('[data-certificate-filter="security"]').click();
  await mobileRoot.locator('[data-certificate-id="asis-security-defense"]').click();
  await page.waitForFunction(() => {
    const detail = document.querySelector('.window[data-window-id="certificates"] [data-certificate-detail]');
    return detail && detail.getAnimations({ subtree: true }).every((animation) => animation.playState === 'finished');
  });
  const mobile = await mobileRoot.evaluate((rootNode) => {
    const appRect = rootNode.getBoundingClientRect();
    const filters = rootNode.querySelector('.xp-certificate-filters');
    const list = rootNode.querySelector('.xp-certificate-list');
    const detail = rootNode.querySelector('[data-certificate-detail]');
    const preview = rootNode.querySelector('[data-certificate-preview]');
    const caption = rootNode.querySelector('.xp-certificate-preview figcaption');
    const actions = Array.from(rootNode.querySelectorAll('.xp-certificate-actions a:not([hidden])'));
    const visibleItems = Array.from(rootNode.querySelectorAll('[data-certificate-id]'))
      .filter((item) => getComputedStyle(item).display !== 'none');
    const previewRect = preview.getBoundingClientRect();
    const captionRect = caption.getBoundingClientRect();
    const detailRect = detail.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    const cardsContained = visibleItems.every((item) => {
      const itemRect = item.getBoundingClientRect();
      const copyRect = item.querySelector('.xp-certificate-item-copy').getBoundingClientRect();
      return itemRect.top >= listRect.top - 1
        && itemRect.bottom <= listRect.bottom + 1
        && copyRect.top >= itemRect.top - 1
        && copyRect.bottom <= itemRect.bottom + 1
        && getComputedStyle(item).overflow === 'hidden';
    });
    return {
      noPageOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
      appContained: appRect.left >= -1 && appRect.right <= window.innerWidth + 1,
      appRect: { left: appRect.left, right: appRect.right, width: appRect.width, viewport: window.innerWidth },
      filtersScrollable: filters.scrollWidth >= filters.clientWidth,
      securityCards: visibleItems.length,
      cardsContained,
      listSeparated: listRect.bottom <= detailRect.top + 1,
      previewContained: previewRect.left >= detailRect.left - 1 && previewRect.right <= detailRect.right + 1,
      captionSeparated: previewRect.bottom <= captionRect.top + 0.5 && captionRect.height >= 23.5,
      actionsReachable: actions.every((action) => action.getBoundingClientRect().height >= 39.5)
    };
  });
  ensure(mobile.noPageOverflow
    && mobile.appContained
    && mobile.filtersScrollable
    && mobile.securityCards === 2
    && mobile.cardsContained
    && mobile.listSeparated
    && mobile.previewContained
    && mobile.captionSeparated
    && mobile.actionsReachable, `Certificados no se adaptó al viewport móvil (${JSON.stringify(mobile)})`);

  await page.evaluate(() => window.zarateXP.windowManager.closeWindow('certificates'));
  await appWindow.waitFor({ state: 'detached' });
  await page.setViewportSize(originalViewport);
  await openApp(page, 'certificates');
  return 'Certificados: 16 credenciales, destacados FDE, enlaces Claude/SAP, traducción y layout móvil';
}

async function exerciseGitHubActivity(page) {
  const originalViewport = page.viewportSize();
  const recruiterWindow = await openApp(page, 'recruiter-route');
  const summary = recruiterWindow.locator('[data-github-activity-summary]');
  await summary.locator('.xp-gh-day').first().waitFor({ state: 'visible', timeout: 12000 });
  const compact = await summary.evaluate((node) => ({
    metrics: node.querySelectorAll('.xp-gh-summary-metrics > div').length,
    days: node.querySelectorAll('.xp-gh-day').length,
    active: node.querySelectorAll('.xp-gh-day:not(.level-0)').length,
    text: node.textContent
  }));
  ensure(compact.metrics === 3 && compact.days >= 240 && compact.active > 0, `El resumen FDE de GitHub quedó incompleto (${JSON.stringify(compact)})`);
  ensure(compact.text.includes(String(githubActivityFixture.summary.totalContributions)), 'El resumen FDE no refleja el snapshot versionado');

  await recruiterWindow.locator('[data-route-app="github-activity"]').last().click();
  const appWindow = page.locator('#windows-container .window[data-window-id="github-activity"]');
  await appWindow.waitFor({ state: 'visible', timeout: 12000 });
  const appRoot = appWindow.locator('[data-github-activity-root]');
  await appRoot.locator('.xp-gh-day').first().waitFor({ state: 'visible', timeout: 12000 });
  const full = await appRoot.evaluate((node) => ({
    metrics: node.querySelectorAll('.xp-gh-app-metrics > div').length,
    days: node.querySelectorAll('.xp-gh-days .xp-gh-day').length,
    active: node.querySelectorAll('.xp-gh-days .xp-gh-day:not(.level-0)').length,
    profile: node.querySelector('.xp-gh-app-header a')?.getAttribute('href')
  }));
  const fixtureDays = githubActivityFixture.weeks.flatMap((week) => week.days).length;
  ensure(full.metrics === 4 && full.days === fixtureDays && full.active > 0, `La aplicación GitHub no renderizó el año completo (${JSON.stringify(full)})`);
  ensure(full.profile === 'https://github.com/IAZARA', 'La aplicación GitHub no enlaza al perfil público correcto');
  const privacyNote = await appRoot.locator('.xp-gh-app-note').innerText();
  ensure(privacyNote.includes('actividad anónima en repositorios privados') && !privacyNote.includes('548'), 'La aplicación GitHub no protege correctamente la actividad privada');

  await page.evaluate(() => window.zarateXP.i18nManager.setLocale('en', { announce: false }));
  await page.waitForFunction(() => Array.from(document.querySelectorAll('.window[data-window-id="github-activity"] .xp-gh-app-metrics span')).some((node) => node.textContent === 'Contributions'));
  ensure(await appRoot.getByText('Open GitHub profile', { exact: true }).count() === 1, 'La aplicación GitHub no tradujo su acción principal al inglés');
  ensure((await appRoot.locator('.xp-gh-app-note').innerText()).includes('anonymous activity from private repositories'), 'La nota de privacidad de GitHub no se tradujo al inglés');
  await page.evaluate(() => window.zarateXP.i18nManager.setLocale('es', { announce: false }));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const mobile = await appWindow.evaluate((windowNode) => {
    const rect = windowNode.getBoundingClientRect();
    const taskbarTop = document.querySelector('.taskbar')?.getBoundingClientRect().top || window.innerHeight;
    const calendar = windowNode.querySelector('.xp-gh-calendar-scroll');
    const metrics = Array.from(windowNode.querySelectorAll('.xp-gh-app-metrics > div')).map((node) => node.getBoundingClientRect());
    return {
      contained: rect.left >= 7 && rect.right <= window.innerWidth - 7 && rect.top >= 7 && rect.bottom <= taskbarTop - 7,
      calendarScrollable: calendar.scrollWidth > calendar.clientWidth,
      twoColumns: metrics.length === 4 && Math.abs(metrics[0].top - metrics[1].top) < 2 && metrics[2].top > metrics[0].top,
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  });
  ensure(mobile.contained && mobile.calendarScrollable && mobile.twoColumns && !mobile.pageOverflow, `La actividad GitHub no se adaptó al celular (${JSON.stringify(mobile)})`);
  await page.setViewportSize(originalViewport);
  return `GitHub: snapshot de ${fixtureDays} días, resumen FDE, app completa, ES/EN y calendario móvil desplazable`;
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForWindowAnimation(page, appId) {
  await page.waitForFunction((id) => {
    const windowNode = document.querySelector(`.window[data-window-id="${id}"]`);
    if (!windowNode) return false;
    const transform = getComputedStyle(windowNode).transform;
    if (transform === 'none') return true;
    const matrix = new DOMMatrixReadOnly(transform);
    return Math.abs(matrix.a - 1) < 0.001 && Math.abs(matrix.d - 1) < 0.001;
  }, appId, { timeout: 5000 });
}

async function exerciseClippy(page) {
  const originalViewport = page.viewportSize();
  ensure(originalViewport?.width > 768, 'Clippy necesita iniciar la auditoria en viewport desktop');

  await page.evaluate(() => {
    const manager = window.zarateXP?.clippyManager;
    if (!manager) throw new Error('ClippyManager no esta disponible');
    manager.welcomeShown = false;
    manager.showWelcome();
  });

  const clippy = page.locator('clippy-character');
  await clippy.waitFor({ state: 'attached', timeout: 3000 });
  await page.waitForFunction(() => {
    const host = document.querySelector('clippy-character');
    return Boolean(host?.classList.contains('show'))
      && Number.parseFloat(getComputedStyle(host).opacity) >= 0.99;
  }, null, { timeout: 4000 });

  const geometry = await clippy.evaluate((host) => {
    const shadow = host.shadowRoot;
    const character = shadow?.querySelector('.clippy');
    const dialog = shadow?.querySelector('clippy-dialog')?.shadowRoot?.querySelector('.container');
    const container = shadow?.querySelector('.container');
    const closeButton = shadow?.querySelector('.close-button');
    if (!character || !dialog || !container) return { complete: false };

    const characterRect = character.getBoundingClientRect();
    const dialogRect = dialog.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const closeRect = closeButton?.getBoundingClientRect() || containerRect;
    const contentBounds = {
      left: Math.min(characterRect.left, dialogRect.left, containerRect.left, closeRect.left),
      top: Math.min(characterRect.top, dialogRect.top, containerRect.top, closeRect.top),
      right: Math.max(characterRect.right, dialogRect.right, containerRect.right, closeRect.right),
      bottom: Math.max(characterRect.bottom, dialogRect.bottom, containerRect.bottom, closeRect.bottom)
    };

    return {
      complete: true,
      visible: getComputedStyle(host).display !== 'none'
        && getComputedStyle(host).visibility !== 'hidden'
        && Number.parseFloat(getComputedStyle(host).opacity) >= 0.99,
      characterRightGap: window.innerWidth - characterRect.right,
      dialogAtLeft: dialogRect.right <= characterRect.left + 1,
      contentContained: contentBounds.left >= -1
        && contentBounds.top >= -1
        && contentBounds.right <= window.innerWidth + 1
        && contentBounds.bottom <= window.innerHeight + 1,
      character: {
        left: characterRect.left,
        right: characterRect.right,
        top: characterRect.top,
        bottom: characterRect.bottom
      },
      dialog: {
        left: dialogRect.left,
        right: dialogRect.right,
        top: dialogRect.top,
        bottom: dialogRect.bottom
      },
      contentBounds
    };
  });

  ensure(geometry.complete && geometry.visible, `Clippy no quedo visible en desktop (${JSON.stringify(geometry)})`);
  ensure(geometry.characterRightGap >= 3.5 && geometry.characterRightGap <= 8.5, `Clippy no quedo a 4-8 px del margen derecho (${JSON.stringify(geometry)})`);
  ensure(geometry.dialogAtLeft, `El globo de Clippy no quedo a la izquierda del personaje (${JSON.stringify(geometry)})`);
  ensure(geometry.contentContained, `Clippy o su globo quedaron fuera del viewport (${JSON.stringify(geometry)})`);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => !document.querySelector('clippy-character'), null, { timeout: 2500 });
    ensure(await page.locator('clippy-character').count() === 0, 'Clippy no se retiro al cambiar a viewport movil');
  } finally {
    await page.setViewportSize(originalViewport);
  }

  return 'Clippy: visible y al margen en desktop, globo a la izquierda y teardown responsive';
}

async function exerciseApiCenter(page) {
  const appWindow = await openApp(page, 'api-center');
  const root = appWindow.locator('[data-api-root]');

  await appWindow.locator('[data-weather-result] .xp-weather-card').waitFor({ timeout: 12000 });
  ensure((await appWindow.locator('[data-weather-result]').innerText()).includes('Buenos Aires'), 'API Center no renderizó el clima esperado');
  ensure(await appWindow.locator('[data-api-health="weather"]').getAttribute('data-api-status') === 'success', 'El health de clima no terminó correctamente');

  await appWindow.locator('.xp-api-sidebar [data-api-tab="github"]').click();
  await appWindow.locator('[data-github-result] .xp-github-list article').waitFor({ timeout: 12000 });
  ensure((await appWindow.locator('[data-github-result]').innerText()).includes('ZarateXP-Portfolio_v1'), 'API Center no renderizó GitHub');

  const githubTab = appWindow.locator('.xp-api-sidebar [data-api-tab="github"]');
  await githubTab.focus();
  await githubTab.press('ArrowRight');
  await appWindow.locator('[data-api-panel="countries"]:not([hidden])').waitFor();
  await appWindow.locator('[data-country-result] .xp-country-card').waitFor({ timeout: 12000 });
  ensure((await appWindow.locator('[data-country-result]').innerText()).includes('República Argentina'), 'API Center no renderizó los datos del país');

  await page.waitForFunction(() => Boolean(localStorage.getItem('zarateXP.apiCache.country.population.arg')));
  await page.waitForFunction(() => document.querySelector('[data-api-root]')?.__apiCenterApp?.requests.size === 0);
  await page.waitForTimeout(500);
  await appWindow.locator('.xp-api-sidebar [data-api-clear-cache]').click();
  const cacheState = await page.evaluate(() => ({
    keys: Object.keys(localStorage).filter((key) => key.startsWith('zarateXP.apiCache.')),
    log: document.querySelector('[data-api-log]')?.textContent || ''
  }));
  ensure(cacheState.keys.length === 0, `API Center no limpió su caché (${JSON.stringify(cacheState)})`);

  await appWindow.locator('.xp-api-sidebar [data-api-run-all]').click();
  await page.waitForFunction(() => {
    const rootNode = document.querySelector('.window[data-window-id="api-center"] [data-api-root]');
    const log = rootNode?.querySelector('[data-api-log]')?.textContent || '';
    return rootNode?.getAttribute('aria-busy') === 'false' && log.includes('Ejecución completa');
  }, null, { timeout: 12000 });
  ensure((await appWindow.locator('[data-api-last-updated]').innerText()).includes('Última respuesta'), 'API Center no informó frescura');

  return 'API Center: clima, GitHub, países, teclado, cache y ejecución paralela';
}

async function exerciseMlopsLifecycle(page) {
  const desktopIcon = page.locator('.desktop-icons > .desktop-icon[data-program-name="n8n-flows"]');
  await desktopIcon.waitFor({ state: 'visible', timeout: 12000 });
  await desktopIcon.dblclick();

  let appWindow = page.locator('#windows-container .window[data-window-id="n8n-flows"]');
  await appWindow.waitFor({ state: 'visible', timeout: 12000 });
  let root = appWindow.locator('[data-mlops-root]');
  await root.waitFor({ state: 'visible', timeout: 12000 });

  const initialAudit = await root.evaluate((rootNode) => {
    const stages = Array.from(rootNode.querySelectorAll('[data-mlops-stage][data-stage-id]'));
    const stageIds = stages.map((stage) => stage.dataset.stageId);
    const controls = ['run', 'approve', 'drift', 'reset'].map((name) => rootNode.querySelector(`[data-mlops-${name}]`));
    const progress = rootNode.querySelector('[data-mlops-progress]');
    const status = rootNode.querySelector('[data-mlops-status]');
    const log = rootNode.querySelector('[data-mlops-log]');
    const accessibleName = (element) => (element?.getAttribute('aria-label') || element?.textContent || '').trim();

    return {
      stageCount: stages.length,
      uniqueStageIds: new Set(stageIds).size,
      stageIdsComplete: stageIds.every(Boolean),
      stagesFocusable: stages.every((stage) => stage.tabIndex >= 0 && accessibleName(stage).length > 0),
      controlsPresent: controls.every(Boolean),
      controlsNamed: controls.every((control) => accessibleName(control).length > 0),
      rootNamed: Boolean(rootNode.getAttribute('aria-label') || rootNode.getAttribute('aria-labelledby')),
      progressSemantic: Boolean(progress && (progress.tagName === 'PROGRESS' || progress.getAttribute('role') === 'progressbar')),
      progressValue: Number(progress?.value ?? progress?.getAttribute('aria-valuenow')),
      progressMax: Number(progress?.max ?? progress?.getAttribute('aria-valuemax')),
      statusLive: status?.getAttribute('role') === 'status' && ['polite', 'assertive'].includes(status.getAttribute('aria-live')),
      logLive: log?.getAttribute('role') === 'log' || ['polite', 'assertive'].includes(log?.getAttribute('aria-live')),
      initialState: rootNode.dataset.state,
      stagesIdle: stages.every((stage) => stage.dataset.state === 'idle')
    };
  });

  ensure(initialAudit.stageCount === 8 && initialAudit.uniqueStageIds === 8 && initialAudit.stageIdsComplete, `El ciclo MLOps no expuso ocho etapas únicas (${JSON.stringify(initialAudit)})`);
  ensure(initialAudit.stagesFocusable && initialAudit.controlsPresent && initialAudit.controlsNamed && initialAudit.rootNamed, 'La app MLOps dejó etapas o controles sin acceso y nombre semántico');
  ensure(initialAudit.progressSemantic && initialAudit.progressValue === 0 && initialAudit.progressMax === 100, 'El progreso MLOps inicial no es un progressbar 0/100');
  ensure(initialAudit.statusLive && initialAudit.logLive, 'La app MLOps no anunció estado y eventos con regiones vivas');
  ensure(initialAudit.initialState === 'idle' && initialAudit.stagesIdle, 'La app MLOps no abrió en estado limpio');

  const stages = root.locator('[data-mlops-stage][data-stage-id]');
  await stages.first().focus();
  await stages.first().press('ArrowRight');
  ensure(await stages.nth(1).evaluate((stage) => document.activeElement === stage), 'Las etapas MLOps no permiten recorrer el ciclo con flechas');

  const run = root.locator('[data-mlops-run]');
  const approve = root.locator('[data-mlops-approve]');
  const drift = root.locator('[data-mlops-drift]');
  const reset = root.locator('[data-mlops-reset]');

  await run.dblclick();
  await page.waitForFunction(() => {
    const rootNode = document.querySelector('.window[data-window-id="n8n-flows"] [data-mlops-root]');
    return rootNode?.dataset.state === 'running';
  }, null, { timeout: 5000 });

  const executionAudit = await root.evaluate(async (rootNode) => {
    const progress = rootNode.querySelector('[data-mlops-progress]');
    const samples = [];
    const startedAt = Date.now();

    while (rootNode.dataset.state !== 'awaiting_approval' && Date.now() - startedAt < 20000) {
      const running = rootNode.querySelectorAll('[data-mlops-stage][data-state="running"]').length;
      samples.push({
        state: rootNode.dataset.state,
        running,
        progress: Number(progress?.value ?? progress?.getAttribute('aria-valuenow')),
        busy: rootNode.getAttribute('aria-busy')
      });
      await new Promise((resolve) => window.setTimeout(resolve, 40));
    }

    return {
      reachedGate: rootNode.dataset.state === 'awaiting_approval',
      maxRunning: Math.max(0, ...samples.map((sample) => sample.running)),
      hadRunningStage: samples.some((sample) => sample.running === 1),
      announcedBusy: samples.some((sample) => sample.busy === 'true'),
      progressMonotonic: samples.every((sample, index) => index === 0 || sample.progress >= samples[index - 1].progress),
      finalProgress: Number(progress?.value ?? progress?.getAttribute('aria-valuenow'))
    };
  });

  ensure(executionAudit.reachedGate, 'La ejecución MLOps no llegó al gate de aprobación');
  ensure(executionAudit.maxRunning === 1 && executionAudit.hadRunningStage, `El doble clic inició ejecuciones solapadas (${JSON.stringify(executionAudit)})`);
  ensure(executionAudit.announcedBusy && executionAudit.progressMonotonic, 'La ejecución MLOps no comunicó actividad o hizo retroceder el progreso');
  ensure(executionAudit.finalProgress > 0 && executionAudit.finalProgress < 100, 'El gate de aprobación no detuvo el ciclo antes del despliegue');
  ensure(await approve.isEnabled(), 'El gate no habilitó la aprobación humana');
  ensure(await root.locator('[data-mlops-stage][data-state="waiting"]').count() === 1, 'El gate no dejó exactamente una etapa esperando aprobación');
  const gateIsVisible = await root.locator('[data-mlops-stage][data-state="waiting"]').evaluate((stage) => {
    const scroller = stage.closest('.xp-mlops-flow-scroll');
    const stageRect = stage.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    return stageRect.left >= scrollerRect.left - 1 && stageRect.right <= scrollerRect.right + 1;
  });
  ensure(gateIsVisible, 'El pipeline no llevó el gate activo al viewport horizontal');

  await approve.click();
  await page.waitForFunction(() => {
    const rootNode = document.querySelector('.window[data-window-id="n8n-flows"] [data-mlops-root]');
    const progress = rootNode?.querySelector('[data-mlops-progress]');
    return rootNode?.dataset.state === 'completed' && Number(progress?.value ?? progress?.getAttribute('aria-valuenow')) === 100;
  }, null, { timeout: 20000 });

  const completedAudit = await root.evaluate((rootNode) => ({
    done: rootNode.querySelectorAll('[data-mlops-stage][data-state="done"]').length,
    status: rootNode.querySelector('[data-mlops-status]')?.textContent || '',
    log: rootNode.querySelector('[data-mlops-log]')?.textContent || '',
    busy: rootNode.getAttribute('aria-busy')
  }));
  ensure(completedAudit.done === 8, `El ciclo terminó con ${completedAudit.done}/8 etapas completas`);
  ensure(/ciclo completado/i.test(`${completedAudit.status} ${completedAudit.log}`) && completedAudit.busy === 'false', 'La app MLOps no anunció claramente la finalización');

  await drift.click();
  await page.waitForFunction(() => {
    const rootNode = document.querySelector('.window[data-window-id="n8n-flows"] [data-mlops-root]');
    return rootNode?.dataset.state === 'drift_detected';
  }, null, { timeout: 5000 });
  const driftFeedback = await root.locator('[data-mlops-status], [data-mlops-log]').allInnerTexts();
  ensure(/(?:drift|deriva|rollback|reentren)/i.test(driftFeedback.join(' ')), 'La simulación de drift no explicó detección, rollback o reentrenamiento');
  ensure(await root.locator('[data-mlops-stage][data-state="warning"]').count() >= 1, 'La simulación de drift no marcó visual y semánticamente la alerta');
  await page.waitForTimeout(250);
  const driftIsVisible = await root.locator('[data-mlops-stage][data-state="warning"]').evaluate((stage) => {
    const scroller = stage.closest('.xp-mlops-flow-scroll');
    const stageRect = stage.getBoundingClientRect();
    const scrollerRect = scroller.getBoundingClientRect();
    return stageRect.left >= scrollerRect.left - 1 && stageRect.right <= scrollerRect.right + 1;
  });
  ensure(driftIsVisible, 'El pipeline no llevó la alerta de drift al viewport horizontal');

  await reset.click();
  await page.waitForFunction(() => {
    const rootNode = document.querySelector('.window[data-window-id="n8n-flows"] [data-mlops-root]');
    const progress = rootNode?.querySelector('[data-mlops-progress]');
    return rootNode?.dataset.state === 'idle' && Number(progress?.value ?? progress?.getAttribute('aria-valuenow')) === 0;
  });
  ensure(await root.locator('[data-mlops-stage][data-state="idle"]').count() === 8, 'Reiniciar no devolvió las ocho etapas a idle');

  await run.dblclick();
  await page.waitForFunction(() => {
    const rootNode = document.querySelector('.window[data-window-id="n8n-flows"] [data-mlops-root]');
    const progress = rootNode?.querySelector('[data-mlops-progress]');
    return rootNode?.dataset.state === 'running' && Number(progress?.value ?? progress?.getAttribute('aria-valuenow')) > 0;
  }, null, { timeout: 7000 });
  await reset.click();
  await page.waitForTimeout(900);
  const cancelledAudit = await root.evaluate((rootNode) => ({
    state: rootNode.dataset.state,
    progress: Number(rootNode.querySelector('[data-mlops-progress]')?.value ?? 0),
    idle: rootNode.querySelectorAll('[data-mlops-stage][data-state="idle"]').length,
    running: rootNode.querySelectorAll('[data-mlops-stage][data-state="running"]').length
  }));
  ensure(cancelledAudit.state === 'idle' && cancelledAudit.progress === 0 && cancelledAudit.idle === 8 && cancelledAudit.running === 0, `Reiniciar no canceló los callbacks pendientes (${JSON.stringify(cancelledAudit)})`);

  const originalViewport = page.viewportSize();
  await page.evaluate(() => window.zarateXP.windowManager.closeWindow('n8n-flows'));
  await appWindow.waitFor({ state: 'detached' });
  await page.setViewportSize({ width: 390, height: 844 });
  appWindow = await openApp(page, 'n8n-flows');
  root = appWindow.locator('[data-mlops-root]');
  await root.waitFor({ state: 'visible', timeout: 12000 });
  await page.waitForTimeout(200);
  const mobileAudit = await root.evaluate((rootNode) => {
    const rootRect = rootNode.getBoundingClientRect();
    const controls = ['run', 'approve', 'drift', 'reset'].map((name) => rootNode.querySelector(`[data-mlops-${name}]`));
    const toolbarRect = rootNode.querySelector('.xp-mlops-toolbar').getBoundingClientRect();
    const canvasRect = rootNode.querySelector('.xp-mlops-canvas').getBoundingClientRect();
    const feedbackRect = rootNode.querySelector('[data-mlops-feedback]').getBoundingClientRect();
    const inspectorRect = rootNode.querySelector('[data-mlops-inspector]').getBoundingClientRect();
    const logRect = rootNode.querySelector('.xp-mlops-log-panel').getBoundingClientRect();
    const stageRects = Array.from(rootNode.querySelectorAll('[data-mlops-stage]'), (stage) => stage.getBoundingClientRect());
    return {
      noHorizontalOverflow: rootNode.scrollWidth <= rootNode.clientWidth + 1,
      controlsVisible: controls.every((control) => {
        const rect = control.getBoundingClientRect();
        return rect.width >= 40 && rect.height >= 40
          && rect.left >= rootRect.left - 1 && rect.right <= rootRect.right + 1;
      }),
      toolbarContainsControls: controls.every((control) => control.getBoundingClientRect().bottom <= toolbarRect.bottom + 1),
      orderedStages: stageRects.every((rect, index) => index === 0 || rect.top >= stageRects[index - 1].bottom - 1),
      canvasContainsFlow: feedbackRect.bottom <= canvasRect.bottom + 1,
      sectionsDoNotOverlap: canvasRect.bottom <= inspectorRect.top + 1 && inspectorRect.bottom <= logRect.top + 1,
      rootContained: rootRect.left >= -1 && rootRect.right <= window.innerWidth + 1
    };
  });
  ensure(Object.values(mobileAudit).every(Boolean), `La app MLOps desborda, superpone secciones o pierde controles en móvil (${JSON.stringify(mobileAudit)})`);
  await page.setViewportSize(originalViewport);

  return 'MLOps n8n: icono, 8 etapas, gate humano, drift, reset, concurrencia, accesibilidad y móvil';
}

async function exerciseSolitaire(page) {
  const appWindow = await openApp(page, 'solitaire');
  await appWindow.locator('[data-tableau-column]').nth(6).waitFor({ timeout: 12000 });

  const columns = await appWindow.locator('[data-tableau-column]').count();
  const foundations = await appWindow.locator('[data-foundation]').count();
  const cards = await appWindow.locator('[data-tableau-column] [data-card-id]').count();
  ensure(columns === 7 && foundations === 4 && cards === 28, `Reparto de Solitario inválido (${columns} columnas, ${foundations} fundaciones, ${cards} cartas)`);

  await appWindow.locator('[data-pile="stock"]').click();
  await appWindow.locator('[data-pile="waste"] [data-card-id]').waitFor();
  await page.waitForFunction(() => {
    const value = document.querySelector('.window[data-window-id="solitaire"] [data-solitaire-time]')?.textContent;
    return value && value !== '00:00';
  }, null, { timeout: 3500 });
  ensure(!/^0\s/.test((await appWindow.locator('[data-solitaire-moves]').innerText()).trim()), 'Solitario no registró el movimiento');

  await appWindow.locator('[data-solitaire-hint]').click();
  ensure((await appWindow.locator('[data-solitaire-status]').innerText()).trim().length > 0, 'Solitario no anunció la pista');
  await appWindow.locator('[data-solitaire-undo]').click();
  ensure((await appWindow.locator('[data-solitaire-score]').innerText()).includes('pts'), 'Solitario no actualizó el puntaje');

  return 'Solitario: reparto de 52 cartas, reloj, movimientos, pista y deshacer';
}

async function exerciseWinamp(page) {
  let appWindow = await openApp(page, 'winamp');
  const root = appWindow.locator('[data-winamp-root]');
  await page.waitForFunction(() => {
    const windowNode = document.querySelector('.window[data-window-id="winamp"]');
    return windowNode?._winampProApp?.tracks?.length === 6;
  });
  await page.waitForFunction(() => {
    const windowNode = document.querySelector('.window[data-window-id="winamp"]');
    if (!windowNode) return false;
    const transform = getComputedStyle(windowNode).transform;
    if (transform === 'none') return true;
    const matrix = new DOMMatrixReadOnly(transform);
    return Math.abs(matrix.a - 1) < 0.001 && Math.abs(matrix.d - 1) < 0.001;
  });

  const playlist = appWindow.locator('[data-winamp-playlist] [data-track-index]');
  ensure(await playlist.count() === 6, 'Winamp no renderizó las seis pistas esperadas');
  const trackOrder = await appWindow.evaluate((windowNode) => {
    const app = windowNode._winampProApp;
    return app.tracks.slice(0, 2).map(({ title, artist, src, kind }) => ({ title, artist, src, kind }));
  });
  ensure(trackOrder[0].artist === 'AC/DC' && trackOrder[0].title === 'Thunderstruck', 'Thunderstruck no quedó primero en Winamp');
  ensure(trackOrder[1].artist === 'Soda Stereo' && /Trátame suavemente/.test(trackOrder[1].title), 'Trátame suavemente no quedó segunda en Winamp');
  ensure(trackOrder.every((track) => track.kind === 'media' && track.src.endsWith('.mp3')), 'Las dos primeras pistas no apuntan a MP3 reales');
  ensure(await playlist.first().getAttribute('aria-current') === 'true', 'Winamp no marcó la primera pista como activa');

  const desktopGeometry = await appWindow.evaluate((windowNode) => {
    const player = windowNode.querySelector('[data-winamp-root]');
    const controls = Array.from(windowNode.querySelectorAll('.xp-winamp-transport button'));
    const rootRect = player.getBoundingClientRect();
    return {
      noHorizontalOverflow: player.scrollWidth <= player.clientWidth + 1,
      controlsVisible: controls.every((button) => {
        const rect = button.getBoundingClientRect();
        return rect.width >= 36 && rect.height >= 30 && rect.left >= rootRect.left && rect.right <= rootRect.right + 1;
      })
    };
  });
  ensure(desktopGeometry.noHorizontalOverflow, 'Winamp todavía desborda horizontalmente en desktop');
  ensure(desktopGeometry.controlsVisible, 'Winamp tiene controles recortados o demasiado pequeños en desktop');

  await appWindow.locator('[data-winamp-action="play"]').click();
  await page.waitForFunction(() => {
    const app = document.querySelector('.window[data-window-id="winamp"]')?._winampProApp;
    return app?.isPlaying && !app.audio.paused && app.audio.currentTime > 0.15;
  }, null, { timeout: 12000 });
  await page.waitForFunction(() => {
    const app = document.querySelector('.window[data-window-id="winamp"]')?._winampProApp;
    return Array.from(app?.frequencyData || []).some((value) => value > 0);
  }, null, { timeout: 6000 });
  const playingState = await appWindow.evaluate((windowNode) => {
    const app = windowNode._winampProApp;
    return {
      state: app.root.dataset.winampState,
      duration: app.audio.duration,
      analyserActive: Array.from(app.frequencyData || []).some((value) => value > 0)
    };
  });
  ensure(playingState.state === 'play' && playingState.duration > 290, 'Winamp no reprodujo Thunderstruck correctamente');
  ensure(playingState.analyserActive, 'El visualizador de Winamp no recibió señal de audio');

  await appWindow.locator('[data-winamp-action="pause"]').click();
  const pausedState = await appWindow.evaluate((windowNode) => {
    const app = windowNode._winampProApp;
    return { playing: app.isPlaying, paused: app.audio.paused, position: app.position, raf: app.raf, scheduler: app.scheduler };
  });
  ensure(!pausedState.playing && pausedState.paused && pausedState.position > 0 && pausedState.raf === null && pausedState.scheduler === null, 'Winamp no pausó y limpió su animación');

  await appWindow.locator('[data-winamp-seek]').fill('500');
  const seekState = await appWindow.evaluate((windowNode) => {
    const app = windowNode._winampProApp;
    return { position: app.position, duration: app.currentDuration(), audioTime: app.audio.currentTime };
  });
  ensure(Math.abs(seekState.position - seekState.duration / 2) < 1.5 && Math.abs(seekState.audioTime - seekState.position) < 1.5, 'Winamp no aplicó el seek al 50%');

  await appWindow.locator('[data-winamp-volume]').fill('25');
  await page.waitForFunction(() => {
    const app = document.querySelector('.window[data-window-id="winamp"]')?._winampProApp;
    return app?.gain && Math.abs(app.gain.gain.value - 0.25) < 0.04;
  });
  const mixerState = await appWindow.evaluate((windowNode) => {
    const app = windowNode._winampProApp;
    return { gain: app.gain.gain.value, label: app.volumeOutput.textContent };
  });
  ensure(Math.abs(mixerState.gain - 0.25) < 0.04 && mixerState.label === '25%', 'Winamp no aplicó el volumen visible al grafo de audio');

  const eqInputs = appWindow.locator('[data-eq-band]');
  await eqInputs.nth(0).fill('-8');
  await eqInputs.nth(1).fill('4');
  await eqInputs.nth(2).fill('10');
  const eqState = await appWindow.evaluate((windowNode) => {
    const app = windowNode._winampProApp;
    const panel = windowNode.querySelector('.xp-winamp-eq');
    const panelRect = panel.getBoundingClientRect();
    const controls = Array.from(panel.querySelectorAll('.xp-eq-control'));
    return {
      values: app.eqInputs.map((input) => Number(input.value)),
      outputs: Array.from(panel.querySelectorAll('[data-eq-output]')).map((output) => output.textContent),
      gains: [app.bass.gain.value, app.mid.gain.value, app.treble.gain.value],
      types: [app.bass.type, app.mid.type, app.treble.type],
      frequencies: [app.bass.frequency.value, app.mid.frequency.value, app.treble.frequency.value],
      customAppearance: app.eqInputs.every((input) => getComputedStyle(input).appearance === 'none'),
      verticalOrientation: app.eqInputs.every((input) => input.getAttribute('aria-orientation') === 'vertical'),
      noHorizontalOverflow: panel.scrollWidth <= panel.clientWidth + 1,
      controlsContained: controls.every((control) => {
        const rect = control.getBoundingClientRect();
        return rect.left >= panelRect.left && rect.right <= panelRect.right + 1 && rect.top >= panelRect.top && rect.bottom <= panelRect.bottom + 1;
      })
    };
  });
  ensure(eqState.values.join(',') === '-8,4,10' && eqState.outputs.join(',') === '-8 dB,+4 dB,+10 dB', 'Winamp no sincronizó los valores visibles del ecualizador');
  ensure(eqState.gains.join(',') === '-8,4,10', 'Winamp no aplicó las ganancias del ecualizador al grafo Web Audio');
  ensure(eqState.types.join(',') === 'lowshelf,peaking,highshelf' && eqState.frequencies.join(',') === '60,1000,14000', 'Winamp no respetó las bandas declaradas del ecualizador');
  ensure(eqState.customAppearance && eqState.verticalOrientation && eqState.noHorizontalOverflow && eqState.controlsContained, 'Winamp volvió a mostrar controles nativos, inaccesibles o desalineados en el ecualizador');

  const seekBeforeEqKeyboard = await appWindow.locator('[data-winamp-seek]').inputValue();
  await eqInputs.nth(0).focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowUp');
  const eqKeyboardState = await appWindow.evaluate((windowNode) => {
    const app = windowNode._winampProApp;
    return {
      value: Number(app.eqInputs[0].value),
      output: app.eqOutputs.get('bass')?.textContent,
      gain: app.bass.gain.value,
      seek: app.seekEl.value
    };
  });
  ensure(eqKeyboardState.value === -11 && eqKeyboardState.output === '-11 dB' && eqKeyboardState.gain === -11 && eqKeyboardState.seek === seekBeforeEqKeyboard, 'Winamp no manejó correctamente el teclado dentro del ecualizador');

  const eqReset = appWindow.locator('[data-winamp-action="eq-reset"]');
  await eqReset.click();
  const resetEqState = await appWindow.evaluate((windowNode) => {
    const app = windowNode._winampProApp;
    return {
      values: app.eqInputs.map((input) => Number(input.value)),
      outputs: Array.from(app.eqOutputs.values()).map((output) => output.textContent),
      gains: [app.bass.gain.value, app.mid.gain.value, app.treble.gain.value],
      status: app.statusEl.textContent
    };
  });
  ensure(resetEqState.values.every((value) => value === 0) && resetEqState.outputs.every((value) => value === '0 dB') && resetEqState.gains.every((value) => value === 0) && resetEqState.status.includes('0 dB'), 'Winamp no restableció completamente el ecualizador');

  await eqInputs.nth(0).fill('-6');
  await eqInputs.nth(1).fill('3');
  await eqInputs.nth(2).fill('7');

  await playlist.nth(1).click();
  await page.waitForFunction(() => {
    const app = document.querySelector('.window[data-window-id="winamp"]')?._winampProApp;
    return app?.trackIndex === 1 && app?.isPlaying && !app.audio.paused && app.audio.currentTime > 0.1;
  }, null, { timeout: 12000 });
  ensure((await appWindow.locator('[data-winamp-title]').innerText()).includes('Trátame suavemente'), 'Winamp no actualizó el readout de Soda Stereo');

  const shuffle = appWindow.locator('[data-winamp-action="shuffle"]');
  const repeat = appWindow.locator('[data-winamp-action="repeat"]');
  await shuffle.click();
  await repeat.click();
  ensure(await shuffle.getAttribute('aria-pressed') === 'true' && await repeat.getAttribute('aria-pressed') === 'true', 'Winamp no expuso los estados de shuffle y repeat');

  await appWindow.locator('[data-winamp-action="stop"]').click();
  const stopped = await appWindow.evaluate((windowNode) => {
    const app = windowNode._winampProApp;
    return { playing: app.isPlaying, position: app.position, audioTime: app.audio.currentTime, state: app.root.dataset.winampState };
  });
  ensure(!stopped.playing && stopped.position === 0 && stopped.audioTime === 0 && stopped.state === 'stop', 'Winamp no volvió a cero al detener');

  const reducedMotionState = await appWindow.evaluate(async (windowNode) => {
    const app = windowNode._winampProApp;
    document.body.classList.add('xp-no-animations');
    await app.play();
    await new Promise((resolve) => setTimeout(resolve, 550));
    const state = {
      playing: app.isPlaying,
      raf: app.raf,
      displayTimer: app.displayTimer,
      playbackState: app.root.dataset.winampState
    };
    app.stop();
    document.body.classList.remove('xp-no-animations');
    return state;
  });
  ensure(reducedMotionState.playing && reducedMotionState.raf === null && reducedMotionState.displayTimer !== null && reducedMotionState.playbackState === 'play', 'Winamp no respetó el modo de movimiento reducido');

  const stoppedDuringLoad = await appWindow.evaluate(async (windowNode) => {
    const app = windowNode._winampProApp;
    const originalPlay = app.audio.play;
    app.audio.play = () => new Promise((resolve, reject) => {
      window.setTimeout(() => reject(new DOMException('Reproducción interrumpida', 'AbortError')), 120);
    });
    const pending = app.play();
    await new Promise((resolve) => setTimeout(resolve, 20));
    app.stop();
    await pending;
    await new Promise((resolve) => setTimeout(resolve, 130));
    const state = {
      playing: app.isPlaying,
      loading: app.isLoading,
      playbackState: app.root.dataset.winampState,
      hasError: Boolean(app.root.dataset.winampError),
      pauseActive: app.root.querySelector('[data-winamp-action="pause"]').classList.contains('active')
    };
    app.audio.play = originalPlay;
    return state;
  });
  ensure(!stoppedDuringLoad.playing && !stoppedDuringLoad.loading && stoppedDuringLoad.playbackState === 'stop' && !stoppedDuringLoad.hasError && !stoppedDuringLoad.pauseActive, 'Winamp dejó que una carga cancelada sobrescribiera el estado STOP');

  const failedPlayback = await appWindow.evaluate(async (windowNode) => {
    const app = windowNode._winampProApp;
    const originalPlay = app.audio.play;
    app.audio.play = () => Promise.reject(new Error('fallo simulado'));
    await app.play();
    const state = {
      playing: app.isPlaying,
      loading: app.isLoading,
      playbackState: app.root.dataset.winampState,
      pauseActive: app.root.querySelector('[data-winamp-action="pause"]').classList.contains('active'),
      raf: app.raf,
      scheduler: app.scheduler,
      activeNodes: app.activeNodes.size
    };
    app.audio.play = originalPlay;
    app.stop();
    return state;
  });
  ensure(!failedPlayback.playing && !failedPlayback.loading && failedPlayback.playbackState === 'error' && !failedPlayback.pauseActive && failedPlayback.raf === null && failedPlayback.scheduler === null && failedPlayback.activeNodes === 0, 'Winamp no limpió correctamente un error de reproducción');

  await appWindow.evaluate((windowNode) => { window.__winampSmokeClosed = windowNode._winampProApp; });
  await page.evaluate(() => window.zarateXP.windowManager.closeWindow('winamp'));
  await appWindow.waitFor({ state: 'detached' });
  await page.waitForFunction(() => {
    const app = window.__winampSmokeClosed;
    return app?.destroyed && app.scheduler === null && app.raf === null && app.displayTimer === null
      && app.motionObserver === null && app.activeNodes.size === 0
      && (!app.audioContext || app.audioContext.state === 'closed');
  });

  const originalViewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  appWindow = await openApp(page, 'winamp');
  await page.waitForTimeout(300);
  const restoredEqState = await appWindow.evaluate(async (windowNode) => {
    const app = windowNode._winampProApp;
    await app.ensureAudioGraph();
    const panel = windowNode.querySelector('.xp-winamp-eq');
    const panelRect = panel.getBoundingClientRect();
    const controls = Array.from(panel.querySelectorAll('.xp-eq-control'));
    return {
      values: app.eqInputs.map((input) => Number(input.value)),
      outputs: Array.from(app.eqOutputs.values()).map((output) => output.textContent),
      gains: [app.bass.gain.value, app.mid.gain.value, app.treble.gain.value],
      noHorizontalOverflow: panel.scrollWidth <= panel.clientWidth + 1,
      controlsReachable: controls.every((control) => {
        const rect = control.getBoundingClientRect();
        return rect.width >= 43.5 && rect.height >= 87.5
          && rect.left >= panelRect.left && rect.right <= panelRect.right + 1
          && rect.top >= panelRect.top && rect.bottom <= panelRect.bottom + 1;
      }),
      customAppearance: app.eqInputs.every((input) => getComputedStyle(input).appearance === 'none')
    };
  });
  ensure(restoredEqState.values.join(',') === '-6,3,7' && restoredEqState.outputs.join(',') === '-6 dB,+3 dB,+7 dB' && restoredEqState.gains.join(',') === '-6,3,7', 'Winamp no restauró las preferencias del ecualizador');
  ensure(restoredEqState.noHorizontalOverflow && restoredEqState.controlsReachable && restoredEqState.customAppearance, 'Winamp desalineó el ecualizador personalizado en móvil');
  const mobileGeometry = await appWindow.evaluate((windowNode) => {
    const player = windowNode.querySelector('[data-winamp-root]');
    const workspace = windowNode.querySelector('.xp-winamp-workspace');
    const transport = windowNode.querySelector('.xp-winamp-transport');
    const windowRect = windowNode.getBoundingClientRect();
    const controls = Array.from(windowNode.querySelectorAll('.xp-winamp-transport button'));
    return {
      noHorizontalOverflow: player.scrollWidth <= player.clientWidth + 1,
      windowContained: windowRect.left >= -1 && windowRect.right <= window.innerWidth + 1,
      oneColumn: getComputedStyle(workspace).display === 'contents'
        || getComputedStyle(workspace).gridTemplateColumns.trim().split(/\s+/).length === 1,
      transport: { scrollWidth: transport.scrollWidth, clientWidth: transport.clientWidth },
      buttons: controls.map((button) => {
        const rect = button.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }),
      controlsReachable: transport.scrollWidth <= transport.clientWidth + 1 && controls.every((button) => {
        const rect = button.getBoundingClientRect();
        return rect.width >= 43.5 && rect.height >= 43.5;
      })
    };
  });
  ensure(mobileGeometry.noHorizontalOverflow && mobileGeometry.windowContained && mobileGeometry.oneColumn && mobileGeometry.controlsReachable, `Winamp no se adaptó al viewport móvil (${JSON.stringify(mobileGeometry)})`);
  await page.setViewportSize(originalViewport);

  return 'Winamp: MP3 reales, controles, EQ personalizado persistente, errores, cleanup y layout móvil';
}

async function exerciseMinesweeper(page) {
  const appWindow = await openApp(page, 'minesweeper');
  const board = appWindow.locator('[data-ms-board]');
  await board.waitFor({ state: 'visible', timeout: 12000 });

  const firstCell = board.locator('.xp-cell').first();
  await firstCell.focus();
  await firstCell.press('f');
  ensure(await firstCell.evaluate((cell) => cell.classList.contains('flagged')), 'Buscaminas no colocó la bandera con teclado');
  await firstCell.press('f');
  ensure(await firstCell.evaluate((cell) => cell.classList.contains('question')), 'Buscaminas no mostró el estado dudoso');
  await firstCell.press('f');
  ensure(await firstCell.evaluate((cell) => !cell.classList.contains('flagged') && !cell.classList.contains('question')), 'Buscaminas no completó el ciclo de marcas');

  const difficulties = [
    { key: 'beginner', cells: 81, mines: 10 },
    { key: 'intermediate', cells: 256, mines: 40 },
    { key: 'expert', cells: 480, mines: 99 }
  ];

  for (const difficulty of difficulties) {
    await appWindow.locator(`[data-ms-difficulty="${difficulty.key}"]`).click();
    await page.waitForFunction(({ key, count }) => {
      const root = document.querySelector('.window[data-window-id="minesweeper"] [data-minesweeper-root]');
      return root?._minesweeperXP?.difficultyKey === key
        && root.querySelectorAll('[data-ms-board] .xp-cell').length === count;
    }, { key: difficulty.key, count: difficulty.cells });

    const safeCell = board.locator('.xp-cell').first();
    await safeCell.click();

    const generated = await appWindow.locator('[data-minesweeper-root]').evaluate((root) => {
      const game = root._minesweeperXP;
      const clicked = game.board[0][0];
      const mine = game.board.flat().find((cell) => cell.mine);
      const mineCount = game.board.flat().filter((cell) => cell.mine).length;
      const safeArea = clicked
        ? [clicked, ...game.neighbors(clicked.row, clicked.col)].every((cell) => !cell.mine)
        : false;
      return {
        minesPlaced: game.minesPlaced,
        mineCount,
        safeArea,
        mine: mine ? { row: mine.row, col: mine.col } : null
      };
    });

    ensure(generated.minesPlaced, `Buscaminas no distribuyó minas en ${difficulty.key}`);
    ensure(generated.mineCount === difficulty.mines, `Buscaminas generó ${generated.mineCount}/${difficulty.mines} minas en ${difficulty.key}`);
    ensure(generated.safeArea, `Buscaminas no protegió el primer clic y su vecindad en ${difficulty.key}`);
    ensure(generated.mine, `Buscaminas no generó una mina jugable en ${difficulty.key}`);

    await appWindow.locator('[data-minesweeper-root]').evaluate((root, mine) => {
      root._minesweeperXP.primaryAction(mine.row, mine.col);
    }, generated.mine);

    const visibleMines = appWindow.locator('[data-ms-board] [data-mine].mine-visible');
    await visibleMines.first().waitFor({ state: 'visible' });
    const visibleMineCount = await visibleMines.count();
    ensure(visibleMineCount === difficulty.mines, `Buscaminas mostró ${visibleMineCount}/${difficulty.mines} minas al perder en ${difficulty.key}`);
    ensure((await visibleMines.first().innerText()).includes('✹'), `Buscaminas no renderizó el glifo visible de mina en ${difficulty.key}`);
    ensure(/todas las minas estan visibles/i.test(await appWindow.locator('[data-ms-status]').innerText()), `Buscaminas no anunció las minas visibles en ${difficulty.key}`);
  }

  const originalViewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await appWindow.evaluate((windowNode) => {
    const body = windowNode.querySelector('.window-body').getBoundingClientRect();
    const status = windowNode.querySelector('[data-ms-status]').getBoundingClientRect();
    const boardWrap = windowNode.querySelector('.xp-board-wrap');
    return {
      statusContained: status.bottom <= body.bottom + 1,
      expertScrollsHorizontally: boardWrap.scrollWidth > boardWrap.clientWidth
    };
  });
  ensure(mobileLayout.statusContained, 'Buscaminas recortó la barra de estado en viewport móvil');
  ensure(mobileLayout.expertScrollsHorizontally, 'Buscaminas Experto no habilitó el desplazamiento horizontal en móvil');
  await page.setViewportSize(originalViewport);

  return 'Buscaminas: 10/40/99 minas, primer clic seguro, marcas, teclado, revelado total y layout móvil';
}

async function exercisePinball(page) {
  const appWindow = await openApp(page, 'pinball');
  const canvas = appWindow.locator('[data-pinball-canvas]');
  await canvas.waitFor({ state: 'visible', timeout: 12000 });
  await waitForWindowAnimation(page, 'pinball');

  const touchPad = appWindow.locator('.xp-pinball-pad');
  ensure(await touchPad.isHidden(), 'Pinball mostro el dock tactil en viewport desktop');

  await appWindow.locator('[data-pinball-start]').click();
  await page.waitForFunction(() => {
    const root = document.querySelector('.window[data-window-id="pinball"] [data-pinball-root]');
    const app = root?._pinballApp || root?.closest('.window')?._pinballApp;
    return app?.state === 'playing' && app?.ball?.inLauncherLane === false;
  }, null, { timeout: 8000 });
  await appWindow.locator('[data-pinball-pause]').click();
  ensure(/pausa/i.test(await appWindow.locator('[data-pinball-state]').innerText()), 'Pinball no entró en pausa');

  const sound = appWindow.locator('[data-pinball-sound]');
  const soundBefore = await sound.getAttribute('aria-pressed');
  await sound.click();
  ensure(await sound.getAttribute('aria-pressed') !== soundBefore, 'Pinball no alternó el sonido');
  ensure((await appWindow.locator('[data-pinball-mission]').innerText()).trim().length > 0, 'Pinball no informó la misión');
  ensure(Number(await appWindow.locator('[data-pinball-level]').innerText()) >= 1, 'Pinball no informó el nivel');

  await canvas.focus();
  await canvas.press('r');
  ensure((await appWindow.locator('[data-pinball-state]').innerText()).trim().length > 0, 'Pinball perdió el estado después del teclado');

  const passiveDrain = await appWindow.locator('[data-pinball-root]').evaluate((root) => {
    const app = root._pinballApp || root.closest('.window')?._pinballApp;
    app.stopLoop();
    app.resetGame({ announce: false });
    app.launchBall(0.82, { enableBallSave: false });
    app.stopLoop();

    let elapsed = 0;
    let launcherCleared = false;
    while (app.state === 'playing' && elapsed < 60) {
      app.update(1 / 60);
      elapsed += 1 / 60;
      if (!app.ball.inLauncherLane) launcherCleared = true;
    }

    const result = {
      balls: app.balls,
      elapsed,
      launcherCleared,
      state: app.state
    };
    app.resetGame({ announce: false });
    app.startLoop();
    return result;
  });
  ensure(passiveDrain.launcherCleared, 'Pinball dejó la bola bloqueada en el carril de lanzamiento');
  ensure(passiveDrain.balls === 2 && passiveDrain.state === 'ready' && passiveDrain.elapsed < 60, `Pinball no drenó una bola sin interacción (${JSON.stringify(passiveDrain)})`);

  return 'Pinball: lanzamiento, salida del carril, drenaje pasivo, pausa, sonido, misión, nivel y teclado';
}

async function touchPinballControl(page, cdp, button, selector, control, touchId, holdMs = 0) {
  const box = await button.boundingBox();
  ensure(box && box.width > 0 && box.height > 0, `El control tactil ${control} no tiene geometria interactiva`);
  const touchPoint = {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    radiusX: 8,
    radiusY: 8,
    rotationAngle: 0,
    force: 1,
    id: touchId
  };

  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [touchPoint]
  });

  try {
    await page.waitForFunction(({ controlSelector, controlName }) => {
      const node = document.querySelector(`.window[data-window-id="pinball"] ${controlSelector}`);
      const root = node?.closest('[data-pinball-root]');
      const app = root?._pinballApp || root?.closest('.window')?._pinballApp;
      return node?.getAttribute('aria-pressed') === 'true'
        && node.hasAttribute('data-active')
        && app?.pointerSources?.[controlName]?.size > 0;
    }, { controlSelector: selector, controlName: control }, { timeout: 2000 });

    if (holdMs > 0) await page.waitForTimeout(holdMs);
    const pressed = await button.evaluate((node, controlName) => {
      const root = node.closest('[data-pinball-root]');
      const app = root?._pinballApp || root?.closest('.window')?._pinballApp;
      const logicalPressed = controlName === 'left'
        ? app?.isLeftPressed()
        : controlName === 'right'
          ? app?.isRightPressed()
          : app?.isPlungerPressed();
      return {
        ariaPressed: node.getAttribute('aria-pressed'),
        active: node.hasAttribute('data-active'),
        pointerSources: app?.pointerSources?.[controlName]?.size ?? -1,
        logicalPressed,
        gameState: app?.state,
        charge: app?.charge,
        meter: Number(root?.querySelector('.xp-pinball-meter')?.getAttribute('aria-valuenow'))
      };
    }, control);
    ensure(pressed.ariaPressed === 'true' && pressed.active && pressed.pointerSources > 0 && pressed.logicalPressed, `Pinball no activo ${control} con touchStart (${JSON.stringify(pressed)})`);
    if (control === 'plunger') {
      ensure(pressed.gameState === 'charging' && pressed.charge > 0 && pressed.meter > 0, `El lanzador no cargo durante touchStart (${JSON.stringify(pressed)})`);
    }
  } finally {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: []
    });
  }

  await page.waitForFunction(({ controlSelector, controlName }) => {
    const node = document.querySelector(`.window[data-window-id="pinball"] ${controlSelector}`);
    const root = node?.closest('[data-pinball-root]');
    const app = root?._pinballApp || root?.closest('.window')?._pinballApp;
    return node?.getAttribute('aria-pressed') === 'false'
      && !node.hasAttribute('data-active')
      && app?.pointerSources?.[controlName]?.size === 0;
  }, { controlSelector: selector, controlName: control }, { timeout: 2000 });

  const released = await button.evaluate((node, controlName) => {
    const root = node.closest('[data-pinball-root]');
    const app = root?._pinballApp || root?.closest('.window')?._pinballApp;
    const logicalPressed = controlName === 'left'
      ? app?.isLeftPressed()
      : controlName === 'right'
        ? app?.isRightPressed()
        : app?.isPlungerPressed();
    return {
      ariaPressed: node.getAttribute('aria-pressed'),
      active: node.hasAttribute('data-active'),
      pointerSources: app?.pointerSources?.[controlName]?.size ?? -1,
      logicalPressed,
      gameState: app?.state,
      launchPower: app?.launchPower,
      ballInLauncherLane: app?.ball?.inLauncherLane
    };
  }, control);
  ensure(released.ariaPressed === 'false' && !released.active && released.pointerSources === 0 && !released.logicalPressed, `Pinball dejo ${control} activo despues de touchEnd (${JSON.stringify(released)})`);
  return released;
}

const PINBALL_BOARD_WIDTH = 520;
const PINBALL_BOARD_HEIGHT = 700;
const PINBALL_RATIO_TOLERANCE = 0.005;
const PINBALL_MOBILE_VIEWPORTS = [
  { width: 375, height: 600 },
  { width: 390, height: 664 },
  { width: 390, height: 745 },
  { width: 430, height: 739, exerciseTouch: true },
  { width: 430, height: 824 },
  { width: 390, height: 844 }
];

async function auditMobilePinballViewport(browser, baseUrl, viewportCase) {
  const context = await browser.newContext({
    viewport: { width: viewportCase.width, height: viewportCase.height },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2
  });

  try {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('zarateXP_session', 'active');
      } catch (error) {
        // about:blank no expone localStorage; la misma inicializacion se repite al navegar.
      }
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.desktop', { state: 'visible', timeout: 12000 });
    await page.waitForFunction(() => Boolean(window.zarateXP?.appManager?.windowManager), null, { timeout: 12000 });

    if (viewportCase.exerciseTouch) {
      const trayClippy = page.locator('.tray-clippy-icon');
      ensure(await trayClippy.count() === 1 && await trayClippy.isHidden(), 'El icono de Clippy en la bandeja no quedo oculto en un dispositivo movil real');

      await page.evaluate(() => window.zarateXP.clippyManager.showWelcome());
      await page.waitForTimeout(650);
      ensure(await page.locator('clippy-character').count() === 0, 'showWelcome creo un host de Clippy en movil');
      await page.evaluate(() => window.zarateXP.clippyManager.showTip(0));
      await page.waitForTimeout(650);
      ensure(await page.locator('clippy-character').count() === 0, 'showTip creo un host de Clippy en movil');
    }

    const appWindow = await openApp(page, 'pinball');
    const root = appWindow.locator('[data-pinball-root]');
    const canvas = appWindow.locator('[data-pinball-canvas]');
    const touchPad = appWindow.locator('.xp-pinball-pad');
    await canvas.waitFor({ state: 'visible', timeout: 12000 });
    await touchPad.waitFor({ state: 'visible', timeout: 12000 });
    await page.waitForFunction(() => {
      const rootNode = document.querySelector('.window[data-window-id="pinball"] [data-pinball-root]');
      return Boolean(rootNode?._pinballApp || rootNode?.closest('.window')?._pinballApp);
    }, null, { timeout: 12000 });
    await waitForWindowAnimation(page, 'pinball');

    const mobileLayout = await appWindow.evaluate((windowNode, board) => {
      const rootNode = windowNode.querySelector('[data-pinball-root]');
      const windowBody = windowNode.querySelector('.window-body');
      const tableWrap = rootNode?.querySelector('.xp-pinball-table-wrap');
      const canvasStage = rootNode?.querySelector('.xp-pinball-canvas-stage');
      const canvasNode = rootNode?.querySelector('[data-pinball-canvas]');
      const pad = rootNode?.querySelector('.xp-pinball-pad');
      const app = rootNode?._pinballApp || rootNode?.closest('.window')?._pinballApp;
      const requiredButtons = [
        rootNode?.querySelector('[data-pinball-left]'),
        rootNode?.querySelector('[data-pinball-plunger]'),
        rootNode?.querySelector('[data-pinball-right]')
      ];
      if (!rootNode || !windowBody || !tableWrap || !canvasStage || !canvasNode || !pad || !app || requiredButtons.some((button) => !button)) {
        return { complete: false };
      }

      const bodyRect = windowBody.getBoundingClientRect();
      const wrapRect = tableWrap.getBoundingClientRect();
      const stageRect = canvasStage.getBoundingClientRect();
      const canvasRect = canvasNode.getBoundingClientRect();
      const padRect = pad.getBoundingClientRect();
      const taskbarTop = document.querySelector('.taskbar')?.getBoundingClientRect().top ?? window.innerHeight;
      const visualViewportRect = {
        left: window.visualViewport?.offsetLeft ?? 0,
        top: window.visualViewport?.offsetTop ?? 0,
        right: (window.visualViewport?.offsetLeft ?? 0) + (window.visualViewport?.width ?? window.innerWidth),
        bottom: (window.visualViewport?.offsetTop ?? 0) + (window.visualViewport?.height ?? window.innerHeight)
      };
      const usableViewportRect = {
        ...visualViewportRect,
        bottom: Math.min(visualViewportRect.bottom, taskbarTop)
      };
      const contains = (outer, inner, tolerance = 1) => inner.width > 0 && inner.height > 0
        && inner.left >= outer.left - tolerance
        && inner.right <= outer.right + tolerance
        && inner.top >= outer.top - tolerance
        && inner.bottom <= outer.bottom + tolerance;
      const clipRect = {
        left: Math.max(stageRect.left, wrapRect.left, bodyRect.left, usableViewportRect.left),
        top: Math.max(stageRect.top, wrapRect.top, bodyRect.top, usableViewportRect.top),
        right: Math.min(stageRect.right, wrapRect.right, bodyRect.right, usableViewportRect.right),
        bottom: Math.min(stageRect.bottom, wrapRect.bottom, bodyRect.bottom, usableViewportRect.bottom)
      };

      const canvasStyle = getComputedStyle(canvasNode);
      const borderLeft = Number.parseFloat(canvasStyle.borderLeftWidth) || 0;
      const borderRight = Number.parseFloat(canvasStyle.borderRightWidth) || 0;
      const borderTop = Number.parseFloat(canvasStyle.borderTopWidth) || 0;
      const borderBottom = Number.parseFloat(canvasStyle.borderBottomWidth) || 0;
      const canvasContentRect = {
        left: canvasRect.left + borderLeft,
        top: canvasRect.top + borderTop,
        right: canvasRect.right - borderRight,
        bottom: canvasRect.bottom - borderBottom,
        width: canvasRect.width - borderLeft - borderRight,
        height: canvasRect.height - borderTop - borderBottom
      };
      const intrinsicRatio = canvasNode.width / canvasNode.height;
      const renderedRatio = canvasContentRect.width / canvasContentRect.height;
      const ratioError = Math.abs((renderedRatio / intrinsicRatio) - 1);
      const visibleContentBottom = Math.min(canvasContentRect.bottom, clipRect.bottom);
      const logicalVisibleBottom = Math.max(0, Math.min(
        board.height,
        ((visibleContentBottom - canvasContentRect.top) / canvasContentRect.height) * board.height
      ));
      const logicalToPixelRect = (bounds) => ({
        left: canvasContentRect.left + (bounds.left / board.width) * canvasContentRect.width,
        right: canvasContentRect.left + (bounds.right / board.width) * canvasContentRect.width,
        top: canvasContentRect.top + (bounds.top / board.height) * canvasContentRect.height,
        bottom: canvasContentRect.top + (bounds.bottom / board.height) * canvasContentRect.height,
        width: ((bounds.right - bounds.left) / board.width) * canvasContentRect.width,
        height: ((bounds.bottom - bounds.top) / board.height) * canvasContentRect.height
      });
      const flipperBounds = ['left', 'right'].map((side) => {
        const segment = app.flipperSegment(side);
        return logicalToPixelRect({
          left: Math.min(segment.a.x, segment.b.x) - segment.thickness,
          right: Math.max(segment.a.x, segment.b.x) + segment.thickness,
          top: Math.min(segment.a.y, segment.b.y) - segment.thickness,
          bottom: Math.max(segment.a.y, segment.b.y) + segment.thickness
        });
      });
      const scrollingElement = document.scrollingElement;
      const scrollSurfaces = [scrollingElement, windowBody, rootNode].filter(Boolean);
      const containment = {
        stage: contains(stageRect, canvasRect),
        wrap: contains(wrapRect, canvasRect),
        body: contains(bodyRect, canvasRect),
        visualViewport: contains(usableViewportRect, canvasRect)
      };

      return {
        complete: true,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          visualWidth: window.visualViewport?.width ?? window.innerWidth,
          visualHeight: window.visualViewport?.height ?? window.innerHeight,
          usableBottom: usableViewportRect.bottom
        },
        hasTouch: navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches,
        buttonCount: pad.querySelectorAll('button').length,
        padVisible: getComputedStyle(pad).display !== 'none'
          && contains(wrapRect, padRect)
          && contains(bodyRect, padRect)
          && contains(usableViewportRect, padRect),
        canvasContained: Object.values(containment).every(Boolean),
        containment,
        ratioError,
        ratioWithinTolerance: Number.isFinite(ratioError) && ratioError <= board.ratioTolerance,
        logicalVisibleBottom,
        bottomEdgeVisible: logicalVisibleBottom >= board.height - 1,
        flippersComplete: flipperBounds.every((bounds) => contains(clipRect, bounds)),
        targetsLargeEnough: requiredButtons.every((button) => {
          const rect = button.getBoundingClientRect();
          return rect.width >= 43.5 && rect.height >= 43.5;
        }),
        noVerticalScroll: scrollSurfaces.every((surface) => surface.scrollHeight <= surface.clientHeight + 1 && Math.abs(surface.scrollTop) <= 1),
        canvas: { top: canvasRect.top, bottom: canvasRect.bottom, width: canvasRect.width, height: canvasRect.height },
        canvasContent: canvasContentRect,
        clip: clipRect,
        pad: { top: padRect.top, bottom: padRect.bottom, width: padRect.width, height: padRect.height },
        body: { top: bodyRect.top, bottom: bodyRect.bottom, scrollHeight: windowBody.scrollHeight, clientHeight: windowBody.clientHeight },
        root: { scrollHeight: rootNode.scrollHeight, clientHeight: rootNode.clientHeight },
        flippers: flipperBounds,
        buttons: requiredButtons.map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        })
      };
    }, {
      width: PINBALL_BOARD_WIDTH,
      height: PINBALL_BOARD_HEIGHT,
      ratioTolerance: PINBALL_RATIO_TOLERANCE
    });

    const caseLabel = `${viewportCase.width}x${viewportCase.height}`;
    ensure(mobileLayout.complete && mobileLayout.hasTouch, `El contexto movil ${caseLabel} no expuso touch real (${JSON.stringify(mobileLayout)})`);
    ensure(mobileLayout.buttonCount === 3 && mobileLayout.targetsLargeEnough, `El dock de Pinball no expuso tres controles de al menos 44 px en ${caseLabel} (${JSON.stringify(mobileLayout)})`);
    ensure(mobileLayout.padVisible && mobileLayout.canvasContained, `Canvas o dock de Pinball quedaron recortados en ${caseLabel} (${JSON.stringify(mobileLayout)})`);
    ensure(mobileLayout.ratioWithinTolerance, `El canvas de Pinball deformo la relacion 520:700 en ${caseLabel} (${JSON.stringify(mobileLayout)})`);
    ensure(mobileLayout.logicalVisibleBottom >= PINBALL_BOARD_HEIGHT - 1 && mobileLayout.bottomEdgeVisible, `El borde inferior del tablero no quedo visible en ${caseLabel} (${JSON.stringify(mobileLayout)})`);
    ensure(mobileLayout.flippersComplete, `Los flippers no quedaron completamente visibles en ${caseLabel} (${JSON.stringify(mobileLayout)})`);
    ensure(mobileLayout.noVerticalScroll, `Pinball genero scroll vertical en ${caseLabel} (${JSON.stringify(mobileLayout)})`);

    if (viewportCase.exerciseTouch) {
      const cdp = await context.newCDPSession(page);
      await touchPinballControl(page, cdp, appWindow.locator('[data-pinball-left]'), '[data-pinball-left]', 'left', 11);
      await touchPinballControl(page, cdp, appWindow.locator('[data-pinball-right]'), '[data-pinball-right]', 'right', 12);
      await root.evaluate((rootNode) => {
        const app = rootNode._pinballApp || rootNode.closest('.window')?._pinballApp;
        app.resetGame({ announce: false });
      });
      const plungerReleased = await touchPinballControl(page, cdp, appWindow.locator('[data-pinball-plunger]'), '[data-pinball-plunger]', 'plunger', 13, 160);
      ensure(plungerReleased.gameState === 'playing' && plungerReleased.launchPower >= 0.3 && plungerReleased.ballInLauncherLane, `El lanzador no disparo la bola al soltar el control tactil (${JSON.stringify(plungerReleased)})`);
      ensure(await page.locator('clippy-character').count() === 0, 'Clippy reaparecio durante la sesion movil');
    }

    return caseLabel;
  } finally {
    await context.close();
  }
}

async function exerciseMobileClippyAndPinball(browser, baseUrl) {
  const auditedViewports = [];
  for (const viewportCase of PINBALL_MOBILE_VIEWPORTS) {
    auditedViewports.push(await auditMobilePinballViewport(browser, baseUrl, viewportCase));
  }
  return `Movil real: Clippy deshabilitado y Pinball completo en ${auditedViewports.join(', ')}, con touch press/release y lanzamiento`;
}

async function main() {
  const server = await createStaticServer();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const consoleErrors = [];
  const failedRequests = [];
  const successfulMusic = new Set();

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('response', (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname.includes('/assets/music/') && [200, 206].includes(response.status())) {
      successfulMusic.add(pathname);
    }
  });
  page.on('requestfailed', (request) => {
    const url = request.url();
    const errorText = request.failure()?.errorText || 'failed';
    const pathname = new URL(url).pathname;
    const isPortfolioMusic = pathname.includes('/assets/music/');
    const isBenignAbort = errorText === 'net::ERR_ABORTED'
      && (/\.pdf$/i.test(pathname) || (/\.mp3$/i.test(pathname) && !isPortfolioMusic));
    if (url.startsWith(baseUrl)) {
      if (!isBenignAbort) failedRequests.push({ text: `${errorText} ${url}`, pathname, isPortfolioMusic });
    }
  });

  try {
    await installApiFixtures(page);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('zarateXP_session', 'active'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.desktop', { state: 'visible', timeout: 12000 });
    await page.waitForFunction(() => Boolean(window.zarateXP?.appManager?.windowManager), null, { timeout: 12000 });

    const exercised = [];
    exercised.push(await exerciseClippy(page));
    exercised.push(await exerciseResponsiveDesktop(browser, baseUrl));
    exercised.push(await exerciseBootSkip(browser, baseUrl));

    const positioning = await page.evaluate(() => {
      const schema = JSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || '{}');
      return {
        headline: document.querySelector('.user-title')?.textContent.trim(),
        jobTitle: schema.jobTitle,
        description: schema.description
      };
    });
    const expectedHeadline = 'Software Analyst & Project Manager | Software, Data & AI Solutions | Java, Spring Boot, React, Oracle';
    ensure(positioning.headline === expectedHeadline, 'El titular profesional visible no coincide con LinkedIn');
    ensure(positioning.jobTitle === 'Software Analyst & Project Manager', 'El Schema.org presenta un cargo FDE no ejercido');
    ensure(/oriented to Forward Deployed Engineer opportunities/i.test(positioning.description || ''), 'El perfil no conserva su orientación hacia oportunidades FDE');
    const defaultDesktopOrder = await page.locator('.desktop-icons > .desktop-icon').evaluateAll((icons) => icons.slice(0, 6).map((icon) => icon.dataset.programName));
    ensure(defaultDesktopOrder.join(',') === 'recruiter-route,resume,projects,contact,documents,certificates', `El escritorio inicial no priorizó el recorrido recruiter (${defaultDesktopOrder.join(',')})`);

    const expectedWindows = new Set(['about-me', 'projects', 'pdf-studio', 'contact', 'certificates', 'recruiter-route', 'github-activity', 'api-center', 'n8n-flows', 'winamp', 'solitaire', 'minesweeper', 'pinball', 'paint']);
    exercised.push(await exerciseStartMenuAndPaint(page));
    exercised.push(await exerciseProjectExplorer(page));
    exercised.push(await exerciseMlopsLifecycle(page));
    for (const appId of ['about-me', 'projects', 'pdf-studio', 'contact']) await openApp(page, appId);

    exercised.push(await exerciseCertificates(page));
    exercised.push(await exerciseGitHubActivity(page));
    exercised.push(await exerciseApiCenter(page));
    exercised.push(await exerciseWinamp(page));
    exercised.push(await exerciseSolitaire(page));
    exercised.push(await exerciseMinesweeper(page));
    exercised.push(await exercisePinball(page));
    exercised.push(await exerciseMobileClippyAndPinball(browser, baseUrl));

    const openedWindows = await page.locator('#windows-container .window').evaluateAll((nodes) => nodes.map((node) => node.dataset.windowId));
    const missingWindows = [...expectedWindows].filter((id) => !openedWindows.includes(id));
    const unresolvedFailures = failedRequests.filter((failure) => {
      return !failure.isPortfolioMusic || !successfulMusic.has(failure.pathname);
    });

    if (missingWindows.length || consoleErrors.length || unresolvedFailures.length) {
      if (missingWindows.length) console.error(`Missing windows: ${missingWindows.join(', ')}`);
      if (consoleErrors.length) console.error(`Console errors:\n${consoleErrors.join('\n')}`);
      if (unresolvedFailures.length) console.error(`Failed local requests:\n${unresolvedFailures.map((failure) => failure.text).join('\n')}`);
      process.exitCode = 1;
      return;
    }

    console.log(`Smoke browser check passed: opened ${openedWindows.length} windows at ${baseUrl}`);
    exercised.forEach((result) => console.log(`- ${result}`));
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
