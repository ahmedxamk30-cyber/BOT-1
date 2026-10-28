import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import db from '../config/database.js';
import CommandModel from '../models/command.js';
import logger from '../utils/logger.js';

const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

export const connectWhatsApp = async () => {
  const sessionId = process.env.SESSION_ID || 'dark_bot_session';
  const { state, saveCreds } = await useMultiFileAuthState(`sessions/${sessionId}`);

  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: [process.env.WA_NAME || 'DARK WA BOT PRO', 'Chrome', '7.0.1'],
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.info(`Connection closed. Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) {
        setTimeout(() => connectWhatsApp().catch((error) => logger.error(error)), 3000);
      } else {
        logger.warn('WhatsApp session logged out. Remove/re-link the session to connect again.');
      }
    } else if (connection === 'open') {
      logger.info('Connected to WhatsApp!');
      CommandModel.getAll().forEach((cmd) => logger.info(`Loaded command: ${cmd.name}`));
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const remoteJid = msg.key.remoteJid;
      if (!remoteJid) continue;

      const messageContent = msg.message;
      const text = messageContent.conversation
        || messageContent.extendedTextMessage?.text
        || messageContent.imageMessage?.caption
        || messageContent.videoMessage?.caption;
      if (!text) continue;

      if (text.startsWith(process.env.WA_PREFIX || '.')) {
        const prefix = process.env.WA_PREFIX || '.';
        const commandName = text.slice(prefix.length).trim().split(/\s+/)[0]?.toLowerCase();
        if (commandName) await handleCommand(sock, msg, commandName, text);
      }
    }
  });

  return sock;
};

export const handleCommand = async (sock, msg, cmdName, fullText) => {
  const command = CommandModel.get(cmdName);
  if (!command) return;

  try {
    const jid = msg.key.remoteJid;
    const senderJid = msg.key.participant || jid;
    const senderNumber = digitsOnly(senderJid.split('@')[0]);
    const ownerNumber = digitsOnly(process.env.OWNER_NUMBER || '');

    if (command.author === 'owner' && senderNumber !== ownerNumber) {
      await sock.sendMessage(jid, { text: '❌ هذا الأمر خاص بالمالك.' });
      return;
    }

    const startTime = Date.now();
    const result = await executeCommand(command.code, fullText);
    const duration = Date.now() - startTime;

    await sock.sendMessage(jid, {
      text: String(result || `✅ تم تنفيذ الأمر ${cmdName} في ${duration}ms`)
    });

    db.prepare('INSERT INTO logs (phone, command, timestamp) VALUES (?, ?, ?)')
      .run(senderNumber, cmdName, Date.now());
  } catch (error) {
    logger.error({ err: error, command: cmdName }, 'Command execution failed');
    await sock.sendMessage(msg.key.remoteJid, {
      text: '❌ حدث خطأ أثناء تنفيذ الأمر. راجع سجلات الخادم.'
    });
  }
};

// Kept compatible with the original custom-command format.
// WARNING: This evaluates administrator-supplied JavaScript and must never be exposed
// through an unauthenticated dashboard or to untrusted users.
async function executeCommand(code, input) {
  const cmdFunction = new Function('sock', 'msg', 'text', 'db', code);
  const mockSock = { sendMessage: async () => undefined };
  const mockMsg = { key: { remoteJid: 'mock@us' } };
  return await cmdFunction(mockSock, mockMsg, input, db);
}
