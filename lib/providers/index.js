// Single switch point for which provider backs each /api/* route. Every provider
// module (stub.js, bigBallsSports.js, mlbStatsApi.js) implements the same
// fetchStandings/fetchLiveScores/fetchPlayerStats interface, so flipping a resource
// from mock to a real live source is exactly one line here -- nothing in lib/cache.js,
// the route handlers, lib/dataAccess.js, or any component needs to change.
//
// Still pointed at the stub for every resource: the backend (cache + routes) is
// built and independently testable, but no real, paid, or CORS-unverified API call
// happens until each of these is deliberately swapped.
import * as stub from "./stub";
// import * as bigBalls from "./bigBallsSports";
// import * as mlbStatsApi from "./mlbStatsApi";

export const standingsProvider = stub;
export const liveScoresProvider = stub;
export const playerStatsProvider = stub;
