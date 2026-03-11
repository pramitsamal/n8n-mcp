import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'clawtainer.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database): void {
  const schemaPath = path.join(__dirname, '..', '..', 'src', 'database', 'schema.sql');
  // Try source first, then dist
  let schema: string;
  if (fs.existsSync(schemaPath)) {
    schema = fs.readFileSync(schemaPath, 'utf-8');
  } else {
    // Inline fallback schema
    schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  }
  database.exec(schema);
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
