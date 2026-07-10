// Probable starters, season stats -- MOCK DATA for now, swap in a real probable-pitcher
// feed + season splits later. `mock: true` is derived below (not hand-typed per entry) so
// the flag can never drift out of sync with reality the way the raw data will.
export const STARTERS_RAW = {
  ATL:{ name:"D. Vasquez", throws:"R", w:8, l:6, era:3.71, whip:1.19, ip:104.1, k:112, bb:34, k9:9.7, avg:".231" },
  PIT:{ name:"C. Reyes", throws:"L", w:6, l:9, era:4.35, whip:1.28, ip:98.0, k:88, bb:38, k9:8.1, avg:".249" },
  NYY:{ name:"M. Alvarado", throws:"R", w:10, l:5, era:3.28, whip:1.11, ip:112.2, k:121, bb:29, k9:9.7, avg:".221" },
  TB:{ name:"J. Okafor", throws:"L", w:9, l:7, era:3.55, whip:1.15, ip:106.0, k:104, bb:31, k9:8.8, avg:".234" },
  KC:{ name:"T. Whitfield", throws:"R", w:5, l:10, era:4.92, whip:1.41, ip:92.1, k:79, bb:44, k9:7.7, avg:".262" },
  NYM:{ name:"P. Sandoval Jr.", throws:"R", w:7, l:7, era:4.02, whip:1.24, ip:99.2, k:96, bb:36, k9:8.7, avg:".243" },
  CHC:{ name:"B. Halloran", throws:"L", w:11, l:4, era:2.98, whip:1.05, ip:114.0, k:127, bb:27, k9:10.0, avg:".212" },
  BAL:{ name:"R. Instanza", throws:"R", w:6, l:8, era:4.48, whip:1.32, ip:95.1, k:85, bb:40, k9:8.0, avg:".256" },
  CLE:{ name:"K. Marsh", throws:"R", w:8, l:6, era:3.61, whip:1.17, ip:101.0, k:99, bb:33, k9:8.8, avg:".238" },
  MIN:{ name:"A. Deshields", throws:"L", w:7, l:8, era:4.11, whip:1.26, ip:97.0, k:91, bb:37, k9:8.4, avg:".247" },
  BOS:{ name:"G. Puckett III", throws:"R", w:9, l:6, era:3.44, whip:1.13, ip:108.1, k:110, bb:30, k9:9.1, avg:".228" },
  CWS:{ name:"L. Camacho", throws:"R", w:4, l:11, era:5.15, whip:1.46, ip:88.0, k:74, bb:47, k9:7.6, avg:".268" },
  SEA:{ name:"N. Ferro", throws:"L", w:10, l:5, era:3.19, whip:1.09, ip:110.2, k:118, bb:28, k9:9.6, avg:".223" },
  MIA:{ name:"S. Boateng", throws:"R", w:6, l:9, era:4.27, whip:1.29, ip:94.0, k:87, bb:39, k9:8.3, avg:".251" },
  ATH:{ name:"W. Draper", throws:"R", w:5, l:9, era:4.83, whip:1.38, ip:90.1, k:81, bb:42, k9:8.1, avg:".259" },
  DET:{ name:"H. Okonkwo", throws:"L", w:9, l:6, era:3.52, whip:1.16, ip:105.0, k:103, bb:32, k9:8.8, avg:".235" },
  PHI:{ name:"F. Delgado Jr.", throws:"R", w:10, l:4, era:3.05, whip:1.08, ip:113.1, k:124, bb:26, k9:9.8, avg:".219" },
  CIN:{ name:"Q. Bramlett", throws:"R", w:6, l:8, era:4.41, whip:1.31, ip:93.2, k:86, bb:41, k9:8.3, avg:".254" },
  MIL:{ name:"O. Vantongeren", throws:"L", w:11, l:3, era:2.84, whip:1.02, ip:116.0, k:130, bb:25, k9:10.1, avg:".209" },
  STL:{ name:"E. Marchetti", throws:"R", w:7, l:7, era:3.88, whip:1.22, ip:100.1, k:97, bb:35, k9:8.7, avg:".241" },
  LAA:{ name:"T. Kaminski", throws:"R", w:4, l:10, era:5.02, whip:1.43, ip:87.0, k:76, bb:45, k9:7.9, avg:".263" },
  TEX:{ name:"R. Ashworth", throws:"L", w:8, l:6, era:3.66, whip:1.18, ip:102.2, k:100, bb:34, k9:8.8, avg:".239" },
  AZ:{ name:"D. Colbourne", throws:"R", w:7, l:6, era:3.79, whip:1.20, ip:99.0, k:95, bb:33, k9:8.6, avg:".242" },
  SD:{ name:"J. Feathers", throws:"R", w:9, l:5, era:3.11, whip:1.10, ip:107.2, k:112, bb:29, k9:9.4, avg:".226" },
  COL:{ name:"M. Strayhorn", throws:"R", w:3, l:12, era:5.61, whip:1.52, ip:84.1, k:70, bb:49, k9:7.5, avg:".274" },
  SF:{ name:"C. Ibarra", throws:"L", w:8, l:7, era:3.58, whip:1.17, ip:103.0, k:101, bb:32, k9:8.8, avg:".237" },
};

export const STARTERS = Object.fromEntries(
  Object.entries(STARTERS_RAW).map(([abbr, s]) => [abbr, { ...s, mock: true }])
);

// Expected lineup handedness (L/R/switch out of 9) -- MOCK DATA for now, swap in
// real projected-lineup feed later. Used to compute the platoon read on each starter.
export const LINEUP_HANDEDNESS = {
  ATL:{L:3,R:5,S:1}, PIT:{L:2,R:6,S:1}, NYY:{L:4,R:4,S:1}, TB:{L:3,R:5,S:1},
  KC:{L:2,R:6,S:1}, NYM:{L:3,R:5,S:1}, CHC:{L:4,R:4,S:1}, BAL:{L:3,R:6,S:0},
  CLE:{L:2,R:5,S:2}, MIN:{L:4,R:5,S:0}, BOS:{L:3,R:5,S:1}, CWS:{L:2,R:6,S:1},
  SEA:{L:3,R:5,S:1}, MIA:{L:2,R:6,S:1}, ATH:{L:3,R:5,S:1}, DET:{L:4,R:4,S:1},
  PHI:{L:3,R:5,S:1}, CIN:{L:2,R:6,S:1}, MIL:{L:3,R:5,S:1}, STL:{L:4,R:4,S:1},
  LAA:{L:2,R:6,S:1}, TEX:{L:3,R:5,S:1}, AZ:{L:3,R:5,S:1}, SD:{L:2,R:6,S:1},
  COL:{L:3,R:5,S:1}, SF:{L:4,R:4,S:1},
};

// Closers -- real where confirmed via live search, mock (fictional name, same
// convention as STARTERS_RAW) everywhere else. Closer roles are genuinely volatile in
// real bullpens (committees, blown saves, trades), so "mock" here isn't a cop-out --
// even the real teams change who's closing multiple times a season.
export const CLOSERS = {
  // Real, live search (Closer Monkey, Jul 8 2026): closer-by-committee situation,
  // Jordan Romano currently the primary option with his 6th save just recorded.
  COL: { name: "Jordan Romano", throws: "R", saves: 6, era: 3.98, blownSaves: 2, mock: false },
};
