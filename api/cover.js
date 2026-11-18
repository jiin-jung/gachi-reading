import { fetchCover } from '../lib/library.js';

export default async function handler(req, res) {
  const isbn = String((req.query && req.query.isbn) || '').replace(/[^0-9Xx]/g, '');
  if (!isbn) return res.status(200).json({ url: '', source: '' });
  const result = await fetchCover(isbn);
  // 표지는 거의 안 바뀌니 하루 캐시. 실패·스냅샷 결과는 1분만 (빈 표지가 하루 내내 남지 않게)
  res.setHeader('Cache-Control', result.source && result.source !== 'snapshot' ? 's-maxage=86400, stale-while-revalidate=604800' : 's-maxage=60');
  res.status(200).json(result);
}
