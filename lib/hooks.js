"use client";
import { useState, useEffect, useRef } from "react";
import { storage } from "./storage";

// =====================================================================
// LIVE DATA POLLING ENGINE
// -----------------------------------------------------------------------
// Built specifically to avoid the failure mode that froze a previous
// site during live games: many independent pollers doing full-panel
// innerHTML rebuilds, with no dedupe, no backoff, and no pause when the
// tab isn't visible -- so live-game traffic spikes turned into piled-up,
// overlapping, expensive re-renders.
//
// Every safeguard here maps directly to that diagnosis:
//   1. One useLiveResource call = one resource, one poll loop. No two
//      components ever independently poll the same thing.
//   2. In-flight dedupe -- if a fetch for this resource hasn't resolved
//      yet, the next scheduled tick is skipped entirely rather than
//      firing a second overlapping request.
//   3. Exponential backoff on errors (capped at 2 min) -- exactly when
//      live traffic makes the API slower/flakier is when you should be
//      polling LESS aggressively, not retrying harder.
//   4. Polling pauses while the tab is hidden and resumes immediately
//      (not on the next tick) when it becomes visible again.
//   5. React's virtual DOM means updating this resource's state only
//      re-renders the components that actually read it -- never a full
//      app-wide re-render the way raw innerHTML replacement would.
//
// This mechanism is unchanged from the pre-migration artifact. What
// changed is only what a `fetcher` does under the hood: it now calls one
// of our own /api/* route handlers (see lib/apiFetchers.js), which sit
// behind the server-side TTL cache in lib/cache.js -- the client never
// talks to a live provider directly.
// =====================================================================
export function useLiveResource(key, fetcher, { intervalMs = 15000, pauseWhenHidden = true } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null, lastUpdated: null });
  const inFlightRef = useRef(false);
  const backoffRef = useRef(intervalMs);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher; // always call the latest fetcher without restarting the poll loop

  useEffect(() => {
    let cancelled = false;
    let timer;

    async function tick() {
      if (pauseWhenHidden && typeof document !== "undefined" && document.hidden) {
        timer = setTimeout(tick, intervalMs);
        return;
      }
      if (inFlightRef.current) {
        // Previous fetch for THIS resource is still in flight -- skip this
        // cycle rather than stacking a second overlapping request.
        timer = setTimeout(tick, backoffRef.current);
        return;
      }
      inFlightRef.current = true;
      try {
        const data = await fetcherRef.current();
        if (!cancelled) {
          setState({ data, loading: false, error: null, lastUpdated: Date.now() });
          backoffRef.current = intervalMs; // reset backoff after a clean fetch
        }
      } catch (err) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: err }));
          backoffRef.current = Math.min(backoffRef.current * 2, 120000); // back off, cap at 2 min
        }
      } finally {
        inFlightRef.current = false;
        if (!cancelled) timer = setTimeout(tick, backoffRef.current);
      }
    }

    tick();

    // Resume immediately on becoming visible again, instead of waiting for
    // the next scheduled tick -- keeps the UI feeling live without polling
    // harder than necessary while backgrounded.
    const onVisible = () => { if (!document.hidden) { clearTimeout(timer); tick(); } };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [key, intervalMs, pauseWhenHidden]);

  return state;
}

export function useGameFilter(items) {
  const games = [...new Set(items.map(i => i.game))];
  const [game, setGame] = useState("all");
  const filtered = game === "all" ? items : items.filter(i => i.game === game);
  return { games, game, setGame, filtered };
}

// ---- Persistence ----
// Personal data only -- favorites, the parlay build, and the track record log are
// specific to whoever's using the browser, not something other visitors should see.
// Backed by lib/storage.js -> /api/storage/[key] -> SQLite, keyed by an anonymous
// session cookie (see lib/session.js), replacing the artifact-platform-only
// window.storage this app used to call directly.

// Shared favorites/watchlist across every tab that shows player cards. Each tab that
// uses this independently loads/saves the same "favorites" key, so starring a player
// in one tab is reflected the next time any tab reads it.
export function useFavorites() {
  const [favorites, setFavorites] = useState(new Set());
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("favorites");
        if (res) setFavorites(new Set(JSON.parse(res.value)));
      } catch (e) { /* nothing saved yet -- normal on first visit */ }
    })();
  }, []);
  const toggleFavorite = (name) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      storage.set("favorites", JSON.stringify([...next])).catch(() => {});
      return next;
    });
  };
  return { favorites, toggleFavorite };
}
