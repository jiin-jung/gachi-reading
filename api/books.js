import { booksWithRelay } from '../lib/library.js';

export default async function handler(req, res) {
  try {
    const data = await booksWithRelay();
    // Vercel CDN에 10분 캐시 → 방문자가 많아도 국중도 API 호출은 10분에 한 번 수준
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (e) {
    console.log('books 오류:', e.message);
    res.status(502).json({ error: e.message });
  }
}
