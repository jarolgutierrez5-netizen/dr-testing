// Real season batting lines, pulled from live web searches (Baseball-Reference,
// FantasyData, Yahoo Sports/RotoWire, early July 2026). Each field is only included
// where a source actually confirmed it -- a missing year or stat means "not confirmed,"
// never a guessed zero. SEASON_HR kept as a flat lookup since most of the app only
// needs the current-year HR count.
export const SEASON_STATS = {
  "Shohei Ohtani": { 2026: { avg: 0.294, h: 94, hr: 20 }, 2025: { hr: 55 } },
  "Freddie Freeman": { 2026: { avg: 0.296, h: 102, hr: 15 }, 2025: { avg: 0.295, hr: 24, rbi: 90, r: 81 } },
  "Kyle Tucker": { 2026: { avg: 0.248, h: 78, hr: 7 } },
  "Max Muncy": { 2026: { avg: 0.264, h: 75, hr: 17 }, 2025: { avg: 0.243, hr: 19, rbi: 67, r: 48 } },
  "Yandy Díaz": { 2026: { hr: 8, rbi: 33, r: 27 } },
};

export const SEASON_HR = Object.fromEntries(
  Object.entries(SEASON_STATS).filter(([,y]) => y[2026]?.hr !== undefined).map(([name,y]) => [name, y[2026].hr])
);
