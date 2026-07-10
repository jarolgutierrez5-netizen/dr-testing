// Client-side replacement for window.storage (an artifact-platform-only API). Same
// call shape as before -- `storage.get(key)` / `storage.set(key, value)` -- so
// useFavorites/ParlayBuilder/TrackRecordView needed minimal changes, just talking to
// our own /api/storage/[key] route instead of a platform global. The second
// `shared`-mode argument window.storage took is dropped since this app never used
// `shared: true`.
export const storage = {
  async get(key) {
    const res = await fetch(`/api/storage/${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error(`storage.get(${key}) failed: ${res.status}`);
    const { value } = await res.json();
    return value === null ? null : { value };
  },
  async set(key, value) {
    const res = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!res.ok) throw new Error(`storage.set(${key}) failed: ${res.status}`);
  },
};
