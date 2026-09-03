// Ordered schema migrations, applied via `PRAGMA user_version` (see client.ts).
// To evolve the schema: append a new SQL string to this array. Never edit an
// already-shipped entry — a running app may already be at that version.
//
// Design notes for future migrations:
// - `sessions.raw_json` holds the full session payload (as sent by the
//   client), so any field not yet promoted to its own column is still
//   queryable/recoverable without a migration.
// - `session_metrics` is a generic (session_id, metric_key, metric_value)
//   table for future numeric signals that don't yet warrant a typed column.
export const MIGRATIONS: string[] = [
  // v1: core session record + normalized breakdowns for trend queries.
  `
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_category TEXT,
    duration_sec REAL NOT NULL,
    overall_score REAL NOT NULL,
    overall_band TEXT NOT NULL,
    pace_wpm REAL,
    pace_band TEXT,
    filler_total_count INTEGER,
    filler_per_minute REAL,
    eye_contact_pct REAL,
    eye_contact_trend TEXT,
    raw_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

  CREATE TABLE IF NOT EXISTS pillar_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    pillar_name TEXT NOT NULL,
    score REAL NOT NULL,
    takeaway TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_pillar_scores_session ON pillar_scores(session_id);
  CREATE INDEX IF NOT EXISTS idx_pillar_scores_name ON pillar_scores(pillar_name);

  CREATE TABLE IF NOT EXISTS filler_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    count INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_filler_words_session ON filler_words(session_id);
  CREATE INDEX IF NOT EXISTS idx_filler_words_word ON filler_words(word);

  CREATE TABLE IF NOT EXISTS vocabulary_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    phrase TEXT NOT NULL,
    count INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_vocab_matches_session ON vocabulary_matches(session_id);

  CREATE TABLE IF NOT EXISTS session_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    metric_key TEXT NOT NULL,
    metric_value REAL,
    metric_text TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_session_metrics_session ON session_metrics(session_id);
  CREATE INDEX IF NOT EXISTS idx_session_metrics_key ON session_metrics(metric_key);
  `,
];
