# 가치 읽기 — 현황 페이지 프로토타입

「가치 읽기 : 메모 카드로 이어 읽는 교환독서」 제안의 2단계 확장안(현황 웹페이지)입니다.
국립중앙도서관 사서추천도서 Open API의 실제 데이터를 보여줍니다.

## 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 현황 페이지 (책 5권, 마우스를 올리면 말풍선) |
| `api/books.js` | Vercel 함수: 사서추천도서 + 예시 릴레이 정보 |
| `api/cover.js` | Vercel 함수: 표지 주소 (국중도 → 카카오 → 구글 북스) |
| `lib/library.js` | API 호출 로직 (키는 환경 변수에서만 읽음) |
| `data/state.js` | 예시 데이터: 책별 참여 인원·대출 상태 |
| `dev-server.js` | 로컬 확인용 서버 (`npm start`) |

## Vercel 배포

1. GitHub에 새 저장소를 만들어 이 폴더를 올립니다. `.env`는 `.gitignore`에 있어서 올라가지 않습니다.
2. vercel.com → Add New → Project → 저장소 Import
3. Framework Preset은 **Other**, 나머지는 기본값
4. **Environment Variables**에 `NL_API_KEY`(필수), `KAKAO_REST_KEY`(선택) 입력
5. Deploy

CLI로 올릴 때: `npm i -g vercel` → `vercel` → `vercel env add NL_API_KEY` → `vercel --prod`

## 로컬 확인

```bash
cp .env.example .env   # 키 입력
npm start              # http://localhost:3000
```

## 알아둘 점

- API 키는 Vercel 서버 쪽에만 있고 브라우저로 나가지 않습니다.
- `/api/books`는 10분, `/api/cover`는 하루 동안 Vercel CDN에 캐시돼서, 방문자가 많아도 국중도·카카오 API 호출이 크게 늘지 않습니다.
- 릴레이 완주 기준 10명은 책갈피 카드 메모 칸 수입니다 (`lib/library.js`의 `RELAY_MAX`).
- 참여 인원·대출 상태는 예시 데이터입니다. 실제 운영에서는 도서관 대출 시스템과 연동합니다.
- 공모전 제안용 프로토타입이며 학산도서관 공식 서비스가 아닙니다.
