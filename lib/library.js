// 국립중앙도서관 사서추천도서 + 표지 조회 (Vercel 함수와 로컬 서버가 같이 씀)
// 키는 환경 변수에서만 읽고, 브라우저로는 결과만 보냅니다.
import state from '../data/state.js';

// 릴레이 완주 기준 인원: 책갈피 카드 한 장(앞뒤)의 메모 칸 수
export const RELAY_MAX = 10;

const env = (k, d) => process.env[k] || d;

function pick(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
  return m ? m[1].trim() : '';
}
function today() {
  // 한국 시간 기준 날짜(YYYYMMDD)
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

// 같은 함수 인스턴스가 살아 있는 동안 10분 재사용 (API 호출 수 절약)
let bookCache = null;
export async function fetchRecommended() {
  const KEY = env('NL_API_KEY');
  if (!KEY) throw new Error('환경 변수 NL_API_KEY가 없습니다.');
  if (bookCache && Date.now() - bookCache.at < 10 * 60 * 1000) return bookCache.books;
  const count = env('BOOK_COUNT', '5'); // 기획안: 동시에 5권 운영
  const url = new URL('https://nl.go.kr/NL/search/openApi/saseoApi.do');
  url.search = new URLSearchParams({
    key: KEY, startRowNumApi: '1', endRowNumApi: count,
    start_date: env('START_DATE', '20250101'), end_date: today(),
  }).toString();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`사서추천도서 API 응답 ${res.status}`);
  const xml = await res.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  if (!items.length) throw new Error('사서추천도서 API가 빈 결과를 줬습니다: ' + xml.slice(0, 200));
  const books = items.map((it) => ({
    isbn: pick(it, 'recomisbn').split(',')[0].replace(/[^0-9Xx]/g, ''), // ISBN 2개면 첫 번째
    title: pick(it, 'recomtitle').split(' : ')[0],                       // 부제 생략
    author: pick(it, 'recomauthor').split(';')[0].replace(/^지은이\s*:\s*/, '').replace(/\s*(지음|저|글)\s*$/, '').trim(),
    publisher: pick(it, 'recompublisher'),
    field: pick(it, 'drCodeName') || '기타',                             // 분야 빈 책 있음
  }));
  bookCache = { at: Date.now(), books };
  return books;
}

export async function booksWithRelay() {
  const books = await fetchRecommended();
  const now = books.map((b) => {
    const r = state.relay[b.isbn] || { readers: 0, due: null };
    return { ...b, readers: Math.min(r.readers, RELAY_MAX), due: r.due, queue: r.queue || 0 };
  });
  return { relayMax: RELAY_MAX, now, done: state.done };
}

// ---- 표지: 국중도 서지정보 → 카카오(KAKAO_REST_KEY 있을 때) → 구글 북스 ----
async function coverFromNl(isbn) {
  const url = new URL('https://www.nl.go.kr/seoji/SearchApi.do');
  url.search = new URLSearchParams({ cert_key: env('NL_API_KEY'), result_style: 'json', page_no: '1', page_size: '1', isbn }).toString();
  const json = await (await fetch(url)).json();
  return (json.docs && json.docs[0] && json.docs[0].TITLE_URL) || '';
}
async function coverFromKakao(isbn) {
  const key = env('KAKAO_REST_KEY');
  if (!key) return '';
  const res = await fetch('https://dapi.kakao.com/v3/search/book?target=isbn&query=' + isbn, { headers: { Authorization: 'KakaoAK ' + key } });
  const json = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${json.errorType || ''} ${json.message || ''}`.trim());
  const thumb = (json.documents && json.documents[0] && json.documents[0].thumbnail) || '';
  // 썸네일 안의 원본 주소(fname)가 있으면 더 큰 이미지 사용. https 페이지라 http는 https로 바꿈
  const m = thumb.match(/[?&]fname=([^&]+)/);
  return (m ? decodeURIComponent(m[1]) : thumb).replace(/^http:/, 'https:');
}
async function coverFromGoogle(isbn) {
  const json = await (await fetch('https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn)).json();
  const links = json.items && json.items[0] && json.items[0].volumeInfo && json.items[0].volumeInfo.imageLinks;
  const url = links && (links.thumbnail || links.smallThumbnail);
  return url ? url.replace(/^http:/, 'https:').replace('&edge=curl', '') : '';
}

const coverCache = new Map();
export async function fetchCover(isbn) {
  if (coverCache.has(isbn)) return coverCache.get(isbn);
  let result = { url: '', source: '' };
  for (const [source, fn] of [['nl', coverFromNl], ['kakao', coverFromKakao], ['google', coverFromGoogle]]) {
    try {
      const url = await fn(isbn);
      if (url) { result = { url, source }; break; }
    } catch (e) { console.log(`표지 조회 실패(${source}, ${isbn}): ${e.message}`); }
  }
  coverCache.set(isbn, result);
  return result;
}
