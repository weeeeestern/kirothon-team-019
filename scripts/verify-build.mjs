import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../src/package.json', import.meta.url));
const { JSDOM, VirtualConsole } = require('jsdom');
const dist = new URL('../src/dist/', import.meta.url);
const html = readFileSync(new URL('index.html', dist), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)];
assert.ok(scripts.length, 'The production page must load a JavaScript bundle');

const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => errors.push(error.cause?.message ?? error.message));
virtualConsole.on('error', (...args) => errors.push(args.map(String).join(' ')));
const dom = new JSDOM(html, {
  url: 'http://localhost/',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole,
});
dom.window.structuredClone = structuredClone;
dom.window.matchMedia = () => ({
  matches: false,
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
});

try {
  // Execute the built bundle without test-setup preloading of the avatar.
  // This catches production module interop failures that dev-mode tests miss.
  for (const [, src] of scripts) {
    // jsdom evaluates classic scripts; Vite's lazy-chunk helper contains
    // import.meta.url even before a lazy section is opened. Supply that single
    // module value for this home-render check. Real module loading is checked
    // separately in a browser against the production preview.
    const source = readFileSync(new URL(src.replace(/^\//, ''), dist), 'utf8');
    dom.window.eval(source.replaceAll('import.meta', `({url:${JSON.stringify(new URL(src, dom.window.location.href).href)}})`));
  }
  for (let i = 0; i < 40; i++) {
    if (errors.length || dom.window.document.querySelector('#root .hero')) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.deepEqual(errors, [], 'Production bundle must not throw while rendering');
  assert.equal(typeof dom.window.KiroAvatar?.render, 'function');
  assert.match(dom.window.document.querySelector('#root').textContent, /오늘 평범도/);
  assert.ok(dom.window.document.querySelector('.kiro-avatar svg'), 'Avatar must render');
  assert.ok(dom.window.document.querySelector('nav[aria-label="메인 메뉴"]'));
  console.log('Production bundle smoke test passed: home, avatar, navigation.');
} finally {
  dom.window.close();
}
