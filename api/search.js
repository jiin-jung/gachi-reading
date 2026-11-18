import { searchBooks } from '../lib/library.js';

// 책 추천 전에 제목으로 실제 책을 찾아 고르게 함 (/api/search?q=제목)
export default async function handler(req, res) {
  const q = String((req.query && req.query.q) || '').trim().slice(0, 60);
  if (!q) return res.status(200).json({ books: [] });
  try {
    res.setHeader('Cache-Control', 's-maxage=86400');
    res.status(200).json({ books: await searchBooks(q) });
  } catch (e) {
    console.log('책 검색 실패:', e.message);
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: '책 검색이 잠시 안 돼요' });
  }
}
