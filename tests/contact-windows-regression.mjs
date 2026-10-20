// Run: node tests/contact-windows-regression.mjs
// Optional system browser: PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
// EmailJS is a deferred in-page mock. External requests and mail clients are blocked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'output', 'contact-windows-regression');
const types = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.gif': 'image/gif', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json'
};
const desktopViewport = { width: 1440, height: 900 };
const windowSelector = (id) => `.window[data-window-id="${id}"]`;
const contactSelector = windowSelector('contact');
const sendSelector = `${contactSelector} .toolbar-btn[form="contact-form"]`;

async function serve() {
  const server = http.createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
      response.writeHead(400).end();
      return;
    }
    const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${root}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

async function installFixtures(context, baseUrl, outbound) {
  // Route everything: even a regression that bypasses the mock cannot send mail.
  await context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.hostname === 'api.emailjs.com' || url.hostname.endsWith('.emailjs.com')) {
      outbound.emailjs.push({ url: request.url(), method: request.method() });
      await route.abort('blockedbyclient');
    } else if (url.origin === baseUrl) {
      await route.continue();
    } else {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        outbound.submissions.push({ url: request.url(), method: request.method() });
      }
      await route.abort('blockedbyclient');
    }
  });
  await context.addInitScript(() => {
    try {
      localStorage.setItem('zarateXP_session', 'active');
      localStorage.setItem('zarateXP.locale', 'es');
      localStorage.removeItem('zarateXP.contactLastSent');
    } catch {
      // about:blank has no storage; the script runs again for the local document.
    }
    const pending = [];
    window.__contactTest = {
      calls: [], initCalls: [], opens: [], invalidFields: [],
      resolveNext() {
        const operation = pending.shift();
        if (!operation) throw new Error('No mocked EmailJS send is pending');
        operation.resolve({ status: 200, text: 'Mock OK' });
      },
      rejectNext(asObject = false) {
        const operation = pending.shift();
        if (!operation) throw new Error('No mocked EmailJS send is pending');
        operation.reject(asObject
          ? { status: 503, text: 'Mock temporary service failure' }
          : new Error('Mock temporary service failure'));
      }
    };
    window.emailjs = {
      init(...args) { window.__contactTest.initCalls.push(args); },
      send(service, template, params) {
        window.__contactTest.calls.push({ service, template, params });
        return new Promise((resolve, reject) => pending.push({ resolve, reject }));
      }
    };
    window.open = (...args) => {
      window.__contactTest.opens.push(args);
      return null;
    };
    document.addEventListener('invalid', (event) => {
      window.__contactTest.invalidFields.push(event.target.id);
    }, true);
  });
}

async function openContact(page) {
  await page.evaluate(() => window.zarateXP.appManager.openApp('contact'));
  await page.locator(`${contactSelector} #contact-form`).waitFor();
  // Contact installs its form handler on a delayed callback, then focuses email.
  await page.waitForFunction(() => {
    const input = document.querySelector('.window[data-window-id="contact"] #contact-email');
    return input && document.activeElement === input;
  });
  await assertRegistered(page, 'contact');
}

async function fillContact(page, suffix = 'one', email = 'regression@example.invalid') {
  await page.locator(`${contactSelector} #contact-email`).fill(email);
  await page.locator(`${contactSelector} #contact-subject`).fill(`Regression ${suffix} & café`);
  await page.locator(`${contactSelector} #contact-body`).fill(`Mock message ${suffix}\nNo real email may be sent.`);
}

async function assertRegistered(page, id) {
  await page.locator(windowSelector(id)).waitFor();
  const state = await page.evaluate((windowId) => {
    const wm = window.zarateXP.windowManager;
    const taskbar = window.zarateXP.taskbarManager;
    return {
      windows: document.querySelectorAll(`.window[data-window-id="${windowId}"]`).length,
      registry: wm.windows.get(windowId)?.element.isConnected === true,
      taskbar: document.querySelectorAll(`.taskbar-program[data-window-id="${windowId}"]`).length,
      taskbarRegistry: taskbar.openPrograms.get(windowId)?.isConnected === true
    };
  }, id);
  assert.deepEqual(state, { windows: 1, registry: true, taskbar: 1, taskbarRegistry: true }, `${id} must have one live window and taskbar entry`);
}

async function assertGone(page, id) {
  await page.waitForFunction((windowId) => {
    const wm = window.zarateXP.windowManager;
    return !document.querySelector(`.window[data-window-id="${windowId}"]`)
      && !wm.windows.has(windowId)
      && !window.zarateXP.taskbarManager.openPrograms.has(windowId)
      && !document.querySelector(`.taskbar-program[data-window-id="${windowId}"]`)
      && wm.activeWindow !== windowId;
  }, id);
}

async function dismissDialog(page, id, useChrome = false) {
  await assertRegistered(page, id);
  const dialog = page.locator(windowSelector(id));
  await (useChrome ? dialog.locator('.close-btn') : dialog.locator('.window-body button').last()).click();
  await assertGone(page, id);
}

async function waitForSend(page, count) {
  await page.waitForFunction((expected) => window.__contactTest.calls.length === expected, count);
  await assertRegistered(page, 'sending-status');
  assert.equal(await page.locator(sendSelector).isDisabled(), true, 'Send toolbar must be disabled while EmailJS is pending');
}

async function allowNextSend(page) {
  await page.evaluate(() => localStorage.setItem('zarateXP.contactLastSent', String(Date.now() - 61000)));
}

async function assertSendAvailable(page) {
  await page.waitForFunction(() => !document.querySelector('.window[data-window-id="contact"] .toolbar-btn[form="contact-form"]').disabled);
}

async function geometry(page, id = 'geometry-regression') {
  return page.locator(windowSelector(id)).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const taskbar = document.querySelector('.taskbar').getBoundingClientRect();
    const controls = Array.from(element.querySelectorAll('.title-bar-controls button')).map((button) => {
      const bounds = button.getBoundingClientRect();
      return { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom };
    });
    return {
      left: rect.left, top: rect.top, width: rect.width, height: rect.height,
      right: rect.right, bottom: rect.bottom, taskbarTop: taskbar.top,
      viewportWidth: innerWidth, viewportHeight: innerHeight, controls,
      maximized: element.classList.contains('maximized')
    };
  });
}

async function assertContained(page) {
  const rect = await geometry(page);
  assert.equal(rect.maximized, false, 'Restore must leave maximized mode');
  assert.ok(rect.left >= -1 && rect.top >= -1 && rect.right <= rect.viewportWidth + 1 && rect.bottom <= rect.taskbarTop + 1,
    `Restored window must fit above the taskbar: ${JSON.stringify(rect)}`);
  assert.ok(rect.controls.every((button) => button.left >= -1 && button.top >= -1 && button.right <= rect.viewportWidth + 1 && button.bottom <= rect.taskbarTop + 1),
    `Restored titlebar controls must remain reachable: ${JSON.stringify(rect)}`);
}

async function makeGeometryWindow(page) {
  await page.evaluate(() => window.zarateXP.windowManager.createWindow({
    id: 'geometry-regression', title: 'Window geometry regression',
    width: 760, height: 540, x: 620, y: 200,
    content: '<p style="padding:16px">Restore keeps this window inside the visible desktop.</p>'
  }));
  await assertRegistered(page, 'geometry-regression');
}

async function resize(page, viewport) {
  await page.setViewportSize(viewport);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

const cases = [
  ...[desktopViewport, { width: 390, height: 844 }].map((viewport) => [
    `keyboard-window-activation-${viewport.width}`, async (page) => {
      await resize(page, viewport);
      const create = async () => page.evaluate(() => {
        const wm = window.zarateXP.windowManager;
        wm.createWindow({ id: 'keyboard-first', title: 'First keyboard window', width: 320, height: 260,
          content: '<input id="keyboard-first-input" aria-label="First field"><button id="keyboard-next" type="button">Next field</button>' });
        wm.createWindow({ id: 'keyboard-second', title: 'Second keyboard window', width: 320, height: 260,
          content: '<input id="keyboard-second-input" aria-label="Second field">' });
      });
      const assertActive = async (id) => {
        const state = await page.evaluate((windowId) => {
          const { windowManager: wm, taskbarManager: taskbar } = window.zarateXP;
          return {
            active: wm.activeWindow,
            activeClass: wm.windows.get(windowId).element.classList.contains('active'),
            taskbarPressed: taskbar.openPrograms.get(windowId).getAttribute('aria-pressed'),
            focusedWindow: document.activeElement.closest('.window')?.dataset.windowId
          };
        }, id);
        assert.deepEqual(state, { active: id, activeClass: true, taskbarPressed: 'true', focusedWindow: id },
          'Keyboard focus must raise its window and synchronize the taskbar');
      };
      await create();
      await page.locator('#keyboard-first-input').focus();
      await page.keyboard.press('Tab');
      await assertActive('keyboard-first');
      assert.equal(await page.locator('#keyboard-next').evaluate((el) => el === document.activeElement), true);
      await page.locator('#keyboard-second-input').focus();
      await assertActive('keyboard-second');
      await page.locator('#keyboard-first-input').focus();
      await assertActive('keyboard-first');
      await page.locator(`${windowSelector('keyboard-first')} .minimize-btn`).focus();
      await page.keyboard.press('Enter');
      await page.evaluate(() => window.zarateXP.windowManager.restoreWindow('keyboard-first'));
      await page.locator('#keyboard-first-input').focus();
      await assertActive('keyboard-first');
      await page.locator(`${windowSelector('keyboard-first')} .close-btn`).focus();
      await page.keyboard.press('Enter');
      await assertGone(page, 'keyboard-first');
      await create();
      await page.locator('#keyboard-first-input').focus();
      await assertActive('keyboard-first');
      await page.screenshot({ path: path.join(output, `keyboard-activation-${viewport.width}.png`) });
    }
  ]),
  ['native-email-validation', async (page) => {
    await openContact(page);
    await fillContact(page, 'invalid', 'not-an-email');
    await page.locator(sendSelector).click();
    const state = await page.evaluate(() => ({
      invalid: document.querySelector('#contact-email').validity.typeMismatch,
      invalidFields: window.__contactTest.invalidFields,
      sends: window.__contactTest.calls.length,
      lastSent: localStorage.getItem('zarateXP.contactLastSent')
    }));
    assert.equal(state.invalid, true);
    assert.ok(state.invalidFields.includes('contact-email'), 'Toolbar submission must use native constraint validation');
    assert.equal(state.sends, 0, 'Invalid email must never reach EmailJS');
    assert.equal(state.lastSent, null);
    await assertGone(page, 'sending-status');
    // A scripted submit event must not circumvent the same validity guard.
    await page.locator('#contact-form').evaluate((form) => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(await page.evaluate(() => window.__contactTest.calls.length), 0);
    await page.screenshot({ path: path.join(output, 'desktop-native-validation.png') });
  }],
  ['pending-send-close-reopen', async (page) => {
    await openContact(page);
    await fillContact(page, 'original');
    await page.locator(sendSelector).click();
    await waitForSend(page, 1);
    await page.locator('#contact-form').evaluate((form) => {
      for (let i = 0; i < 4; i += 1) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    assert.equal(await page.evaluate(() => window.__contactTest.calls.length), 1);
    await page.locator(`${contactSelector} .close-btn`).click();
    await assertGone(page, 'contact');
    await page.waitForFunction(() => !window.zarateXP.appManager.runningApps.has('contact'));
    await openContact(page);
    await fillContact(page, 'reopened draft');
    await page.locator('#contact-form').evaluate((form) => {
      document.querySelector('.toolbar-btn[form="contact-form"]').click();
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    assert.equal(await page.evaluate(() => window.__contactTest.calls.length), 1, 'Closing and reopening Contacto must not reset the in-flight lock');
    await page.evaluate(() => window.__contactTest.resolveNext());
    await assertGone(page, 'sending-status');
    await dismissDialog(page, 'contact-confirmation');
    await assertSendAvailable(page);
    assert.equal(await page.locator('#contact-subject').inputValue(), 'Regression reopened draft & café', 'An old completion must preserve the reopened form');
    assert.equal(await page.evaluate(() => window.__contactTest.calls[0].params.subject), 'Regression original & café');
    await allowNextSend(page);
    await page.locator(sendSelector).click();
    await waitForSend(page, 2);
    await page.evaluate(() => window.__contactTest.resolveNext());
    await assertGone(page, 'sending-status');
    await dismissDialog(page, 'contact-confirmation');
  }],
  ...[desktopViewport, { width: 390, height: 844 }, { width: 844, height: 390 }].map((viewport) => [
    `info-dialog-action-visible-${viewport.width}x${viewport.height}`, async (page) => {
      await resize(page, viewport);
      await openContact(page);
      for (let iteration = 0; iteration < 2; iteration += 1) {
        await page.locator(`${contactSelector} [data-contact-command="address-book"]`).click();
        await assertRegistered(page, 'info-dialog');
        const geometry = await page.locator(`${windowSelector('info-dialog')} .window-body`).evaluate((body) => {
          const bounds = body.getBoundingClientRect();
          const action = body.querySelector('button').getBoundingClientRect();
          return { bodyTop: bounds.top, bodyBottom: bounds.bottom, actionTop: action.top, actionBottom: action.bottom, scrollTop: body.scrollTop };
        });
        console.log('INFO_DIALOG_BASELINE', JSON.stringify({ viewport, ...geometry }));
        assert.equal(geometry.scrollTop, 0, 'Dialog should open without a hidden initial scroll offset');
        assert.ok(geometry.actionTop >= geometry.bodyTop && geometry.actionBottom <= geometry.bodyBottom + 1,
          `Accept should be visible without scrolling: ${JSON.stringify(geometry)}`);
        const action = page.locator(`${windowSelector('info-dialog')} [data-window-close]`);
        await action.focus();
        await page.keyboard.press('Enter');
        await assertGone(page, 'info-dialog');
      }
      assert.equal(await page.evaluate(() => window.__contactTest.calls.length), 0);
    }
  ]),
  ...[desktopViewport, { width: 390, height: 844 }, { width: 844, height: 390 }].flatMap((viewport) =>
    ['validation-error', 'contact-confirmation', 'email-error', 'mailto-fallback'].map((id) => [
      `contact-action-visible-${id}-${viewport.width}x${viewport.height}`, async (page) => {
        await resize(page, viewport);
        await openContact(page);
        if (id === 'mailto-fallback') {
          await page.evaluate(() => { window.zarateXP.appManager._canUseEmailJs = () => false; });
        }
        for (let iteration = 0; iteration < 2; iteration += 1) {
          await fillContact(page, `${id} ${iteration}`);
          if (id === 'validation-error') {
            await page.evaluate(() => localStorage.setItem('zarateXP.contactLastSent', String(Date.now())));
          } else {
            await allowNextSend(page);
          }
          await page.locator(sendSelector).click();
          if (id === 'contact-confirmation' || id === 'email-error') {
            await waitForSend(page, iteration + 1);
            await page.evaluate((fail) => fail ? window.__contactTest.rejectNext() : window.__contactTest.resolveNext(), id === 'email-error');
          }
          await assertRegistered(page, id);
          const geometry = await page.locator(`${windowSelector(id)} .window-body`).evaluate((body) => {
            const bounds = body.getBoundingClientRect();
            return {
              bodyTop: bounds.top, bodyBottom: bounds.bottom, bodyLeft: bounds.left, bodyRight: bounds.right,
              scrollTop: body.scrollTop,
              actions: [...body.querySelectorAll('button')].map((button) => {
                const rect = button.getBoundingClientRect();
                return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
              })
            };
          });
          console.log('CONTACT_ACTION_VISIBILITY', JSON.stringify({ id, viewport, ...geometry }));
          assert.equal(geometry.scrollTop, 0, 'Contact feedback must not open scrolled');
          assert.ok(geometry.actions.length > 0);
          assert.ok(geometry.actions.every((rect) => rect.top >= geometry.bodyTop && rect.bottom <= geometry.bodyBottom + 1
            && rect.left >= geometry.bodyLeft && rect.right <= geometry.bodyRight + 1),
          `Every contact action must be visible without scrolling: ${JSON.stringify(geometry)}`);
          const action = page.locator(`${windowSelector(id)} [data-window-close]`);
          await action.focus();
          await page.keyboard.press('Enter');
          await assertGone(page, id);
          await assertSendAvailable(page);
        }
      }
    ])
  ),
  ['info-validation-dialog-lifecycle', async (page) => {
    await openContact(page);
    for (let iteration = 0; iteration < 2; iteration += 1) {
      await page.locator(`${contactSelector} [data-contact-command="address-book"]`).click();
      await dismissDialog(page, 'info-dialog', iteration === 1);
    }
    await page.locator(`${contactSelector} [data-contact-command="address-book"]`).click();
    await assertRegistered(page, 'info-dialog');
    const closeContract = await page.evaluate(async () => {
      const wm = window.zarateXP.windowManager;
      const first = wm.closeWindow('info-dialog');
      const second = wm.closeWindow('info-dialog');
      const result = { awaitable: first instanceof Promise, samePromise: first === second };
      await Promise.all([first, second]);
      result.removedBeforeResolution = !wm.windows.has('info-dialog')
        && !window.zarateXP.taskbarManager.openPrograms.has('info-dialog')
        && !document.querySelector('.window[data-window-id="info-dialog"]');
      return result;
    });
    assert.deepEqual(closeContract, { awaitable: true, samePromise: true, removedBeforeResolution: true },
      'Repeated closeWindow calls must share a promise that resolves after cleanup');
    await assertGone(page, 'info-dialog');
    await page.locator(`${contactSelector} [data-contact-command="address-book"]`).click();
    await dismissDialog(page, 'info-dialog');
    await fillContact(page, 'cooldown');
    await page.evaluate(() => localStorage.setItem('zarateXP.contactLastSent', String(Date.now())));
    for (let iteration = 0; iteration < 2; iteration += 1) {
      await page.locator(sendSelector).click();
      await dismissDialog(page, 'validation-error', iteration === 1);
    }
    assert.equal(await page.evaluate(() => window.__contactTest.calls.length), 0, 'Cooldown validation must block sends');
  }],
  ['success-status-cleanup-and-retry', async (page) => {
    await openContact(page);
    for (let iteration = 0; iteration < 2; iteration += 1) {
      await allowNextSend(page);
      await fillContact(page, `success ${iteration}`);
      await page.locator(sendSelector).click();
      await waitForSend(page, iteration + 1);
      if (iteration === 0) await page.locator(`${windowSelector('sending-status')} .minimize-btn`).click();
      await page.evaluate(() => window.__contactTest.resolveNext());
      await assertGone(page, 'sending-status');
      await assertRegistered(page, 'contact-confirmation');
      await assertSendAvailable(page);
      assert.equal(await page.locator('#contact-email').inputValue(), '', 'Successful send must reset the original form');
      assert.ok(await page.evaluate(() => Number(localStorage.getItem('zarateXP.contactLastSent')) > Date.now() - 60000));
      await dismissDialog(page, 'contact-confirmation', iteration === 1);
    }
  }],
  ['rejected-send-retry-and-manual-mailto', async (page) => {
    await openContact(page);
    await fillContact(page, 'retry');
    for (let iteration = 0; iteration < 2; iteration += 1) {
      await page.locator(sendSelector).click();
      await waitForSend(page, iteration + 1);
      await page.evaluate((asObject) => window.__contactTest.rejectNext(asObject), iteration === 1);
      await assertGone(page, 'sending-status');
      await assertRegistered(page, 'email-error');
      assert.ok((await page.locator(windowSelector('email-error')).innerText()).includes('Mock temporary service failure'),
        'Both Error.message and EmailJS SDK rejection.text must reach the error dialog');
      await assertSendAvailable(page);
      assert.equal(await page.locator('#contact-subject').inputValue(), 'Regression retry & café', 'A failed send must preserve the draft');
      assert.equal(await page.evaluate(() => localStorage.getItem('zarateXP.contactLastSent')), null, 'A failed send must not start the success cooldown');
      if (iteration === 0) {
        await page.locator(`${windowSelector('email-error')} [data-mailto-fallback]`).click();
        const opened = await page.evaluate(() => window.__contactTest.opens);
        assert.equal(opened.length, 1);
        const mailto = new URL(opened[0][0]);
        assert.equal(mailto.protocol, 'mailto:');
        assert.equal(mailto.pathname, 'ivan.agustin.95@gmail.com');
        assert.equal(mailto.searchParams.get('subject'), 'Regression retry & café');
        assert.ok(mailto.searchParams.get('body').includes('Mock message retry'));
      }
      await dismissDialog(page, 'email-error', iteration === 1);
    }
    await page.locator(sendSelector).click();
    await waitForSend(page, 3);
    await page.evaluate(() => window.__contactTest.resolveNext());
    await assertGone(page, 'sending-status');
    await dismissDialog(page, 'contact-confirmation');
  }],
  ['automatic-mailto-dialog-lifecycle', async (page) => {
    await openContact(page);
    // Exercise the existing unsupported-domain branch without navigating externally.
    await page.evaluate(() => { window.zarateXP.appManager._canUseEmailJs = () => false; });
    for (let iteration = 0; iteration < 2; iteration += 1) {
      await fillContact(page, `fallback ${iteration}`);
      await page.locator(sendSelector).click();
      await assertGone(page, 'sending-status');
      await assertRegistered(page, 'mailto-fallback');
      await assertSendAvailable(page);
      await dismissDialog(page, 'mailto-fallback', iteration === 1);
    }
    const state = await page.evaluate(() => ({ calls: window.__contactTest.calls.length, opens: window.__contactTest.opens, lastSent: localStorage.getItem('zarateXP.contactLastSent') }));
    assert.equal(state.calls, 0);
    assert.equal(state.opens.length, 2);
    assert.equal(state.lastSent, null);
    assert.equal(new URL(state.opens[1][0]).searchParams.get('subject'), 'Regression fallback 1 & café');
  }],
  ['restore-preserves-unchanged-viewport', async (page) => {
    await makeGeometryWindow(page);
    const before = await geometry(page);
    const maximize = page.locator(`${windowSelector('geometry-regression')} .maximize-btn`);
    await maximize.click();
    assert.equal((await geometry(page)).maximized, true);
    await maximize.click();
    const after = await geometry(page);
    for (const property of ['left', 'top', 'width', 'height']) {
      assert.ok(Math.abs(after[property] - before[property]) <= 0.5, `${property} changed without a viewport change: ${before[property]} -> ${after[property]}`);
    }
    await assertContained(page);
  }],
  ['restore-after-desktop-shrink', async (page) => {
    await makeGeometryWindow(page);
    const maximize = page.locator(`${windowSelector('geometry-regression')} .maximize-btn`);
    await maximize.click();
    await resize(page, { width: 1000, height: 640 });
    await maximize.click();
    await assertContained(page);
    await page.screenshot({ path: path.join(output, 'desktop-restored.png') });
  }],
  ['restore-after-mobile-resize', async (page) => {
    await makeGeometryWindow(page);
    const maximize = page.locator(`${windowSelector('geometry-regression')} .maximize-btn`);
    await maximize.click();
    await resize(page, { width: 390, height: 844 });
    await maximize.click();
    await assertContained(page);
    await page.screenshot({ path: path.join(output, 'mobile-restored.png') });
    await maximize.click();
    await resize(page, { width: 430, height: 600 });
    await maximize.click();
    await assertContained(page);
    await resize(page, desktopViewport);
    await assertContained(page);
  }]
];

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const server = await serve();
  let browser;
  const failures = [];
  let totalEmailJsRequests = 0;
  let totalExternalSubmissions = 0;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {})
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    for (const [name, run] of cases) {
      const context = await browser.newContext({ viewport: desktopViewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const outbound = { emailjs: [], submissions: [] };
      const errors = [];
      let page;
      try {
        await installFixtures(context, baseUrl, outbound);
        page = await context.newPage();
        page.setDefaultTimeout(7000);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await page.locator('.desktop').waitFor({ state: 'visible', timeout: 12000 });
        await page.waitForFunction(() => window.zarateXP?.appManager?.windowManager && window.zarateXP?.taskbarManager);
        await run(page);
        assert.deepEqual(errors, [], 'Unexpected uncaught browser errors');
        assert.deepEqual(outbound.emailjs, [], 'No real EmailJS API request may be attempted');
        assert.deepEqual(outbound.submissions, [], 'No external submission may be attempted');
        console.log(`PASS ${name}`);
      } catch (error) {
        failures.push({ name, message: error.stack || String(error), errors, outbound });
        console.error(`FAIL ${name}: ${error.message}`);
        if (page) await page.screenshot({ path: path.join(output, `failure-${name}.png`) }).catch(() => {});
      } finally {
        totalEmailJsRequests += outbound.emailjs.length;
        totalExternalSubmissions += outbound.submissions.length;
        await context.close();
      }
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
  const summary = {
    cases: cases.length, passed: cases.length - failures.length, failed: failures.length,
    emailJsApiRequests: totalEmailJsRequests, externalSubmissions: totalExternalSubmissions,
    failures
  };
  fs.writeFileSync(path.join(output, 'results.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
