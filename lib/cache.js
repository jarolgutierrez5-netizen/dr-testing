// ---- Server-side TTL cache ----
// Sits in front of every real data source so /api/* routes never hit an upstream
// provider more often than the resource's TTL allows, and so concurrent requests for
// the same resource collapse into a single upstream fetch instead of stampeding it --
// the same in-flight-dedupe principle useLiveResource applies on the client, mirrored
// here on the server.
//
// Resource-specific TTLs (see lib/ttl.js): standings ~hourly, live scores ~30s,
// player stats ~daily. Each /api/* route picks its own TTL when it calls getOrFetch.
//
// Stored on globalThis so Next.js dev-mode module hot-reloading doesn't wipe the
// cache/in-flight map on every edit (the usual Prisma-singleton trick).

const store = globalThis.__diamondLedgerCache || (globalThis.__diamondLedgerCache = new Map());
const inFlight = globalThis.__diamondLedgerInFlight || (globalThis.__diamondLedgerInFlight = new Map());

export async function getOrFetch(key, ttlMs, fetcher) {
  const entry = store.get(key);
  const now = Date.now();
  if (entry && entry.expiresAt > now) {
    return { data: entry.data, cached: true, ageMs: now - entry.fetchedAt };
  }

  if (inFlight.has(key)) {
    const data = await inFlight.get(key);
    return { data, cached: false, ageMs: 0 };
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      store.set(key, { data, fetchedAt: Date.now(), expiresAt: Date.now() + ttlMs });
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();
  inFlight.set(key, promise);

  const data = await promise;
  return { data, cached: false, ageMs: 0 };
}

export function invalidate(key) {
  store.delete(key);
}

export function cacheStatus(key) {
  const entry = store.get(key);
  if (!entry) return { present: false };
  const now = Date.now();
  return { present: true, fresh: entry.expiresAt > now, ageMs: now - entry.fetchedAt, expiresInMs: entry.expiresAt - now };
}
