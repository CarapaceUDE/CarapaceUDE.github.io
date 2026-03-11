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
  docuseal_template_id TEXT,
  docuseal_submission_id TEXT,
  signing_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  skipped_at TEXT,
  completed_at TEXT,
  signed_document_url TEXT,
  raw_payload_json TEXT,
  FOREIGN KEY (intake_submission_id) REFERENCES intake_submissions(id)
);

CREATE INDEX IF NOT EXISTS idx_loi_requests_intake_submission_id
  ON loi_requests(intake_submission_id);

CREATE INDEX IF NOT EXISTS idx_loi_requests_status
  ON loi_requests(status);
