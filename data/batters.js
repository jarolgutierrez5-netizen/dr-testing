// Mock batter pool for the HR model, scoped to the 4-9 spots in the batting order --
// cleanup and complementary bats, not leadoff/table-setter stars. recentGames = last
// 5 games (ab, hr). seasonHr/seasonGames = full-season HR total and games played so far.
export const BATTERS = [
  {
    name: "Rafael Devers", team: "SF", pos: "3B", battingOrder: 4, seasonHr: 30, seasonGames: 96,
    recentGames: [{ ab: 4, hr: 1 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }],
  },
  {
    name: "William Contreras", team: "MIL", pos: "C", battingOrder: 5, seasonHr: 26, seasonGames: 94,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }],
  },
  {
    name: "Anthony Santander", team: "TOR", pos: "DH", battingOrder: 5, seasonHr: 22, seasonGames: 90,
    recentGames: [{ ab: 4, hr: 1 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }],
  },
  {
    name: "Christian Walker", team: "HOU", pos: "1B", battingOrder: 6, seasonHr: 18, seasonGames: 93,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }],
  },
  {
    name: "Alec Bohm", team: "PHI", pos: "3B", battingOrder: 7, seasonHr: 9, seasonGames: 92,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }],
  },
  {
    name: "Gabriel Moreno", team: "ARI", pos: "C", battingOrder: 8, seasonHr: 5, seasonGames: 88,
    recentGames: [{ ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }],
  },
  {
    name: "Nico Hoerner", team: "CHC", pos: "2B", battingOrder: 9, seasonHr: 3, seasonGames: 97,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }],
  },
  {
    name: "Jonathan Aranda", team: "TB", pos: "1B", battingOrder: 9, seasonHr: undefined, seasonGames: 0,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }],
  },
];
