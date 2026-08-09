// ---- Ballpark weather ----
// Open-Meteo (https://open-meteo.com) is a free, no-key weather API. Used as
// a small HR-probability nudge: warmer, gustier air carries fly balls
// slightly farther. This is a coarse heuristic, not a batted-ball physics
// model, and doesn't account for roof status at retractable-roof parks
// (weather still applies there even though the roof may be closed).
export async function getParkWeatherFactor(lat, lon, isoDate) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,wind_speed_10m&start_date=${isoDate}&end_date=${isoDate}&temperature_unit=fahrenheit&wind_speed_unit=mph`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return { factor: 1 };
    const data = await res.json();
    const temps = data.hourly?.temperature_2m || [];
    const winds = data.hourly?.wind_speed_10m || [];
    if (!temps.length) return { factor: 1 };

    const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
    const avgWind = winds.reduce((a, b) => a + b, 0) / (winds.length || 1);

    // ~+1% carry per 10F above a 70F baseline, capped at +/-6%.
    const tempAdj = 1 + Math.max(-0.06, Math.min(0.06, ((avgTemp - 70) / 10) * 0.01));
    // Wind is treated as a mild amplifier since Open-Meteo doesn't give us
    // wind direction relative to the field, capped at +4%.
    const windAdj = 1 + Math.max(0, Math.min(0.04, ((avgWind - 8) / 10) * 0.02));

    return { factor: tempAdj * windAdj, avgTemp, avgWind };
  } catch {
    return { factor: 1 };
  }
}
