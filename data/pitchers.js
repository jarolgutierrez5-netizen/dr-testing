// Pitcher last-start lines
// throws: real, well-established fact for each pitcher (McClanahan confirmed via live
// search as "LHP"; the others are stable public facts, not projections/stats, so the
// same low bar we use for bats-hand elsewhere applies here).
export const PITCHERS = [
  { name:"Justin Wrobleski", team:"LAD", pos:"SP", opp:"COL", game:"LAD vs COL", ip:7, k:9, bb:2, h:6, er:1, era:"1.29", pitches:94, throws:"L" },
  { name:"Roki Sasaki", team:"LAD", pos:"SP", opp:"COL", game:"LAD vs COL", ip:6, k:5, bb:1, h:4, er:3, era:"4.50", pitches:78, throws:"R" },
  { name:"Gerrit Cole", team:"NYY", pos:"SP", opp:"TB", game:"TB vs NYY", ip:6.1, k:6, bb:1, h:7, er:3, era:"4.26", pitches:97, throws:"R" },
  { name:"Shane McClanahan", team:"TB", pos:"SP", opp:"NYY", game:"TB vs NYY", ip:6.1, k:5, bb:0, h:4, er:0, era:"0.00", pitches:85, throws:"L" },
  { name:"Robert Gasser", team:"MIL", pos:"SP", opp:"STL", game:"MIL vs STL", ip:7.2, k:4, bb:1, h:4, er:2, era:"2.35", pitches:94, throws:"L" },
];

// Real 2026 season lines for these five pitchers, pulled from a live search
// (Baseball-Reference, CBS Sports, team beat coverage, early July 2026). Same honesty
// rule as everywhere else: a missing field means unconfirmed, never a guessed number.
export const PITCHER_SEASON_STATS = {
  "Justin Wrobleski": { era: 2.72 },
  "Roki Sasaki": { era: 5.40, whip: 1.400, w: 3, l: 5, ip: 75.0, k: 75 },
  "Gerrit Cole": { era: 4.01, whip: 1.20 },
  "Shane McClanahan": { era: 3.23, w: 6, l: 4 },
};
