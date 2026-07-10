"use client";
import { useLiveResource } from "@/lib/hooks";
import { fetchLiveScoresClient } from "@/lib/apiFetchers";

// Visible proof the polling engine works end-to-end against the real backend: watch
// the dot and timestamp update on their own, calling our own /api/live-scores route
// (TTL-cached, currently backed by the stub provider -- see lib/providers/index.js).
// Backoff kicks in the same way it would against a flaky real upstream if that route
// starts erroring, and dedupe/pause-when-hidden behave exactly as before the split.
export function LiveHeartbeat() {
  const { data, loading, error, lastUpdated } = useLiveResource("heartbeat", fetchLiveScoresClient, { intervalMs: 8000 });
  const tone = error ? "bg-amber-400" : loading && !lastUpdated ? "bg-slate-500" : "bg-emerald-400";
  const label = error ? "Backing off after an error" : loading && !lastUpdated ? "Connecting" : "Live poll active";
  return (
    <span className="inline-flex items-center gap-1.5" title="Polls /api/live-scores (TTL-cached, stub provider) -- proves the dedupe/backoff/pause mechanism against the real backend">
      <span className={`w-1.5 h-1.5 rounded-full ${tone} ${!error ? "animate-pulse" : ""}`} />
      {label}{lastUpdated ? ` · ${new Date(lastUpdated).toLocaleTimeString([], { hour:"numeric", minute:"2-digit", second:"2-digit" })}` : ""}
    </span>
  );
}
