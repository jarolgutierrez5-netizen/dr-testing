// Brief, stable park characteristics (qualitative, not precise numeric factors)
export const PARK_NOTES = {
  PIT:"PNC Park: riverside views, plays close to neutral.", TB:"Tropicana Field: domed, no weather factor.",
  NYM:"Citi Field: deep gaps, pitcher-friendly.", BAL:"Camden Yards: LF wall moved in '22, more pitcher-friendly since.",
  MIN:"Target Field: plays a touch large, fairly neutral.", CWS:"Rate Field: ball tends to carry, hitter-friendly.",
  MIA:"loanDepot Park: domed, deep fences, pitcher-friendly.", DET:"Comerica Park: spacious outfield, pitcher-friendly.",
  CIN:"Great American Ball Park: short porches, hitter-friendly.", STL:"Busch Stadium: neutral to pitcher-friendly.",
  TEX:"Globe Life Field: domed, close to neutral.", SD:"Petco Park: marine air, pitcher-friendly.",
  SF:"Oracle Park: wind and marine layer suppress HRs.", LAD:"Dodger Stadium: night marine layer can knock down fly balls.",
};

// Weather/park reinforcement for the matchups with player props -- mock conditions for now,
// swap in a live weather feed later. Ties directly to why a projection leans up or down.
export const WEATHER_CONTEXT = {
  "LAD vs COL": {
    temp:"71°F", wind:"6 mph in from LF", sky:"Marine layer rolling in",
    tag:"Suppresses fly balls", tone:"amber",
    note:"Cool night air and an onshore breeze at Dodger Stadium tend to knock down fly balls, a slight drag on power projections.",
  },
  "TB vs NYY": {
    temp:"72°F", wind:"Dome — no wind", sky:"Indoors, climate controlled",
    tag:"Neutral (dome)", tone:"slate",
    note:"Tropicana Field is domed, so there's no wind or temperature swing to factor in — conditions are the same every pitch.",
  },
  "MIL vs STL": {
    temp:"84°F", wind:"9 mph out to RF", sky:"Clear, humid evening",
    tag:"Slightly favors power", tone:"green",
    note:"Busch Stadium in warm, humid July air with a breeze blowing out gives fly balls a small extra carry — a mild boost to power projections.",
  },
};
