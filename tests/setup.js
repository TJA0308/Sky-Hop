/**
 * Minimal in-memory localStorage polyfill for tests. Node has no browser
 * `localStorage` global; SaveManager.js only ever calls getItem/setItem/
 * removeItem on it, so a tiny in-memory stub is enough — no need for a
 * jsdom/happy-dom dependency just for this.
 */
class MemoryStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new MemoryStorage();
