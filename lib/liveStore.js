// Minimal external store for live-fetched standings/slate data. Populated client-side
// once /api/standings resolves (see the hydration call in components/DiamondLedger.jsx).
// lib/dataAccess.js's getStandings/getTeam/getSlate prefer this over the static /data
// fallback once it's set, so components need no changes to pick up live data -- same
// "seam" principle the getters were built around from the start.
let state = { standings: null, slate: null };

export function getLiveStandings() { return state.standings; }
export function getLiveSlate() { return state.slate; }

export function setLiveData(data) {
  if (!data) return;
  state = { standings: data.standings || null, slate: data.slate || null };
}
