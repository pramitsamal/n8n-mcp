import { v4 as uuid } from 'uuid';
import { getDb } from './db';

// ---- Types ----

export interface User {
  id: string;
  name: string;
  pin_hash: string;
  created_at: string;
}

export interface Case {
  id: string;
  user_id: string;
  title: string;
  case_number: string | null;
  court: string | null;
  case_type: string | null;
  status: string;
  petitioner: string | null;
  respondent: string | null;
  lawyer_role: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  filename: string;
  doc_type: string | null;
  ocr_text: string | null;
  ai_summary: string | null;
  ai_analysis: string | null;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  event_date: string;
  event_type: string | null;
  title: string;
  description: string | null;
  document_id: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  case_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ---- Users ----

export function createUser(name: string, pinHash: string): User {
  const id = uuid();
  getDb().prepare('INSERT INTO users (id, name, pin_hash) VALUES (?, ?, ?)').run(id, name, pinHash);
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
}

export function getUserByName(name: string): User | undefined {
  return getDb().prepare('SELECT * FROM users WHERE name = ?').get(name) as User | undefined;
}

export function getFirstUser(): User | undefined {
  return getDb().prepare('SELECT * FROM users LIMIT 1').get() as User | undefined;
}

export function updateUserPin(id: string, pinHash: string): void {
  getDb().prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(pinHash, id);
}

// ---- Cases ----

export function createCase(userId: string, data: Partial<Case>): Case {
  const id = uuid();
  getDb().prepare(`
    INSERT INTO cases (id, user_id, title, case_number, court, case_type, status, petitioner, respondent, lawyer_role, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, userId, data.title || 'Untitled Case',
    data.case_number || null, data.court || null, data.case_type || null,
    data.status || 'active', data.petitioner || null, data.respondent || null,
    data.lawyer_role || null, data.notes || null
  );
  return getDb().prepare('SELECT * FROM cases WHERE id = ?').get(id) as Case;
}

export function getCases(userId: string, search?: string): Case[] {
  if (search) {
    return getDb().prepare(
      'SELECT * FROM cases WHERE user_id = ? AND (title LIKE ? OR case_number LIKE ? OR petitioner LIKE ? OR respondent LIKE ?) ORDER BY updated_at DESC'
    ).all(userId, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`) as Case[];
  }
  return getDb().prepare('SELECT * FROM cases WHERE user_id = ? ORDER BY updated_at DESC').all(userId) as Case[];
}

export function getCaseById(id: string): Case | undefined {
  return getDb().prepare('SELECT * FROM cases WHERE id = ?').get(id) as Case | undefined;
}

export function updateCase(id: string, data: Partial<Case>): Case | undefined {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (['title', 'case_number', 'court', 'case_type', 'status', 'petitioner', 'respondent', 'lawyer_role', 'notes'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return getCaseById(id);
  fields.push("updated_at = datetime('now')");
  values.push(id);
  getDb().prepare(`UPDATE cases SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getCaseById(id);
}

export function deleteCase(id: string): void {
  getDb().prepare('DELETE FROM cases WHERE id = ?').run(id);
}

// ---- Documents ----

export function createDocument(caseId: string, data: Partial<Document>): Document {
  const id = uuid();
  getDb().prepare(`
    INSERT INTO documents (id, case_id, filename, doc_type, ocr_text, ai_summary, ai_analysis, file_path, file_size, mime_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, caseId, data.filename || 'document',
    data.doc_type || 'other', data.ocr_text || null, data.ai_summary || null,
    data.ai_analysis || null, data.file_path || '', data.file_size || null, data.mime_type || null
  );
  return getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id) as Document;
}

export function getDocuments(caseId: string): Document[] {
  return getDb().prepare('SELECT * FROM documents WHERE case_id = ? ORDER BY uploaded_at DESC').all(caseId) as Document[];
}

export function getDocumentById(id: string): Document | undefined {
  return getDb().prepare('SELECT * FROM documents WHERE id = ?').get(id) as Document | undefined;
}

export function updateDocument(id: string, data: Partial<Document>): void {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (['ocr_text', 'ai_summary', 'ai_analysis', 'doc_type'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  getDb().prepare(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteDocument(id: string): void {
  getDb().prepare('DELETE FROM documents WHERE id = ?').run(id);
}

// ---- Timeline Events ----

export function createTimelineEvent(caseId: string, data: Partial<TimelineEvent>): TimelineEvent {
  const id = uuid();
  getDb().prepare(`
    INSERT INTO timeline_events (id, case_id, event_date, event_type, title, description, document_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, caseId, data.event_date || new Date().toISOString().split('T')[0],
    data.event_type || 'other', data.title || 'Event', data.description || null,
    data.document_id || null
  );
  return getDb().prepare('SELECT * FROM timeline_events WHERE id = ?').get(id) as TimelineEvent;
}

export function getTimelineEvents(caseId: string): TimelineEvent[] {
  return getDb().prepare('SELECT * FROM timeline_events WHERE case_id = ? ORDER BY event_date ASC').all(caseId) as TimelineEvent[];
}

export function deleteTimelineEvent(id: string): void {
  getDb().prepare('DELETE FROM timeline_events WHERE id = ?').run(id);
}

// ---- Messages ----

export function createMessage(caseId: string, role: 'user' | 'assistant', content: string): Message {
  const id = uuid();
  getDb().prepare('INSERT INTO messages (id, case_id, role, content) VALUES (?, ?, ?, ?)').run(id, caseId, role, content);
  return getDb().prepare('SELECT * FROM messages WHERE id = ?').get(id) as Message;
}

export function getMessages(caseId: string, limit = 50): Message[] {
  return getDb().prepare('SELECT * FROM messages WHERE case_id = ? ORDER BY created_at ASC LIMIT ?').all(caseId, limit) as Message[];
}

// ---- Stats ----

export function getCaseStats(caseId: string): { documents: number; events: number; messages: number } {
  const docs = getDb().prepare('SELECT COUNT(*) as count FROM documents WHERE case_id = ?').get(caseId) as { count: number };
  const events = getDb().prepare('SELECT COUNT(*) as count FROM timeline_events WHERE case_id = ?').get(caseId) as { count: number };
  const msgs = getDb().prepare('SELECT COUNT(*) as count FROM messages WHERE case_id = ?').get(caseId) as { count: number };
  return { documents: docs.count, events: events.count, messages: msgs.count };
}
