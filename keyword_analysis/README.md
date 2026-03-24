# Keyword Pulse

네이버 키워드를 입력하면 검색량, 검색 추이, 연관 키워드를 대시보드 형태로 보여주는 `Next.js` 기반 웹 애플리케이션입니다.

참고 화면은 `plan/img14.png`를 기준으로 했으며, 1차 버전은 복잡한 SEO 도구 전체가 아니라 핵심 지표 중심의 분석형 MVP로 구현했습니다.

## 주요 기능
- 키워드 검색
- 월간 PC 검색량 확인
- 월간 모바일 검색량 확인
- 월간 총 검색량 확인
- 최근 12개월 검색 추이 확인
- 연관 키워드 목록 확인
- 자동 인사이트 문장 제공
- 네이버 실데이터 또는 mock 데이터 모드 지원

## 기술 스택
- Next.js 15
- React 19
- TypeScript
- CSS
- Naver SearchAd API
- Naver DataLab API

## 프로젝트 구조
```text
keyword_analysis/
├─ app/
│  ├─ api/analyze/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  └─ search-dashboard.tsx
├─ docs/
│  ├─ 01_요구사항분석.md
│  ├─ 02_설계서_task.md
│  ├─ 03_사용자매뉴얼.md
│  ├─ 04_네이버키발급받는방법.md
│  └─ 05_배포가이드.md
├─ lib/
│  ├─ analyze-keyword.ts
│  ├─ mock-data.ts
│  ├─ naver-datalab.ts
│  ├─ naver-searchad.ts
│  └─ types.ts
├─ plan/
│  └─ img14.png
├─ .env.example
├─ .eslintrc.json
├─ next.config.ts
├─ package.json
└─ tsconfig.json
```

## 빠른 시작

### 1. 의존성 설치
```powershell
npm install
```

### 2. 개발 서버 실행
```powershell
npm run dev
```

브라우저 접속:

```text
http://localhost:3000
```

## 환경변수
프로젝트 루트에 `.env.local` 파일을 생성하고 아래 값을 설정하면 네이버 실데이터를 사용할 수 있습니다.

```env
NAVER_SEARCHAD_ACCESS_KEY=
NAVER_SEARCHAD_SECRET_KEY=
NAVER_SEARCHAD_CUSTOMER_ID=
NAVER_DATALAB_CLIENT_ID=
NAVER_DATALAB_CLIENT_SECRET=
```

환경변수를 설정하지 않으면 앱은 `mock 데이터 모드`로 동작합니다.

## 동작 방식
- 브라우저에서 키워드 입력
- `/api/analyze` 서버 API 호출
- 서버에서 Naver SearchAd 및 DataLab 조회
- 결과를 정규화해 UI에 표시
- 실데이터를 사용할 수 없으면 mock 데이터로 fallback

## 주요 스크립트

### 개발 서버
```powershell
npm run dev
```

### 타입 검사
```powershell
npm run typecheck
```

### 린트
```powershell
npm run lint
```

### 프로덕션 빌드
```powershell
npm run build
```

### 프로덕션 실행
```powershell
npm run start
```

## 검증 상태
현재 구현 기준으로 아래 검증을 통과했습니다.
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## 문서
- [요구사항 분석](docs/01_요구사항분석.md)
- [설계서](docs/02_설계서_task.md)
- [사용자 매뉴얼](docs/03_사용자매뉴얼.md)
- [네이버 API 키 발급 방법](docs/04_네이버키발급받는방법.md)
- [배포 가이드](docs/05_배포가이드.md)

## 참고
- 참고 화면: `plan/img14.png`
- SearchAd와 DataLab은 발급 경로가 다릅니다.
- 실서비스 운영 전에는 대표 키워드 기준으로 실데이터 검증을 권장합니다.
