import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn().mockImplementation(query => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
window.scrollTo = vi.fn();
// jsdom does not implement pointer capture used by the route popup's drag handle.
HTMLElement.prototype.setPointerCapture = vi.fn();
HTMLElement.prototype.releasePointerCapture = vi.fn();
HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
afterEach(() => { cleanup(); localStorage.clear(); location.hash = ''; });

// Load the real UMD artwork in its browser branch, without replacing it with a mock.
runInNewContext(readFileSync(resolve(process.cwd(), '../design/animation/kiro-avatar-soft.js'), 'utf8'), { self: window });
