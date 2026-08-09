// ---- Park HR factors + coordinates ----
// Hand-compiled static reference table approximating each park's well-known,
// multi-year home-run tendency (Coors/Great American/Yankee Stadium on the
// hitter-friendly end; Oracle Park/loanDepot/Petco/Comerica on the
// pitcher-friendly end). This is NOT a live-scraped, year-precise table --
// published park-factor figures vary noticeably by source and methodology,
// so treat these as directional approximations, not exact numbers. Teams
// missing here fall back to a neutral 1.0 factor and no weather adjustment.
//
// Keyed by MLB Stats API team abbreviation. A couple of alternate keys are
// included for teams whose abbreviation has been unstable (e.g. the
// Athletics' relocation-era rebrand) since this hasn't been verified live.
export const PARK_FACTORS = {
  NYY: { hrFactor: 1.15, lat: 40.8296, lon: -73.9262 },
  BOS: { hrFactor: 1.12, lat: 42.3467, lon: -71.0972 },
  TOR: { hrFactor: 1.02, lat: 43.6414, lon: -79.3894 },
  BAL: { hrFactor: 0.97, lat: 39.2839, lon: -76.6218 },
  TB: { hrFactor: 0.95, lat: 27.7683, lon: -82.6534 },
  CWS: { hrFactor: 1.05, lat: 41.8299, lon: -87.6338 },
  CLE: { hrFactor: 0.95, lat: 41.4962, lon: -81.6852 },
  DET: { hrFactor: 0.90, lat: 42.3390, lon: -83.0485 },
  KC: { hrFactor: 0.90, lat: 39.0517, lon: -94.4803 },
  MIN: { hrFactor: 0.95, lat: 44.9817, lon: -93.2776 },
  HOU: { hrFactor: 1.05, lat: 29.7573, lon: -95.3555 },
  LAA: { hrFactor: 0.97, lat: 33.8003, lon: -117.8827 },
  OAK: { hrFactor: 0.95, lat: 37.7516, lon: -122.2005 },
  ATH: { hrFactor: 0.95, lat: 37.7516, lon: -122.2005 },
  SEA: { hrFactor: 0.92, lat: 47.5914, lon: -122.3325 },
  TEX: { hrFactor: 1.08, lat: 32.7473, lon: -97.0842 },
  ATL: { hrFactor: 1.02, lat: 33.8908, lon: -84.4678 },
  MIA: { hrFactor: 0.85, lat: 25.7781, lon: -80.2196 },
  NYM: { hrFactor: 0.90, lat: 40.7571, lon: -73.8458 },
  PHI: { hrFactor: 1.10, lat: 39.9061, lon: -75.1665 },
  WSH: { hrFactor: 0.98, lat: 38.8730, lon: -77.0074 },
  CHC: { hrFactor: 1.00, lat: 41.9484, lon: -87.6553 },
  CIN: { hrFactor: 1.15, lat: 39.0979, lon: -84.5066 },
  MIL: { hrFactor: 1.10, lat: 43.0280, lon: -87.9712 },
  PIT: { hrFactor: 0.90, lat: 40.4469, lon: -80.0057 },
  STL: { hrFactor: 0.90, lat: 38.6226, lon: -90.1928 },
  ARI: { hrFactor: 0.95, lat: 33.4455, lon: -112.0667 },
  COL: { hrFactor: 1.25, lat: 39.7559, lon: -104.9942 },
  LAD: { hrFactor: 0.97, lat: 34.0739, lon: -118.2400 },
  SD: { hrFactor: 0.91, lat: 32.7076, lon: -117.1570 },
  SF: { hrFactor: 0.85, lat: 37.7786, lon: -122.3893 },
};
