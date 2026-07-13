import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
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

  await appWindow.locator('.xp-api-sidebar [data-api-clear-cache]').click();
  const cachedAfterClear = await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('zarateXP.apiCache.')).length);
  ensure(cachedAfterClear === 0, 'API Center no limpió su caché');

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

async function exerciseMobileClippyAndPinball(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
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

    const trayClippy = page.locator('.tray-clippy-icon');
    ensure(await trayClippy.count() === 1 && await trayClippy.isHidden(), 'El icono de Clippy en la bandeja no quedo oculto en un dispositivo movil real');

    await page.evaluate(() => window.zarateXP.clippyManager.showWelcome());
    await page.waitForTimeout(650);
    ensure(await page.locator('clippy-character').count() === 0, 'showWelcome creo un host de Clippy en movil');
    await page.evaluate(() => window.zarateXP.clippyManager.showTip(0));
    await page.waitForTimeout(650);
    ensure(await page.locator('clippy-character').count() === 0, 'showTip creo un host de Clippy en movil');

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

    const mobileLayout = await appWindow.evaluate((windowNode) => {
      const rootNode = windowNode.querySelector('[data-pinball-root]');
      const windowBody = windowNode.querySelector('.window-body');
      const canvasNode = rootNode?.querySelector('[data-pinball-canvas]');
      const pad = rootNode?.querySelector('.xp-pinball-pad');
      const requiredButtons = [
        rootNode?.querySelector('[data-pinball-left]'),
        rootNode?.querySelector('[data-pinball-plunger]'),
        rootNode?.querySelector('[data-pinball-right]')
      ];
      if (!rootNode || !windowBody || !canvasNode || !pad || requiredButtons.some((button) => !button)) {
        return { complete: false };
      }

      const bodyRect = windowBody.getBoundingClientRect();
      const canvasRect = canvasNode.getBoundingClientRect();
      const padRect = pad.getBoundingClientRect();
      const taskbarTop = document.querySelector('.taskbar')?.getBoundingClientRect().top ?? window.innerHeight;
      const usableBottom = Math.min(window.innerHeight, taskbarTop);
      const inViewport = (rect) => rect.width > 0 && rect.height > 0
        && rect.left >= -1 && rect.right <= window.innerWidth + 1
        && rect.top >= -1 && rect.bottom <= usableBottom + 1;
      const inWindowBody = (rect) => rect.left >= bodyRect.left - 1
        && rect.right <= bodyRect.right + 1
        && rect.top >= bodyRect.top - 1
        && rect.bottom <= bodyRect.bottom + 1;
      const scrollingElement = document.scrollingElement;
      const scrollSurfaces = [scrollingElement, windowBody, rootNode].filter(Boolean);

      return {
        complete: true,
        viewport: { width: window.innerWidth, height: window.innerHeight, usableBottom },
        hasTouch: navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches,
        buttonCount: pad.querySelectorAll('button').length,
        padVisible: getComputedStyle(pad).display !== 'none' && inViewport(padRect) && inWindowBody(padRect),
        canvasVisible: getComputedStyle(canvasNode).display !== 'none' && inViewport(canvasRect) && inWindowBody(canvasRect),
        targetsLargeEnough: requiredButtons.every((button) => {
          const rect = button.getBoundingClientRect();
          return rect.width >= 43.5 && rect.height >= 43.5;
        }),
        noVerticalScroll: scrollSurfaces.every((surface) => surface.scrollHeight <= surface.clientHeight + 1 && Math.abs(surface.scrollTop) <= 1),
        canvas: { top: canvasRect.top, bottom: canvasRect.bottom, width: canvasRect.width, height: canvasRect.height },
        pad: { top: padRect.top, bottom: padRect.bottom, width: padRect.width, height: padRect.height },
        body: { top: bodyRect.top, bottom: bodyRect.bottom, scrollHeight: windowBody.scrollHeight, clientHeight: windowBody.clientHeight },
        root: { scrollHeight: rootNode.scrollHeight, clientHeight: rootNode.clientHeight },
        buttons: requiredButtons.map((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        })
      };
    });

    ensure(mobileLayout.complete && mobileLayout.hasTouch, `El contexto movil no expuso touch real (${JSON.stringify(mobileLayout)})`);
    ensure(mobileLayout.buttonCount === 3 && mobileLayout.targetsLargeEnough, `El dock de Pinball no expuso tres controles de al menos 44 px (${JSON.stringify(mobileLayout)})`);
    ensure(mobileLayout.padVisible && mobileLayout.canvasVisible && mobileLayout.noVerticalScroll, `Canvas y dock de Pinball no quedaron visibles simultaneamente sin scroll vertical (${JSON.stringify(mobileLayout)})`);

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

    return 'Movil real: Clippy deshabilitado y Pinball con dock tactil, touch press/release y lanzamiento';
  } finally {
    await context.close();
  }
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

    const expectedWindows = new Set(['about-me', 'projects', 'pdf-studio', 'contact', 'api-center', 'n8n-flows', 'winamp', 'solitaire', 'minesweeper', 'pinball']);
    exercised.push(await exerciseMlopsLifecycle(page));
    for (const appId of ['about-me', 'projects', 'pdf-studio', 'contact']) await openApp(page, appId);

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
