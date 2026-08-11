(function () {
  const pools = {
    MLB: [
      { name: 'Aaron Judge', team: 'NYY', role: 'OF', form: 'Hot' },
      { name: 'Shohei Ohtani', team: 'LAD', role: 'DH', form: 'Trending' },
      { name: 'Tarik Skubal', team: 'DET', role: 'LHP', form: 'Strong' },
      { name: 'Bobby Witt Jr.', team: 'KC', role: 'SS', form: 'Steady' }
    ],
    NBA: [
      { name: 'Jayson Tatum', team: 'BOS', role: 'F', form: 'Trending' },
      { name: 'Nikola Jokić', team: 'DEN', role: 'C', form: 'Strong' },
      { name: 'Shai Gilgeous-Alexander', team: 'OKC', role: 'G', form: 'Hot' },
      { name: 'Luka Dončić', team: 'LAL', role: 'G', form: 'Steady' }
    ],
    WNBA: [
      { name: 'A’ja Wilson', team: 'LVA', role: 'F', form: 'Hot' },
      { name: 'Caitlin Clark', team: 'IND', role: 'G', form: 'Trending' },
      { name: 'Napheesa Collier', team: 'MIN', role: 'F', form: 'Strong' },
      { name: 'Breanna Stewart', team: 'NYL', role: 'F', form: 'Steady' }
    ],
    NFL: [
      { name: 'Josh Allen', team: 'BUF', role: 'QB', form: 'Strong' },
      { name: 'Lamar Jackson', team: 'BAL', role: 'QB', form: 'Trending' },
      { name: 'Justin Jefferson', team: 'MIN', role: 'WR', form: 'Hot' },
      { name: 'Micah Parsons', team: 'DAL', role: 'EDGE', form: 'Steady' }
    ]
  };

  const matchups = {
    MLB: [['NYY', 'LAD'], ['BOS', 'TOR'], ['NYM', 'ATL'], ['BAL', 'MIN']],
    NBA: [['BOS', 'NYK'], ['DEN', 'LAL'], ['OKC', 'MIN'], ['MIL', 'CLE']],
    WNBA: [['LVA', 'NYL'], ['IND', 'CHI'], ['MIN', 'PHX'], ['SEA', 'CON']],
    NFL: [['BUF', 'BAL'], ['KC', 'CIN'], ['SF', 'DAL'], ['PHI', 'GB']]
  };

  const mlbPitchers = [
    { name: 'Tarik Skubal', team: 'DET', role: 'LHP', form: 'Strong' },
    { name: 'Paul Skenes', team: 'PIT', role: 'RHP', form: 'Hot' },
    { name: 'Gerrit Cole', team: 'NYY', role: 'RHP', form: 'Trending' },
    { name: 'Zack Wheeler', team: 'PHI', role: 'RHP', form: 'Steady' }
  ];

  const teamOrEventPattern = /\bteam\b|\bgame\b|\binning\b|\bquarter\b|\bhalf\b|\bdrive\b|\bplay\b|overtime|first scor|race to|margin|spread|total combined|parlay/i;

  function projectionFor(sport, item, index) {
    const key = item.toLowerCase();
    const bump = index * 0.3;
    if (/home run/.test(key)) return `${(0.31 - index * 0.035).toFixed(2)} HR`;
    if (/strikeout/.test(key)) return sport === 'MLB' ? `${(7.6 - bump).toFixed(1)} K` : `${(1.2 + bump).toFixed(1)} sacks`;
    if (/hit/.test(key) && sport === 'MLB') return `${(1.7 - index * 0.1).toFixed(1)} hits`;
    if (/total base/.test(key)) return `${(2.4 - index * 0.15).toFixed(1)} bases`;
    if (/stolen/.test(key)) return `${Math.round(38 - index * 5)}%`;
    if (/rbi/.test(key)) return `${(1.1 - index * 0.08).toFixed(1)} RBI`;
    if (/rebound/.test(key)) return `${(11.8 - bump).toFixed(1)} REB`;
    if (/assist/.test(key)) return `${(9.6 - bump).toFixed(1)} AST`;
    if (/three|3-point|3pm/.test(key)) return `${(3.8 - index * 0.2).toFixed(1)} 3PM`;
    if (/block/.test(key)) return `${(2.1 - index * 0.15).toFixed(1)} BLK`;
    if (/steal/.test(key)) return `${(1.9 - index * 0.12).toFixed(1)} STL`;
    if (/turnover/.test(key)) return `${(2.7 + bump).toFixed(1)} TOV`;
    if (/point/.test(key)) return `${(31.5 - index * 1.4).toFixed(1)} PTS`;
    if (/passing/.test(key)) return `${Math.round(286 - index * 13)} YDS`;
    if (/rushing/.test(key)) return `${Math.round(91 - index * 8)} YDS`;
    if (/receiv|reception/.test(key)) return `${(6.8 - bump).toFixed(1)} REC`;
    if (/touchdown|td/.test(key)) return `${Math.round(64 - index * 6)}%`;
    if (/fantasy/.test(key)) return `${(24.8 - index * 1.3).toFixed(1)} FP`;
    if (teamOrEventPattern.test(key)) return sport === 'MLB' ? `${(8.6 + bump).toFixed(1)} runs` : `${Math.round(46 + index * 3)} total`;
    return `${Math.round(72 - index * 4)} rating`;
  }

  function detailFor(sport, group, item, entity, index) {
    if (/research/i.test(group)) return `${entity.role} profile · recent form, matchup and availability snapshot`;
    if (teamOrEventPattern.test(`${group} ${item}`)) return `Mock ${item.toLowerCase()} outlook · ${index % 2 ? 'pace rising' : 'stable inputs'}`;
    return `${entity.role} · ${entity.form} form · mock ${item.toLowerCase()} projection`;
  }

  function getPreview(sport, group, item) {
    const players = sport === 'MLB' && (/pitcher/i.test(group) || /starting pitcher|walks allowed|hits allowed|earned runs|outs recorded|pitch count/i.test(item))
      ? mlbPitchers
      : (pools[sport] || pools.MLB);
    const isEvent = teamOrEventPattern.test(`${group} ${item}`);
    const cards = players.map((player, index) => {
      const pair = (matchups[sport] || matchups.MLB)[index];
      const entity = isEvent
        ? { name: `${pair[0]} @ ${pair[1]}`, team: sport, role: group, form: index % 2 ? 'Moving' : 'Stable' }
        : player;
      return {
        name: entity.name,
        meta: isEvent ? `${sport} · ${group}` : `${entity.team} · ${entity.role}`,
        projection: projectionFor(sport, item, index),
        confidence: Math.max(54, 76 - index * 5),
        trend: index === 0 ? '+6.4%' : index === 1 ? '+3.1%' : index === 2 ? '-1.2%' : 'Stable',
        detail: detailFor(sport, group, item, entity, index)
      };
    });
    return { sport, group, item, entityType: isEvent ? 'matchups' : 'players', cards };
  }

  window.DiamondCategoryPreviewData = { getPreview };
})();
