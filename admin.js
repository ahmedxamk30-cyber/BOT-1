import CommandModel from '../models/command.js';
import { checkOwner } from '../middleware/permissions.js';

export const handleAdmin = async (sock, msg, fullText) => {
  const senderJid = msg.key.participant || msg.key.remoteJid;
  const sender = senderJid.split('@')[0].replace(/\D/g, '');
  if (!checkOwner(sender)) return;

  const args = fullText.trim().split(/\s+/).slice(1);
  const cmd = args[0]?.toLowerCase();

  switch (cmd) {
    case 'menu':
      await sock.sendMessage(msg.key.remoteJid, {
        text: `
*🟢 DARK WA BOT PRO*
------------------
*المالك:* ${process.env.OWNER_NUMBER || 'غير مضبوط'}
*الحالة:* ${sock.user ? 'متصل' : 'غير متصل'}
*الوقت:* ${new Date().toLocaleString('ar-EG')}

🔹 *القائمة:*
.menu
.ping
.help
.owner
.info
.runtime
.report
.settings
        `.trim()
      });
      break;
    case 'addcmd': {
      const name = args[1]?.toLowerCase();
      const description = args[2];
      const code = args.slice(3).join(' ');
      if (!name || !description || !code) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ الصيغة: .admin addcmd <name> <description> <code>'
        });
        return;
      }
      CommandModel.create(name, code, description, 'owner');
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ تم إضافة الأمر ${name}.` });
      break;
    }
    case 'backup':
      await sock.sendMessage(msg.key.remoteJid, {
        text: '⚠️ وظيفة النسخ الاحتياطي تحتاج إلى تفعيلها وربطها بالأمر.'
      });
      break;
    case 'logs':
      await sock.sendMessage(msg.key.remoteJid, { text: 'لا توجد واجهة إرسال سجلات مفعّلة حاليًا.' });
      break;
    default:
      await sock.sendMessage(msg.key.remoteJid, { text: 'أمر إدارة غير معروف. استخدم .admin menu' });
  }
};
