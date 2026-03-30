// Telegram Bot Webhook — Vercel Serverless Function
// Обрабатывает входящие сообщения от студентов и уведомляет преподавателя

const BOT_TOKEN = process.env.BOT_TOKEN;
const TEACHER_CHAT_ID = process.env.TEACHER_CHAT_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE_URL = 'https://personalgermancoachmvc.vercel.app/tg-app';
const GIST_ID = 'ffe9c9ea4106c406d3b9256a84fbd611';

// Карта студентов: Telegram username/id → studentId в системе
// Заполняется по мере того как студенты пишут боту
const STUDENT_MAP = {
  // 'telegramUsername': 'artem'  — добавляй по мере регистрации
};

async function sendMessage(chatId, text, options = {}) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...options }),
  });
}

async function forwardMessage(fromChatId, messageId) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TEACHER_CHAT_ID, from_chat_id: fromChatId, message_id: messageId }),
  });
}

async function notifyTeacher(msg, studentName, label) {
  const text = `📬 <b>Neue Hausaufgabe</b>\n👤 ${studentName}\n📌 ${label}`;
  await sendMessage(TEACHER_CHAT_ID, text);
  await forwardMessage(msg.chat.id, msg.message_id);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });

  const update = req.body;
  const msg = update.message;
  if (!msg) return res.status(200).json({ ok: true });

  const chatId = msg.chat.id;
  const username = msg.from.username || '';
  const firstName = msg.from.first_name || '';
  const text = msg.text || '';

  // /start [studentId] — студент открывает бота
  if (text.startsWith('/start')) {
    const param = text.split(' ')[1]; // studentId из deep link
    if (param) {
      const link = `${BASE_URL}/?student=${param}`;
      await sendMessage(chatId,
        `👋 Willkommen, ${firstName}!\n\nIhr persönlicher Bereich:\n${link}\n\n` +
        `💡 Speichern Sie diesen Link als Lesezeichen.`
      );
    } else {
      await sendMessage(chatId,
        `👋 Hallo, ${firstName}!\n\nBitte warten Sie auf den persönlichen Link von Ihrer Lehrerin.`
      );
    }
    return res.status(200).json({ ok: true });
  }

  // /myid — преподаватель узнаёт свой chat_id для настройки
  if (text === '/myid') {
    await sendMessage(chatId, `Ihr Chat ID: <code>${chatId}</code>`);
    return res.status(200).json({ ok: true });
  }

  // /words olga слово1, слово2, слово3 — преподаватель добавляет слова урока
  if (text.startsWith('/words') && chatId.toString() === TEACHER_CHAT_ID.toString()) {
    const parts = text.replace('/words', '').trim().split(/\s+/);
    const studentId = parts[0]?.toLowerCase();
    const wordsRaw = parts.slice(1).join(' ');
    const words = wordsRaw.split(',').map(w => w.trim()).filter(Boolean);

    if (!studentId || words.length === 0) {
      await sendMessage(chatId,
        `⚠️ Формат: /words olga слово1, слово2, слово3\n\nПример:\n/words olga auf Anhieb, eingespannt sein, überwältigt sein`
      );
      return res.status(200).json({ ok: true });
    }

    // Читаем текущий Gist
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'german-coach-bot' }
    });
    const gistData = await gistRes.json();
    const current = JSON.parse(gistData.files['words.json'].content);

    // Добавляем новые слова с датой
    const today = new Date().toISOString().split('T')[0];
    if (!current[studentId]) current[studentId] = [];
    const entry = { date: today, words };
    current[studentId].unshift(entry); // новые сверху
    if (current[studentId].length > 10) current[studentId] = current[studentId].slice(0, 10);

    // Сохраняем в Gist
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'german-coach-bot'
      },
      body: JSON.stringify({ files: { 'words.json': { content: JSON.stringify(current, null, 2) } } })
    });

    await sendMessage(chatId,
      `✅ Слова для <b>${studentId}</b> сохранены:\n\n` +
      words.map(w => `• ${w}`).join('\n') +
      `\n\nОльга увидит их в кабинете.`
    );
    return res.status(200).json({ ok: true });
  }

  // Всё остальное — пересылаем преподавателю как входящая работа
  if (TEACHER_CHAT_ID && chatId.toString() !== TEACHER_CHAT_ID.toString()) {
    const studentName = firstName + (msg.from.last_name ? ' ' + msg.from.last_name : '');
    let label = 'Nachricht';
    if (msg.photo) label = 'Screenshot';
    else if (msg.voice || msg.audio) label = 'Sprachnachricht';
    else if (msg.document) label = 'Datei';
    else if (text) label = 'Text';

    await notifyTeacher(msg, studentName, label);
  }

  res.status(200).json({ ok: true });
}
