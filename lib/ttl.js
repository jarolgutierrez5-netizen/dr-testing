// Resource-specific cache TTLs, in milliseconds. One place to tune how often each
// resource type is allowed to hit its upstream provider.
export const TTL = {
  standings: 60 * 60 * 1000,       // ~hourly -- standings/records don't move mid-game
  liveScores: 30 * 1000,           // ~30s -- close to real-time during live games
  playerStats: 24 * 60 * 60 * 1000, // ~daily -- season stats/injury reports update slowly
};
