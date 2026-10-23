import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveDeepLink } from '../js/deep-links.js';

test('resolves existing aliases, internal IDs and encoded valid links', () => {
  for (const [hash, app] of [['#cv', 'resume'], ['#/CONTACTO', 'contact'], ['#%63v', 'resume'], ['#%20proyectos%20', 'projects'], ['#pdf-studio', 'pdf-studio']]) {
    assert.equal(resolveDeepLink(hash), app);
  }
});

test('ignores empty, unknown and malformed encoded fragments without interrupting boot', () => {
  for (const hash of ['', '#', '#unknown', '#%', '#%2', '#%GG', '#%E0%A4%A', '#%ED%A0%80', '#%FF']) {
    assert.equal(resolveDeepLink(hash), null, hash);
  }
});
