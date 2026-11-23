import { checkHolding } from '../lib/library.js';

// 학산도서관 소장 확인 (/api/holding?isbn=...&title=...)
export default async function handler(req, res) {
  const isbn = String((req.query && req.query.isbn) || '').replace(/[^0-9Xx]/g, '');
  const title = String((req.query && req.query.title) || '').trim().slice(0, 80);
  if (!title) return res.status(400).json({ error: '제목이 필요해요' });
  try {
    res.setHeader('Cache-Control', 's-maxage=3600'); // 대출 상태가 바뀌니 1시간만
    res.status(200).json(await checkHolding(isbn, title));
  } catch (e) {
    console.log('소장 확인 실패:', e.message);
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ status: 'error', error: '도서관 검색이 잠시 안 돼요' });
  }
}
