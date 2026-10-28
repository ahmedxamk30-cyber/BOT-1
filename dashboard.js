import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from '../config/database.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.use(express.static(path.resolve(__dirname, '../../public')));

router.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../../public/index.html'));
});

router.get('/api/stats', (_req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const totalCommands = db.prepare('SELECT COUNT(*) AS count FROM commands').get().count;
  res.json({ totalUsers, totalCommands, status: 'online' });
});

router.get('/api/logs', (_req, res) => {
  const logs = db.prepare(
    'SELECT id, phone, command, timestamp FROM logs ORDER BY timestamp DESC LIMIT 100'
  ).all();
  res.json(logs);
});

export default router;
