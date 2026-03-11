-- Clawtainer Database Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  case_number TEXT,
  court TEXT,
  case_type TEXT CHECK(case_type IN ('divorce','custody','maintenance','domestic_violence','guardianship','other')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active','closed','appeal','archived')),
  petitioner TEXT,
  respondent TEXT,
  lawyer_role TEXT CHECK(lawyer_role IN ('petitioner','respondent')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  doc_type TEXT CHECK(doc_type IN ('petition','application','affidavit','fir','court_notice','order','counter','reply','evidence','other')),
  ocr_text TEXT,
  ai_summary TEXT,
  ai_analysis TEXT,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_date TEXT NOT NULL,
  event_type TEXT CHECK(event_type IN ('filing','hearing','order','submission','notice','other')),
  title TEXT NOT NULL,
  description TEXT,
  document_id TEXT REFERENCES documents(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_timeline_case ON timeline_events(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_case ON messages(case_id);
