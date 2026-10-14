CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  business_role TEXT,
  goals TEXT,
  consent INTEGER NOT NULL CHECK(consent IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT
);
