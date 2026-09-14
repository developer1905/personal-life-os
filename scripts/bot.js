const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8848935014:AAFADwBKAVsQAjIAAmbGLGGWNSAjf47jFcY';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://personal-life-os.onrender.com';

function telegramRequest(method, data = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString());
          resolve(body);
        } catch (e) {
          resolve({ ok: false, error: e.message });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// 1. Set the Menu Button in Telegram interface
async function initMenuButton() {
  const res = await telegramRequest('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Personal Life OS 🚀',
      web_app: {
        url: WEB_APP_URL,
      },
    },
  });
  console.log('setChatMenuButton result:', res);
}

// 2. Poll for updates and answer /start with inline button
let offset = 0;

async function poll() {
  try {
    const res = await telegramRequest('getUpdates', {
      offset: offset,
      timeout: 20,
    });

    if (res.ok && res.result && res.result.length > 0) {
      for (const update of res.result) {
        offset = update.update_id + 1;
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text;
          const firstName = update.message.from?.first_name || 'Do\'st';

          console.log(`Received message from ${chatId}: ${text}`);

          if (text.startsWith('/start')) {
            await telegramRequest('sendMessage', {
              chat_id: chatId,
              text: `🌟 **Assalomu alaykum, ${firstName}!**\n\nSizning shaxsiy boshqaruv markazingiz — **Personal Life OS 2.0** ga xush kelibsiz!\n\nQuyidagi tugma orqali ilovani to'liq ekranli Telegram Mini App sifatida ochishingiz mumkin:`,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🚀 Personal Life OS ni ochish',
                      web_app: { url: WEB_APP_URL },
                    },
                  ],
                ],
              },
            });
          } else {
            await telegramRequest('sendMessage', {
              chat_id: chatId,
              text: `Xush kelibsiz! Shaxsiy ko'p funksiyali boshqaruv markazini ishlatish uchun quyidagi tugmani bosing:`,
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🚀 Ilovani ochish (Life OS)',
                      web_app: { url: WEB_APP_URL },
                    },
                  ],
                ],
              },
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Polling error:', err.message);
  }

  setTimeout(poll, 1000);
}

async function main() {
  console.log('Starting Telegram Bot Listener for @mylifeblog_bot...');
  await initMenuButton();
  poll();
}

main();
