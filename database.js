import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../dark_bot.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    phone TEXT PRIMARY KEY,
    username TEXT,
    role TEXT DEFAULT 'user',
    joined_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS groups (
    jid TEXT PRIMARY KEY,
    settings TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS commands (
    name TEXT PRIMARY KEY,
    code TEXT,
    description TEXT,
    author TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    command TEXT,
    timestamp INTEGER
  );
`);

export default db;
