// Anonymous per-browser session id, replacing the identity window.storage handled
// implicitly. No auth -- just a random id set in an httpOnly cookie the first time a
// storage route is hit, read back on every subsequent request from the same browser.
import { randomUUID } from "node:crypto";

const COOKIE_NAME = "dl_session";
const ONE_YEAR_S = 60 * 60 * 24 * 365;

// Reads the session id from the incoming request's cookies, or mints a new one.
// Returns { sessionId, isNew } -- callers that get isNew: true must set the cookie
// on their response via applySessionCookie.
export function getOrCreateSessionId(cookieStore) {
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) return { sessionId: existing, isNew: false };
  return { sessionId: randomUUID(), isNew: true };
}

export function applySessionCookie(response, sessionId) {
  response.cookies.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_S,
  });
  return response;
}
