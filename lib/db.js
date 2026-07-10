// ---- SQLite-backed key/value store (server-only) ----
// Replaces the artifact-platform-only `window.storage` API. Same shape (get/set a
// JSON blob by string key, scoped to "whoever's browser this is") but backed by a
// real file, keyed by an anonymous session id stored in an httpOnly cookie (see
// lib/session.js) instead of a platform-managed per-visitor identity.
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), ".db");
const DB_PATH = path.join(DB_DIR, "app.db");

function init() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv_store (
      session_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (session_id, key)
    );
  `);
  return db;
}

// Stored on globalThis so Next.js dev-mode hot-reloading reuses the same connection
// instead of re-opening the file on every edit.
const db = globalThis.__diamondLedgerDb || (globalThis.__diamondLedgerDb = init());

export function kvGet(sessionId, key) {
  const row = db.prepare("SELECT value FROM kv_store WHERE session_id = ? AND key = ?").get(sessionId, key);
  return row ? row.value : null;
}

export function kvSet(sessionId, key, value) {
  db.prepare(`
    INSERT INTO kv_store (session_id, key, value, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(session_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(sessionId, key, value, new Date().toISOString());
}
