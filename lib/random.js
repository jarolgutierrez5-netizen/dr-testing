// ---- Deterministic mock-data generator ----
// Seeded off a string key so numbers stay stable across renders instead of reshuffling
// on every open/close -- still clearly labeled MOCK DATA in the UI itself.
export function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return function next() {
    h = Math.imul(h ^ (h >>> 15), 1 | h);
    h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(x, min, max) { return Math.max(min, Math.min(max, x)); }
