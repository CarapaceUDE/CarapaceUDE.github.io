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

CREATE TABLE IF NOT EXISTS loi_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  intake_submission_id INTEGER NOT NULL,
  signer_name TEXT,
  signer_email TEXT,
  company TEXT,
  signer_title TEXT,
  intended_use TEXT,
  timeline TEXT,
  typed_signature TEXT,
  drawn_signature_data_url TEXT,
  consent_authorized INTEGER NOT NULL DEFAULT 0,
  consent_non_binding INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  skipped_at TEXT,
  completed_at TEXT,
  raw_payload_json TEXT,
  FOREIGN KEY (intake_submission_id) REFERENCES intake_submissions(id)
);

CREATE INDEX IF NOT EXISTS idx_loi_requests_intake_submission_id
  ON loi_requests(intake_submission_id);

CREATE INDEX IF NOT EXISTS idx_loi_requests_status
  ON loi_requests(status);
