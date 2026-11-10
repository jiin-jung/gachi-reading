// 로컬 확인용 서버 (vercel 로그인 없이 `npm start`로 실행)
// Vercel에 올릴 때는 이 파일을 쓰지 않습니다.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import books from './api/books.js';
import cover from './api/cover.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env 읽기 (dotenv 없이)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.replace(/\r$/, '').match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

// Vercel 함수의 res.status().json() 모양을 흉내 내는 작은 어댑터
function wrap(res) {
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (o) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)); };
  return res;
}

const PORT = Number(process.env.PORT || 3000);
http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  req.query = Object.fromEntries(u.searchParams);
  if (u.pathname === '/api/books') return books(req, wrap(res));
  if (u.pathname === '/api/cover') return cover(req, wrap(res));
  if (u.pathname === '/' || u.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
  }
  res.writeHead(404).end('not found');
}).listen(PORT, () => {
  console.log(`가치 읽기 로컬 서버: http://localhost:${PORT}`);
  console.log(`키 확인: 국중도 ${process.env.NL_API_KEY ? '있음' : '없음'} / 카카오 ${process.env.KAKAO_REST_KEY ? '있음' : '없음'}`);
});
