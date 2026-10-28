export const handleAI = async (sock, msg, fullText) => {
  const aiKey = process.env.AI_API_KEY;
  if (!aiKey) {
    await sock.sendMessage(msg.key.remoteJid, {
      text: '❌ لم يتم إعداد AI_API_KEY في ملف .env.'
    });
    return;
  }

  const prefix = process.env.WA_PREFIX || '.';
  const prompt = fullText.replace(new RegExp(`^\\${prefix}ai\\s*`, 'i'), '').trim();
  if (!prompt) {
    await sock.sendMessage(msg.key.remoteJid, { text: '❌ اكتب سؤالك بعد الأمر .ai' });
    return;
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'grok-2-latest',
        messages: [
          { role: 'system', content: 'You are DARK AI. Reply clearly in the language used by the user.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`xAI API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    await sock.sendMessage(msg.key.remoteJid, { text: `🤖 DARK AI\n\n${content}` });
  } catch (error) {
    console.error('AI request failed:', error.message);
    await sock.sendMessage(msg.key.remoteJid, {
      text: '❌ تعذر الاتصال بالذكاء الاصطناعي. راجع المفتاح وسجلات الخادم.'
    });
  }
};
