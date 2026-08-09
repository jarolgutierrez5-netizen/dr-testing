// Mock batter pool for the HR model, scoped to the 4-9 spots in the batting order --
// cleanup and complementary bats, not leadoff/table-setter stars.
//
// recentGames = last 5 games (pa, hr). seasonHr/seasonPa = full-season HR total and
// plate appearances so far. matchupFactor/parkWeatherFactor = today's opposing
// pitcher/bullpen and park/weather HR-rate multipliers (1 = neutral).
export const BATTERS = [
  {
    name: "Rafael Devers", team: "SF", pos: "3B", battingOrder: 4,
    seasonHr: 30, seasonPa: 410, matchupFactor: 1.05, parkWeatherFactor: 1.10,
    recentGames: [{ pa: 4, hr: 1 }, { pa: 4, hr: 0 }, { pa: 4, hr: 0 }, { pa: 5, hr: 0 }, { pa: 4, hr: 0 }],
  },
  {
    name: "Anthony Santander", team: "TOR", pos: "DH", battingOrder: 5,
    seasonHr: 22, seasonPa: 375, matchupFactor: 1.0, parkWeatherFactor: 1.0,
    recentGames: [{ pa: 4, hr: 1 }, { pa: 4, hr: 0 }, { pa: 5, hr: 0 }, { pa: 4, hr: 0 }, { pa: 4, hr: 0 }],
  },
  {
    name: "William Contreras", team: "MIL", pos: "C", battingOrder: 5,
    seasonHr: 26, seasonPa: 395, matchupFactor: 1.15, parkWeatherFactor: 1.05,
    recentGames: [{ pa: 4, hr: 0 }, { pa: 4, hr: 0 }, { pa: 4, hr: 0 }, { pa: 3, hr: 0 }, { pa: 4, hr: 0 }],
  },
  {
    name: "Christian Walker", team: "HOU", pos: "1B", battingOrder: 6,
    seasonHr: 18, seasonPa: 385, matchupFactor: 0.90, parkWeatherFactor: 0.95,
    recentGames: [{ pa: 4, hr: 0 }, { pa: 3, hr: 0 }, { pa: 4, hr: 0 }, { pa: 4, hr: 0 }, { pa: 3, hr: 0 }],
  },
  {
    name: "Alec Bohm", team: "PHI", pos: "3B", battingOrder: 7,
    seasonHr: 9, seasonPa: 375, matchupFactor: 1.0, parkWeatherFactor: 1.0,
    recentGames: [{ pa: 4, hr: 0 }, { pa: 4, hr: 0 }, { pa: 3, hr: 0 }, { pa: 4, hr: 0 }, { pa: 4, hr: 0 }],
  },
  {
    name: "Gabriel Moreno", team: "ARI", pos: "C", battingOrder: 8,
    seasonHr: 5, seasonPa: 340, matchupFactor: 0.85, parkWeatherFactor: 0.90,
    recentGames: [{ pa: 3, hr: 0 }, { pa: 4, hr: 0 }, { pa: 3, hr: 0 }, { pa: 4, hr: 0 }, { pa: 3, hr: 0 }],
  },
  {
    name: "Nico Hoerner", team: "CHC", pos: "2B", battingOrder: 9,
    seasonHr: 3, seasonPa: 400, matchupFactor: 1.0, parkWeatherFactor: 1.0,
    recentGames: [{ pa: 4, hr: 0 }, { pa: 4, hr: 0 }, { pa: 3, hr: 0 }, { pa: 4, hr: 0 }, { pa: 4, hr: 0 }],
  },
  {
    name: "Jonathan Aranda", team: "TB", pos: "1B", battingOrder: 9,
    seasonHr: undefined, seasonPa: 0, matchupFactor: 1.0, parkWeatherFactor: 1.0,
    recentGames: [{ pa: 4, hr: 0 }, { pa: 4, hr: 0 }, { pa: 3, hr: 0 }, { pa: 4, hr: 0 }, { pa: 4, hr: 0 }],
  },
];
