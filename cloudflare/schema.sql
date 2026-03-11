CREATE TABLE IF NOT EXISTS intake_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  team_size TEXT,
  pain TEXT NOT NULL,
  deployment TEXT,
  timeline TEXT,
  notes TEXT,
  source_page TEXT
);

CREATE INDEX IF NOT EXISTS idx_intake_submissions_created_at
  ON intake_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intake_submissions_email
  ON intake_submissions(email);
