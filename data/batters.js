// Mock batter pool for the HR model. recentGames = last 5 games (ab, hr).
// seasonHr/seasonGames = full-season HR total and games played so far.
export const BATTERS = [
  {
    name: "Aaron Judge", team: "NYY", pos: "RF", seasonHr: 34, seasonGames: 98,
    recentGames: [{ ab: 4, hr: 1 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }],
  },
  {
    name: "Shohei Ohtani", team: "LAD", pos: "DH", seasonHr: 31, seasonGames: 97,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 5, hr: 0 }],
  },
  {
    name: "Kyle Schwarber", team: "PHI", pos: "DH", seasonHr: 28, seasonGames: 96,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }],
  },
  {
    name: "Freddie Freeman", team: "LAD", pos: "1B", seasonHr: 14, seasonGames: 95,
    recentGames: [{ ab: 5, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }],
  },
  {
    name: "Luis Arraez", team: "SD", pos: "2B", seasonHr: 4, seasonGames: 94,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }],
  },
  {
    name: "Jonathan Aranda", team: "TB", pos: "1B", seasonHr: undefined, seasonGames: 0,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }],
  },
  {
    name: "Jackson Chourio", team: "MIL", pos: "LF", seasonHr: 19, seasonGames: 97,
    recentGames: [{ ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }],
  },
  {
    name: "Jordan Walker", team: "STL", pos: "RF", seasonHr: 8, seasonGames: 89,
    recentGames: [{ ab: 4, hr: 0 }, { ab: 4, hr: 0 }, { ab: 3, hr: 0 }, { ab: 4, hr: 0 }, { ab: 4, hr: 0 }],
  },
];
