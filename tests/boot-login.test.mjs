import assert from 'node:assert/strict';
import test from 'node:test';
// boot.js also exposes its constructor to the browser global.
const originalWindow = globalThis.window;
globalThis.window = {};
const { BootManager } = await import('../js/boot.js');
globalThis.window = originalWindow;

for (const input of ['Enter', ' ', 'click']) {
  test(`visible login accepts early ${JSON.stringify(input)} once before its fade delay completes`, async () => {
    const previousWindow = globalThis.window;
    const previousStorage = globalThis.localStorage;
    const user = new EventTarget();
    user.setAttribute = () => {};
    const content = { style: {} };
    const welcome = { style: {}, classList: { remove() {} } };
    const login = {
      style: {}, inert: true, removeAttribute() {},
      querySelector(selector) {
        return { '.right .back-gradient': user, '.welcome-message': welcome, '.login-screen': content }[selector] || null;
      }
    };
    let releaseReveal;
    const reveal = new Promise((resolve) => { releaseReveal = resolve; });
    let starts = 0;
    let desktops = 0;
    globalThis.window = {
      matchMedia: () => ({ matches: true }),
      zarateXP: { soundManager: { play() { starts += 1; } } }
    };
    globalThis.localStorage = { setItem() {} };
    const manager = Object.assign(Object.create(BootManager.prototype), {
      loginScreen: login, loginHandlersSet: false,
      delay: (ms) => ms === 100 ? reveal : Promise.resolve(),
      fadeOut: async () => {},
      showDesktop: async () => { desktops += 1; }
    });
    let opening;
    try {
      opening = manager.showLoginScreen();
      assert.equal(login.style.display, 'flex');
      assert.equal(login.inert, false);
      const activate = () => {
        const event = new Event(input === 'click' ? 'click' : 'keydown', { cancelable: true });
        if (input !== 'click') Object.defineProperty(event, 'key', { value: input });
        user.dispatchEvent(event);
      };
      activate();
      activate();
      assert.equal(starts, 1, 'Early input must not be lost or start two sessions');
      releaseReveal();
      await opening;
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(desktops, 1);
      // Calling showLoginScreen again must not register another start handler.
      await manager.showLoginScreen();
      activate();
      assert.equal(starts, 1);
    } finally {
      releaseReveal();
      await opening;
      globalThis.window = previousWindow;
      globalThis.localStorage = previousStorage;
    }
  });
}
