// ---- Baseball Savant Statcast enrichment (best-effort) ----
// Baseball Savant has no documented, supported public API -- this hits its
// unofficial CSV leaderboard export, which the open-source baseball
// analytics community commonly uses, but Savant could change or block this
// at any time without notice. Every call is wrapped so a failure here
// degrades to "no Statcast enrichment" rather than breaking the page --
// season/recent HR rate from the official MLB Stats API is always the
// primary signal, this only nudges it when available.
async function fetchCsv(url) {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Savant ${res.status}`);
  const text = (await res.text()).trim();
  if (!text) return [];
  const [headerLine, ...lines] = text.split("\n");
  const headers = headerLine.split(",");
  return lines.filter(Boolean).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
  });
}

export async function getBatterStatcast(season) {
  try {
    const url = `https://baseballsavant.mlb.com/leaderboard/custom?year=${season}&type=batter&filter=&min=1&selections=barrel_batted_rate,exit_velocity_avg,hard_hit_percent&chart=false&csv=true`;
    const rows = await fetchCsv(url);
    const byId = {};
    for (const row of rows) {
      const id = Number(row.player_id);
      if (!id) continue;
      byId[id] = {
        barrelRate: parseFloat(row.barrel_batted_rate) || null,
        exitVelo: parseFloat(row.exit_velocity_avg) || null,
        hardHitRate: parseFloat(row.hard_hit_percent) || null,
      };
    }
    return byId;
  } catch {
    return null; // "Statcast enrichment unavailable" -- caller treats this as neutral
  }
}

export async function getPitcherStatcast(season) {
  try {
    const url = `https://baseballsavant.mlb.com/leaderboard/custom?year=${season}&type=pitcher&filter=&min=1&selections=barrel_batted_rate,hard_hit_percent&chart=false&csv=true`;
    const rows = await fetchCsv(url);
    const byId = {};
    for (const row of rows) {
      const id = Number(row.player_id);
      if (!id) continue;
      byId[id] = {
        barrelRateAllowed: parseFloat(row.barrel_batted_rate) || null,
        hardHitRateAllowed: parseFloat(row.hard_hit_percent) || null,
      };
    }
    return byId;
  } catch {
    return null;
  }
}
