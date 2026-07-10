import { NextResponse } from "next/server";
import { getOrFetch, cacheStatus } from "@/lib/cache";
import { TTL } from "@/lib/ttl";
import { standingsProvider } from "@/lib/providers";

const CACHE_KEY = "standings";

export async function GET() {
  const { data, cached, ageMs } = await getOrFetch(CACHE_KEY, TTL.standings, standingsProvider.fetchStandings);
  return NextResponse.json(data, {
    headers: {
      "X-Cache": cached ? "HIT" : "MISS",
      "X-Cache-Age-Ms": String(ageMs),
      "X-Cache-Status": JSON.stringify(cacheStatus(CACHE_KEY)),
    },
  });
}
