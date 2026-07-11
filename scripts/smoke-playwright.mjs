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
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('zarateXP_session', 'active'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.desktop', { state: 'visible', timeout: 12000 });
    await page.waitForFunction(() => Boolean(window.zarateXP?.appManager?.windowManager), null, { timeout: 12000 });

    const expectedWindows = new Set(['about-me', 'projects', 'pdf-studio', 'pinball', 'contact']);
    for (const appId of expectedWindows) {
      await page.evaluate((id) => window.zarateXP.appManager.openApp(id), appId);
      await page.waitForFunction(
        (id) => Boolean(document.querySelector(`#windows-container .window[data-window-id="${id}"]`)),
        appId,
        { timeout: 12000 }
      );
    }

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
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
