import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kvGet, kvSet } from "@/lib/db";
import { getOrCreateSessionId, applySessionCookie } from "@/lib/session";

// Generic per-browser key/value storage, replacing window.storage.get/set. Every key
// used by the app (favorites, parlay_build, track_record_log) is personal data scoped
// to an anonymous session cookie -- there is no "shared" mode, unlike the artifact
// platform's window.storage(key, shared) signature, since this app never needed one.

export async function GET(request, { params }) {
  const { key } = await params;
  const cookieStore = await cookies();
  const { sessionId, isNew } = getOrCreateSessionId(cookieStore);

  const value = kvGet(sessionId, key);
  const response = NextResponse.json(value === null ? { value: null } : { value });
  return isNew ? applySessionCookie(response, sessionId) : response;
}

export async function PUT(request, { params }) {
  const { key } = await params;
  const cookieStore = await cookies();
  const { sessionId, isNew } = getOrCreateSessionId(cookieStore);

  const body = await request.json();
  kvSet(sessionId, key, body.value);

  const response = NextResponse.json({ ok: true });
  return isNew ? applySessionCookie(response, sessionId) : response;
}
