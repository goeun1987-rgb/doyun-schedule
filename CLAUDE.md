# 도윤이 시간표 (doyun-schedule)

## 프로젝트 개요
도윤이 학원 시간표 관리 웹앱. 시간표 CRUD + 프린트용 뷰 제공.

- **프레임워크**: Next.js 16 (App Router, Turbopack)
- **DB**: Turso (libsql, 클라우드 SQLite) — `@libsql/client`
- **배포**: Vercel (git push → 자동 배포)
- **URL**: https://doyun-schedule.vercel.app
- **GitHub**: https://github.com/goeun1987-rgb/doyun-schedule

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx              # 메인 시간표 UI (클라이언트 컴포넌트, SWR)
│   ├── layout.tsx            # 레이아웃 (한국어 메타데이터)
│   ├── globals.css           # 커스텀 스타일 (카드, 모달, 탭 등)
│   ├── print/page.tsx        # 프린트/캡처용 시간표 그리드 (서버 컴포넌트)
│   └── api/schedules/
│       ├── route.ts          # GET (조회), POST (생성)
│       └── [id]/route.ts     # PUT (수정), DELETE (삭제)
└── lib/
    ├── db.ts                 # Turso 클라이언트 + 테이블 초기화
    ├── db-schedules.ts       # 스케줄 CRUD (async)
    ├── db-notifications.ts   # 알림 규칙 CRUD (async, 미사용)
    ├── db-notification-log.ts # 알림 로그 (async, 미사용)
    └── types.ts              # 타입 정의, DAYS_OF_WEEK, SCHEDULE_COLORS
```

## DB 연결

- **클라우드**: Turso (`@libsql/client`) — 비동기 API (`async/await`)
- **로컬 폴백**: `TURSO_DATABASE_URL` 미설정 시 `file:./data/schedule.db` 사용
- **모든 DB 함수는 async** — `better-sqlite3`(동기)에서 마이그레이션 완료
- 환경변수: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`

## 배포

```bash
# 수정 후 배포 (git push만 하면 Vercel 자동 배포)
git add . && git commit -m "변경 내용" && git push
```

- Vercel 환경변수는 `npx vercel env add` 로 설정
- **주의**: `echo`로 env 추가하면 줄바꿈(\n)이 붙음 → 반드시 `printf '%s'` 사용

## 주의사항

- 서버 컴포넌트에서 DB 접근하는 페이지는 `export const dynamic = 'force-dynamic'` 필요 (빌드 시 prerender 방지)
- `next.config.ts`에 `serverExternalPackages: ['@libsql/client']` 설정됨
- `.env.local`은 gitignore에 포함 — Vercel에는 별도로 환경변수 설정 필요
- `data/` 디렉토리(로컬 SQLite)도 gitignore에 포함

## 미구현 / 향후 계획

### 카카오톡 알림
- DB 테이블 준비됨: `notification_rules`, `notification_log`, `kakao_tokens`
- `node-cron` 설치됨
- `.env.local`에 `KAKAO_REST_API_KEY` 항목 있음
- 구현 순서: 카카오 OAuth → "나에게 보내기" → 스케줄러 → "친구에게 보내기" 확장
- 친구에게 보내기는 카카오 권한 신청 + 상대방 동의 필요

## 개발 명령어

```bash
npm run dev      # 로컬 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
turso db shell doyun-schedule   # Turso DB 직접 쿼리
```
