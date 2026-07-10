// ---- Sample slate: two matchups, last 2 games each (pulled live) ----
// Batter game logs: ab, h, d2 (doubles), hr, bb, rbi, r
// bats: real, sourced from Baseball Savant player pages where confirmed; null = unconfirmed.
export const PLAYER_LOGS = [
  { name:"Freddie Freeman", team:"LAD", pos:"1B", opp:"COL", game:"LAD vs COL", bats:"L", games:[{ab:5,h:2,rbi:0,r:0,bb:0,hr:0,d2:0},{ab:4,h:2,d2:1,r:1,rbi:0,bb:0,hr:0}] },
  { name:"Shohei Ohtani", team:"LAD", pos:"DH", opp:"COL", game:"LAD vs COL", bats:"L", games:[{ab:5,h:1,hr:1,rbi:1,bb:1,r:1,d2:0},{ab:4,h:0,rbi:0,r:0,bb:0,hr:0,d2:0}] },
  { name:"Kyle Tucker", team:"LAD", pos:"RF", opp:"COL", game:"LAD vs COL", bats:"L", games:[{ab:4,h:0,rbi:0,r:0,bb:0,hr:0,d2:0},{ab:3,h:1,rbi:2,r:0,bb:0,hr:0,d2:0}] },
  { name:"Max Muncy", team:"LAD", pos:"3B", opp:"COL", game:"LAD vs COL", bats:"L", games:[{ab:4,h:0,rbi:0,r:0,bb:0,hr:0,d2:0},{ab:4,h:1,bb:1,d2:1,r:0,rbi:0,hr:0}] },
  { name:"Tommy Edman", team:"LAD", pos:"2B", opp:"COL", game:"LAD vs COL", bats:"S", games:[{ab:4,h:1,r:1,rbi:0,bb:0,hr:0,d2:0},{ab:4,h:2,r:2,rbi:0,bb:0,hr:0,d2:0}] },
  { name:"Yandy Díaz", team:"TB", pos:"DH", opp:"NYY", game:"TB vs NYY", bats:"R", games:[{ab:4,h:2,hr:1,rbi:2,r:1,bb:0,d2:0},{ab:4,h:4,r:1,d2:1,rbi:0,bb:0,hr:0}] },
  { name:"Jonathan Aranda", team:"TB", pos:"1B", opp:"NYY", game:"TB vs NYY", bats:null, games:[{ab:4,h:2,rbi:3,d2:1,r:0,bb:0,hr:0},{ab:4,h:0,bb:1,r:0,rbi:0,hr:0,d2:0}] },
  { name:"Ben Rice", team:"NYY", pos:"1B", opp:"TB", game:"TB vs NYY", bats:null, games:[{ab:4,h:3,hr:1,rbi:3,r:1,bb:0,d2:0},{ab:4,h:1,rbi:0,r:0,bb:0,hr:0,d2:0}] },
  { name:"Jackson Chourio", team:"MIL", pos:"LF", opp:"STL", game:"MIL vs STL", bats:"R", games:[{ab:3,h:1,rbi:1,r:1,bb:0,hr:0,d2:0},{ab:4,h:0,rbi:0,r:0,bb:0,hr:0,d2:0}] },
  { name:"Christian Yelich", team:"MIL", pos:"DH", opp:"STL", game:"MIL vs STL", bats:"L", games:[{ab:5,h:0,rbi:1,r:0,bb:0,hr:0,d2:0},{ab:4,h:1,rbi:0,r:0,bb:1,hr:0,d2:0}] },
  { name:"Joey Ortiz", team:"MIL", pos:"SS", opp:"STL", game:"MIL vs STL", bats:"R", games:[{ab:5,h:2,hr:1,rbi:1,r:1,bb:0,d2:0},{ab:3,h:1,rbi:0,r:0,bb:0,hr:0,d2:1}] },
  { name:"Alec Burleson", team:"STL", pos:"1B", opp:"MIL", game:"MIL vs STL", bats:"L", games:[{ab:3,h:0,rbi:0,r:0,bb:0,hr:0,d2:0},{ab:4,h:2,hr:1,rbi:3,r:1,bb:0,d2:1}] },
  { name:"Jordan Walker", team:"STL", pos:"RF", opp:"MIL", game:"MIL vs STL", bats:"R", games:[{ab:4,h:2,rbi:0,r:1,bb:0,hr:0,d2:0},{ab:4,h:2,rbi:1,r:2,bb:0,hr:0,d2:1}] },
];

// Real injury/availability status, pulled from a live search (team injury reports,
// beat coverage, early July 2026). No entry = no report found, not "healthy" --
// same honesty convention as SEASON_HR.
export const INJURY_STATUS = {
  "Shohei Ohtani": { status: "Active", tone: "green", note: "Managing recurring left knee inflammation; in the lineup, playing regularly." },
  "Freddie Freeman": { status: "Active", tone: "green", note: "No current injury designation; named 2026 All-Star." },
  "Kyle Tucker": { status: "Active", tone: "green", note: "Played through low back spasms in late June; starting regularly as of early July." },
  "Max Muncy": { status: "Active", tone: "green", note: "No current injury designation; named 2026 All-Star." },
  "Tommy Edman": { status: "Day-to-Day", tone: "amber", note: "Hit by pitch on right foot/ankle; expected back in the starting lineup July 7." },
};
