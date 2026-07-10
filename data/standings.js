// Full MLB standings (pulled live) -- powers records, win%, and pace
export const STANDINGS_RAW = [
{name:"Tampa Bay Rays",abbr:"TB",w:54,l:36},{name:"New York Yankees",abbr:"NYY",w:50,l:42},
{name:"Toronto Blue Jays",abbr:"TOR",w:44,l:49},{name:"Boston Red Sox",abbr:"BOS",w:42,l:48},
{name:"Baltimore Orioles",abbr:"BAL",w:42,l:51},{name:"Chicago White Sox",abbr:"CWS",w:47,l:44},
{name:"Cleveland Guardians",abbr:"CLE",w:47,l:46},{name:"Minnesota Twins",abbr:"MIN",w:46,l:47},
{name:"Detroit Tigers",abbr:"DET",w:42,l:50},{name:"Kansas City Royals",abbr:"KC",w:38,l:55},
{name:"Seattle Mariners",abbr:"SEA",w:47,l:46},{name:"Texas Rangers",abbr:"TEX",w:46,l:46},
{name:"Houston Astros",abbr:"HOU",w:46,l:49},{name:"Athletics",abbr:"ATH",w:41,l:51},
{name:"Los Angeles Angels",abbr:"LAA",w:37,l:56},{name:"Milwaukee Brewers",abbr:"MIL",w:58,l:34},
{name:"Chicago Cubs",abbr:"CHC",w:52,l:40},{name:"St. Louis Cardinals",abbr:"STL",w:48,l:43},
{name:"Pittsburgh Pirates",abbr:"PIT",w:47,l:46},{name:"Cincinnati Reds",abbr:"CIN",w:42,l:49},
{name:"Atlanta Braves",abbr:"ATL",w:53,l:38},{name:"Philadelphia Phillies",abbr:"PHI",w:51,l:42},
{name:"Miami Marlins",abbr:"MIA",w:51,l:42},{name:"Washington Nationals",abbr:"WSH",w:48,l:46},
{name:"New York Mets",abbr:"NYM",w:39,l:54},{name:"Los Angeles Dodgers",abbr:"LAD",w:61,l:33},
{name:"San Diego Padres",abbr:"SD",w:46,l:46},{name:"Arizona Diamondbacks",abbr:"AZ",w:45,l:47},
{name:"San Francisco Giants",abbr:"SF",w:38,l:54},{name:"Colorado Rockies",abbr:"COL",w:38,l:56},
];

export const TEAMS = Object.fromEntries(STANDINGS_RAW.map(t => {
  const gp = t.w + t.l, wp = t.w/gp;
  return [t.abbr, { ...t, gp, wp, pace: Math.round(wp*162) }];
}));

// Real team color schemes (public brand facts, not the trademarked marks themselves) --
// used for crest-style team badges instead of a generic circle-with-letters.
export const TEAM_COLORS = {
  TB:{primary:"#092C5C",secondary:"#8FBCE6"}, NYY:{primary:"#0C2340",secondary:"#C4CED3"},
  TOR:{primary:"#134A8E",secondary:"#1D2D5C"}, BOS:{primary:"#BD3039",secondary:"#0C2340"},
  BAL:{primary:"#DF4601",secondary:"#000000"}, CWS:{primary:"#27251F",secondary:"#C4CED4"},
  CLE:{primary:"#00385D",secondary:"#E31937"}, MIN:{primary:"#002B5C",secondary:"#D31145"},
  DET:{primary:"#0C2340",secondary:"#FA4616"}, KC:{primary:"#004687",secondary:"#BD9B60"},
  SEA:{primary:"#0C2C56",secondary:"#005C5C"}, TEX:{primary:"#003278",secondary:"#C0111F"},
  HOU:{primary:"#002D62",secondary:"#EB6E1F"}, ATH:{primary:"#003831",secondary:"#EFB21E"},
  LAA:{primary:"#BA0021",secondary:"#003263"}, MIL:{primary:"#0A2351",secondary:"#FFC52F"},
  CHC:{primary:"#0E3386",secondary:"#CC3433"}, STL:{primary:"#C41E3A",secondary:"#0C2340"},
  PIT:{primary:"#27251F",secondary:"#FDB827"}, CIN:{primary:"#C6011F",secondary:"#000000"},
  ATL:{primary:"#CE1141",secondary:"#13274F"}, PHI:{primary:"#E81828",secondary:"#002D72"},
  MIA:{primary:"#00A3E0",secondary:"#EF3340"}, WSH:{primary:"#AB0003",secondary:"#14225A"},
  NYM:{primary:"#002D72",secondary:"#FF5910"}, LAD:{primary:"#005A9C",secondary:"#EF3E42"},
  SD:{primary:"#2F241D",secondary:"#FFC425"}, AZ:{primary:"#A71930",secondary:"#E3D4AD"},
  SF:{primary:"#FD5A1E",secondary:"#27251F"}, COL:{primary:"#33006F",secondary:"#C4CED4"},
};
