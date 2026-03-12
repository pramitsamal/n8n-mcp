import * as fsSync from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'clawtainer.db');

interface Statement {
  run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: any[]): any;
  all(...params: any[]): any[];
}

interface DbWrapper {
  prepare(sql: string): Statement;
  exec(sql: string): void;
  pragma(key: string, value?: any): any;
  close(): void;
}

let db: DbWrapper | null = null;

/**
 * Initialize the database (must be called before getDb).
 * sql.js requires async WASM loading.
 */
export async function initDb(): Promise<void> {
  if (db) return;

  let initSqlJs;
  try {
    initSqlJs = require('sql.js');
  } catch (error) {
    throw new Error('sql.js module not found. Run: npm install sql.js');
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      if (file.endsWith('.wasm')) {
        const possiblePaths = [
          path.join(__dirname, '../../node_modules/sql.js/dist/', file),
          path.join(process.cwd(), 'node_modules/sql.js/dist/', file),
        ];
        try {
          possiblePaths.push(path.join(path.dirname(require.resolve('sql.js')), '../dist/', file));
        } catch { /* ignore */ }

        for (const tryPath of possiblePaths) {
          if (fsSync.existsSync(tryPath)) return tryPath;
        }

        try {
          return require.resolve('sql.js/dist/sql-wasm.wasm');
        } catch {
          return file;
        }
      }
      return file;
    }
  });

  fsSync.mkdirSync(DATA_DIR, { recursive: true });

  let sqlDb: any;
  try {
    const data = fsSync.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(new Uint8Array(data));
    console.log(`Loaded existing database from ${DB_PATH}`);
  } catch {
    sqlDb = new SQL.Database();
    console.log(`Created new database at ${DB_PATH}`);
  }

  // Enable foreign keys
  sqlDb.exec('PRAGMA foreign_keys = ON');

  db = createWrapper(sqlDb);
  initSchema(db);
}

function createWrapper(sqlDb: any): DbWrapper {
  function saveToDisk(): void {
    try {
      const data = sqlDb.export();
      fsSync.writeFileSync(DB_PATH, data);
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  return {
    prepare(sql: string): Statement {
      return {
        run(...params: any[]) {
          const stmt = sqlDb.prepare(sql);
          try {
            if (params.length > 0) {
              stmt.bind(params.map((p: any) => p === undefined ? null : p));
            }
            stmt.step();
            return { changes: 1, lastInsertRowid: 0 };
          } finally {
            stmt.free();
            saveToDisk();
          }
        },
        get(...params: any[]) {
          const stmt = sqlDb.prepare(sql);
          try {
            if (params.length > 0) {
              stmt.bind(params.map((p: any) => p === undefined ? null : p));
            }
            if (stmt.step()) {
              return stmt.getAsObject();
            }
            return undefined;
          } finally {
            stmt.free();
          }
        },
        all(...params: any[]) {
          const stmt = sqlDb.prepare(sql);
          try {
            if (params.length > 0) {
              stmt.bind(params.map((p: any) => p === undefined ? null : p));
            }
            const results: any[] = [];
            while (stmt.step()) {
              results.push(stmt.getAsObject());
            }
            return results;
          } finally {
            stmt.free();
          }
        }
      };
    },

    exec(sql: string): void {
      sqlDb.exec(sql);
      saveToDisk();
    },

    pragma(key: string, _value?: any): any {
      if (key === 'journal_mode = WAL' || key.startsWith('journal_mode')) {
        return 'memory'; // WAL not supported in sql.js
      }
      if (key === 'foreign_keys = ON' || key.startsWith('foreign_keys')) {
        sqlDb.exec('PRAGMA foreign_keys = ON');
        return;
      }
      return null;
    },

    close(): void {
      saveToDisk();
      sqlDb.close();
    }
  };
}

function initSchema(database: DbWrapper): void {
  const schemaPath = path.join(__dirname, '..', '..', 'src', 'database', 'schema.sql');
  let schema: string;
  if (fsSync.existsSync(schemaPath)) {
    schema = fsSync.readFileSync(schemaPath, 'utf-8');
  } else {
    schema = fsSync.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  }
  database.exec(schema);
}

export function getDb(): DbWrapper {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
