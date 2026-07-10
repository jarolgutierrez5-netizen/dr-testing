// Shared config constants used by the mock generators and projection models below.
// Grouped here (not in /data) because these aren't sourced facts -- they're tuning
// knobs and category lists that the model/generator functions consume.

export const PITCH_TYPES = ["Fastball", "Slider", "Curveball", "Changeup"];

// Realistic velocity bands per pitch type (mph), used as the base before per-pitcher
// jitter -- keeps a "Fastball" from ever mock-generating at curveball speed.
export const PITCH_VELO_BASE = { Fastball: 95, Slider: 85.5, Curveball: 79, Changeup: 86.5 };

export const ZONE_ROWS = ["Up", "Middle", "Down"];
export const ZONE_COLS = ["In", "Middle", "Away"];

export const LINEUP_POSITIONS = ["CF","2B","1B","DH","3B","RF","C","SS","LF"];
export const MOCK_SURNAMES = ["Castillo","Reyes","Delgado","Marsh","Ortega","Bramlett","Ashworth","Colbourne","Feathers","Ibarra","Whitfield","Sandoval","Halloran","Instanza","Deshields","Puckett","Camacho","Ferro","Boateng","Draper","Okonkwo"];

export const LEAGUE_AVG_K_PCT = 22.5;
export const LEAGUE_AVG_SB_PER_G = 0.55;
export const LEAGUE_AVG_HR9 = 1.2; // MLB starters roughly average ~1.1-1.3 HR allowed per 9 IP

// Strikeout projection engine
export const BF_PER_9 = 38.7; // MLB-average batters faced per 9 IP
export const START_IP_ASSUMPTION = 6;
export const K_CUSHION_TARGET = 1.5;

// Game projection engine
export const LEAGUE_AVG_ERA = 4.00;
export const HOME_FIELD_EDGE = 0.02;   // MLB home teams win ~54% in a neutral matchup
export const PITCHER_WEIGHT = 0.3;     // how much starter quality shifts a team's effective win%
export const RECENT_FORM_WEIGHT = 0.006; // run-differential points -> win% nudge
export const RECENT_FORM_CAP = 0.05;   // max swing recent form can contribute either way
export const BULLPEN_WEIGHT = 0.12;    // smaller than starter weight -- one piece, not the whole picture
export const LEAGUE_AVG_RELIEF_ERA = 3.90;

// Monte Carlo game simulation
export const SIM_ITERATIONS = 1000;

// Games lock this many minutes before first pitch -- once locked, the projection
// freezes and the card shows a lock state instead of an editable read.
export const LOCK_WINDOW_MINUTES = 15;
