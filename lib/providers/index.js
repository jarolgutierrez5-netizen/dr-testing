// Single switch point for which provider backs each /api/* route. Every provider
// module (stub.js, bigBallsSports.js, mlbStatsApi.js) implements the same
// fetchStandings/fetchLiveScores/fetchPlayerStats interface, so flipping a resource
// from mock to a real live source is exactly one line here -- nothing in lib/cache.js,
// the route handlers, lib/dataAccess.js, or any component needs to change.
//
// standings now points at the real (free, unofficial) MLB Stats API -- see the
// verification caveat at the top of lib/providers/mlbStatsApi.js. live-scores and
// player-stats stay on the stub: player-level data needs a separate person-ID
// mapping effort, and live in-game scores aren't consumed by any component yet.
import * as stub from "./stub";
// import * as bigBalls from "./bigBallsSports";
import * as mlbStatsApi from "./mlbStatsApi";

export const standingsProvider = mlbStatsApi;
export const liveScoresProvider = stub;
export const playerStatsProvider = stub;
