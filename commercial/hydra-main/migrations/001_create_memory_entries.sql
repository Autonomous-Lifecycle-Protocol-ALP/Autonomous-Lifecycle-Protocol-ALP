CREATE TABLE IF NOT EXISTS memory_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  importance TEXT NOT NULL CHECK (importance IN ('low', 'medium', 'high', 'critical')),
  scope TEXT,
  source TEXT,
  ttl INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tokens_estimate INTEGER
);

CREATE INDEX IF NOT EXISTS idx_memory_entries_type ON memory_entries(type);
CREATE INDEX IF NOT EXISTS idx_memory_entries_scope ON memory_entries(scope);
CREATE INDEX IF NOT EXISTS idx_memory_entries_updated_at ON memory_entries(updated_at DESC);
