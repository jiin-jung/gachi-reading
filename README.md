# 가치 읽기 — 메모 카드로 이어 읽는 교환독서

인천대학교 학산도서관 서비스 아이디어 공모전 제안 「가치 읽기」의 현황 페이지 프로토타입입니다.
한 권의 책을 여러 학생이 차례로 빌려 읽으며, 책에 꽂힌 **책갈피 카드 10칸**에 한 줄 메모를 이어 남깁니다.
국립중앙도서관 사서추천도서 Open API의 실제 데이터를 보여줍니다.

**👉 https://gachi-reading.vercel.app**

![첫 화면: 지금 이어 읽는 책 5권과 말풍선](docs/screenshots/desktop-home.png)

## 주요 기능

### 지금 이어 읽는 책
사서추천도서 5권이 책장처럼 놓이고, 표지 아래에 참여 인원과 진행 막대가 보입니다. 2명 이하 남은 책은 **완주 임박**으로 표시됩니다.
PC에서는 책에 마우스를 올리면 말풍선으로 대출 상태와 신청 버튼이 나옵니다.

### 책갈피 카드 10칸
책을 누르면 상세 페이지에서 실제 책갈피 카드처럼 10칸이 채워진 모습과 최근 메모를 볼 수 있고, 바로 신청할 수 있습니다. 먼저 읽은 사람들의 후기도 볼 수 있고, 후기는 책에 꽂힌 **책갈피 카드의 QR**(`#book/<ISBN>/qr`, `#done/<id>/qr`)로 들어왔을 때만 쓸 수 있어서, 실물 책을 빌려 읽은 학생만 남길 수 있습니다. 완주한 책도 같습니다.

![상세 페이지: 책갈피 카드 10칸과 최근 메모](docs/screenshots/book-detail.png)

### 다음에 같이 읽을 책
읽고 싶은 책 제목으로 검색해 실제 책을 고르고, 같이 읽을 인원(4·6·8·10명)을 정하면 첫 번째 신청자가 되고, 다른 학생은 **나도 읽을래요**로 함께합니다. 인원이 다 모이면 다음 릴레이가 시작됩니다. 검색으로 고른 책만 올라가서 아무 글자나 추천되지 않고, 카드에는 책 표지가 함께 보입니다.
많이 모인 순으로 3권만 먼저 보여주고, 같은 책을 다시 추천하면 기존 책에 합쳐집니다.

![다음에 같이 읽을 책](docs/screenshots/wish.png)

### 모바일
폰에서는 가운데 한 권이 크게 보이는 가로 스크롤 책장이 되고, 마지막 책 다음에 첫 책이 이어집니다. 좁은 폰에서는 책갈피 카드가 5칸 × 2줄로 바뀝니다.

<p>
  <img src="docs/screenshots/mobile-home.png" width="260" alt="모바일 첫 화면">
  <img src="docs/screenshots/mobile-detail.png" width="260" alt="모바일 상세 화면">
</p>

## 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 현황 페이지: 지금 이어 읽는 책 5권(PC는 마우스 올리면 말풍선, 폰은 가로 스크롤) · 완주한 책 · 다음에 같이 읽을 책(추천) |
| `api/books.js` | Vercel 함수: 사서추천도서 + 예시 릴레이 정보 |
| `api/cover.js` | Vercel 함수: 표지 주소 (국중도 → 카카오 → 구글 북스) |
| `api/search.js` | Vercel 함수: 책 추천용 제목 검색 (카카오, 키 없으면 구글 북스) |
| `lib/library.js` | API 호출 로직 (키는 환경 변수에서만 읽음) |
| `data/state.js` | 예시 데이터: 책별 참여 인원·대출 상태, 완주한 책 후기, 추천 도서 |
| `data/snapshot.js` | 비상용 스냅샷: 국중도 API가 실패해도 책 5권·표지를 대신 보여줌 |
| `inu-logo.png` | 헤더 INU 로고 |
| `docs/screenshots/` | README 스크린샷 |
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

- API 키는 Vercel 서버 쪽에만 있고 브라우저로 나가지 않습니다. 키가 없거나 API가 멈추면(4초 타임아웃) `data/snapshot.js`로 대신 보여줍니다.
- `/api/books`는 10분, `/api/cover`는 하루 동안 Vercel CDN에 캐시돼서, 방문자가 많아도 국중도·카카오 API 호출이 크게 늘지 않습니다.
- 릴레이 완주 기준 10명은 책갈피 카드 메모 칸 수입니다 (`lib/library.js`의 `RELAY_MAX`).
- 참여 인원·대출 상태는 예시 데이터입니다. 교환독서 신청·후기·책 추천은 브라우저(localStorage)에만 저장됩니다. 실제 운영에서는 도서관 대출 시스템·서버 저장소와 연동합니다.
- 폰트는 인천대 홈페이지와 같은 에스코어드림(눈누 CDN)입니다.
- 공모전 제안용 프로토타입이며 학산도서관 공식 서비스가 아닙니다.
