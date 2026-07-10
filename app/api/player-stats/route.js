import { NextResponse } from "next/server";
import { getOrFetch, cacheStatus } from "@/lib/cache";
import { TTL } from "@/lib/ttl";
import { playerStatsProvider } from "@/lib/providers";

const CACHE_KEY = "player-stats";

export async function GET() {
  const { data, cached, ageMs } = await getOrFetch(CACHE_KEY, TTL.playerStats, playerStatsProvider.fetchPlayerStats);
  return NextResponse.json(data, {
    headers: {
      "X-Cache": cached ? "HIT" : "MISS",
      "X-Cache-Age-Ms": String(ageMs),
      "X-Cache-Status": JSON.stringify(cacheStatus(CACHE_KEY)),
    },
  });
}
