require('dotenv').config();
const { google } = require('googleapis');
const axios = require('axios');

async function getRandomWord() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: 'C2:E',
  });

  const rows = (res.data.values || []).filter(row => row[0] || row[1] || row[2]);
  if (rows.length === 0) throw new Error('시트에 데이터가 없습니다.');

  const row = rows[Math.floor(Math.random() * rows.length)];
  return {
    korean: row[0] || '',
    japanese: row[1] || '',
    english: row[2] || '',
  };
}

async function sendTelegramMessage(word) {
  const text =
    `📚 ${new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', timeZone: 'Asia/Seoul' })}의 단어\n` +
    `🇰🇷 ${word.korean}\n` +
    `🇯🇵 ${word.japanese}\n` +
    `🇺🇸 ${word.english}`;

  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    { chat_id: process.env.TELEGRAM_CHAT_ID, text }
  );
}

(async () => {
  const word = await getRandomWord();
  await sendTelegramMessage(word);
  console.log(`전송 완료: ${word.korean} / ${word.japanese} / ${word.english}`);
})();
