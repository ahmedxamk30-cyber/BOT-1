import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectWhatsApp } from './controllers/bot.js';
import dashboardRoutes from './routes/dashboard.js';
import db from './config/database.js';
import logger from './utils/logger.js';

const app = express();
const server = http.createServer(app);

const allowedOrigin = process.env.DASHBOARD_ORIGIN || `http://localhost:${process.env.PORT || 3000}`;
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST']
  }
});

app.disable('x-powered-by');
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '100kb' }));
app.use('/', dashboardRoutes);

io.on('connection', (socket) => {
  logger.info('Dashboard client connected');
  socket.on('disconnect', () => logger.info('Dashboard client disconnected'));
});

const ownerNumber = String(process.env.OWNER_NUMBER || '2012221635251').replace(/\D/g, '');
if (ownerNumber) {
  db.prepare(`
    INSERT OR IGNORE INTO users (phone, role, joined_at)
    VALUES (?, 'owner', ?)
  `).run(ownerNumber, Date.now());
}

const port = Number(process.env.PORT) || 3000;
const serverInstance = server.listen(port, async () => {
  logger.info(`DARK WA BOT PRO is running on port ${port}`);
  try {
    await connectWhatsApp();
  } catch (error) {
    logger.error({ err: error }, 'WhatsApp startup failed');
  }
});

const shutdown = (signal) => {
  logger.info(`${signal} received; shutting down`);
  serverInstance.close(() => {
    try { db.close(); } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
