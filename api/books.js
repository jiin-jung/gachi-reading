import { booksWithRelay } from '../lib/library.js';

export default async function handler(req, res) {
  try {
    const data = await booksWithRelay();
    // Vercel CDN에 10분 캐시 → 방문자가 많아도 국중도 API 호출은 10분에 한 번 수준
    // 스냅샷으로 대신 보여줄 땐 1분만 캐시 → API가 살아나면 금방 실제 데이터로 돌아옴
    res.setHeader('Cache-Control', data.fallback ? 's-maxage=60' : 's-maxage=600, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (e) {
    console.log('books 오류:', e.message);
    res.status(502).json({ error: e.message });
  }
}
