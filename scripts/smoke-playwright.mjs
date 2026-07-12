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

async function main() {
  const server = await createStaticServer();
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const consoleErrors = [];
  const failedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('requestfailed', (request) => {
    const url = request.url();
    const errorText = request.failure()?.errorText || 'failed';
    const isBenignAbort = errorText === 'net::ERR_ABORTED' && /\.(mp3|pdf)(?:[?#].*)?$/i.test(new URL(url).pathname);
    if (url.startsWith(baseUrl)) {
      if (!isBenignAbort) failedRequests.push(`${errorText} ${url}`);
    }
  });

  try {
    await installApiFixtures(page);
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('zarateXP_session', 'active'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.desktop', { state: 'visible', timeout: 12000 });
    await page.waitForFunction(() => Boolean(window.zarateXP?.appManager?.windowManager), null, { timeout: 12000 });

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

    const expectedWindows = new Set(['about-me', 'projects', 'pdf-studio', 'contact', 'api-center', 'solitaire', 'minesweeper', 'pinball']);
    for (const appId of ['about-me', 'projects', 'pdf-studio', 'contact']) await openApp(page, appId);

    const exercised = [];
    exercised.push(await exerciseApiCenter(page));
    exercised.push(await exerciseSolitaire(page));
    exercised.push(await exerciseMinesweeper(page));
    exercised.push(await exercisePinball(page));

    const openedWindows = await page.locator('#windows-container .window').evaluateAll((nodes) => nodes.map((node) => node.dataset.windowId));
    const missingWindows = [...expectedWindows].filter((id) => !openedWindows.includes(id));

    if (missingWindows.length || consoleErrors.length || failedRequests.length) {
      if (missingWindows.length) console.error(`Missing windows: ${missingWindows.join(', ')}`);
      if (consoleErrors.length) console.error(`Console errors:\n${consoleErrors.join('\n')}`);
      if (failedRequests.length) console.error(`Failed local requests:\n${failedRequests.join('\n')}`);
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
