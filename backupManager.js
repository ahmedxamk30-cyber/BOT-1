import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const backupDatabase = () => {
  const backupDir = path.resolve(__dirname, '../../backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

  // SQLite's backup API safely includes committed data and avoids copying an active WAL database.
  db.backup(backupPath);
  return backupPath;
};
