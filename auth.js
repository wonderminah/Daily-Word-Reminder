require('dotenv').config();
const axios = require('axios');
const readline = require('readline');
const fs = require('fs');

const REST_API_KEY = process.env.KAKAO_REST_API_KEY;
const REDIRECT_URI = 'https://localhost';

const authUrl =
  `https://kauth.kakao.com/oauth/authorize` +
  `?client_id=${REST_API_KEY}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code`;

console.log('\n아래 URL을 브라우저에서 열어주세요:\n');
console.log(authUrl);
console.log('\n카카오 로그인 후 리다이렉트된 주소 전체를 붙여넣어 주세요:');
console.log('(https://localhost/?code=... 로 시작하는 주소)\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('> ', async (redirectedUrl) => {
  rl.close();
  try {
    const code = new URL(redirectedUrl.trim()).searchParams.get('code');
    if (!code) throw new Error('URL에서 code를 찾을 수 없습니다.');
    console.log('추출된 code:', code);

    const response = await axios.post(
      'https://kauth.kakao.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: REST_API_KEY,
        redirect_uri: REDIRECT_URI,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token } = response.data;

    let env = fs.readFileSync('.env', 'utf-8');
    env = env.replace(/^KAKAO_ACCESS_TOKEN=.*$/m, `KAKAO_ACCESS_TOKEN=${access_token}`);
    if (env.match(/^KAKAO_REFRESH_TOKEN=.*$/m)) {
      env = env.replace(/^KAKAO_REFRESH_TOKEN=.*$/m, `KAKAO_REFRESH_TOKEN=${refresh_token}`);
    } else {
      env += `\nKAKAO_REFRESH_TOKEN=${refresh_token}`;
    }
    fs.writeFileSync('.env', env);

    console.log('\n✅ 토큰 저장 완료! 이제 node index.js 로 실행하세요.');
  } catch (err) {
    console.error('❌ 오류:', err.response?.data || err.message);
  }
});
