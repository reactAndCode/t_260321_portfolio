# 네이버 키워드 분석 웹사이트 설계서

## 1. 문서 목적
- 본 문서는 현재 구현된 MVP의 아키텍처, 소스 구조, 데이터 흐름, 주요 컴포넌트 역할을 설명한다.
- 구현 담당자 또는 유지보수 담당자가 빠르게 구조를 파악할 수 있도록 작성한다.

## 2. 기술 스택
- Framework: Next.js 15 App Router
- Language: TypeScript
- UI: React 19 + CSS
- Server API: Next.js Route Handler
- External Data:
  - Naver SearchAd API
  - Naver DataLab API

## 3. 전체 아키텍처
- 클라이언트는 키워드 입력 및 결과 렌더링을 담당한다.
- 서버 API는 외부 API 연동과 결과 정규화를 담당한다.
- `lib` 계층은 외부 API 연동과 비즈니스 로직을 캡슐화한다.
- 실데이터 사용이 불가능한 환경에서는 mock 데이터 계층으로 대체된다.

## 4. 디렉터리 및 소스 구조
```text
keyword_analysis/
├─ app/
│  ├─ api/
│  │  └─ analyze/
│  │     └─ route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  └─ search-dashboard.tsx
├─ docs/
│  ├─ 01_요구사항분석.md
│  ├─ 02_설계서_task.md
│  └─ 03_사용자매뉴얼.md
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
├─ .gitignore
├─ next-env.d.ts
├─ next.config.ts
├─ package.json
└─ tsconfig.json
```

## 5. 파일별 역할
### 5.1 App 계층
- `app/layout.tsx`
  - 공통 HTML 골격과 메타데이터 설정
- `app/page.tsx`
  - 메인 페이지 엔트리
  - `SearchDashboard` 렌더링
- `app/globals.css`
  - 전체 레이아웃, 카드, 차트, 표, 반응형 스타일 정의
- `app/api/analyze/route.ts`
  - `GET /api/analyze?keyword=...` 엔드포인트 제공
  - 요청 검증 및 분석 서비스 호출
  - 캐시 헤더 설정

### 5.2 Components 계층
- `components/search-dashboard.tsx`
  - 메인 클라이언트 컴포넌트
  - 검색 폼, 로딩/오류 상태, 메트릭 카드, 차트, 인사이트, 표 렌더링
  - 초기 예시 키워드 자동 조회 처리

### 5.3 Library 계층
- `lib/types.ts`
  - 공용 타입 정의
- `lib/analyze-keyword.ts`
  - SearchAd/DataLab 결과 통합
  - fallback 처리
  - 인사이트 생성
- `lib/naver-searchad.ts`
  - SearchAd 인증 서명 생성
  - 검색량/연관 키워드 데이터 조회
- `lib/naver-datalab.ts`
  - DataLab 추이 조회
- `lib/mock-data.ts`
  - mock 데이터 생성
  - 개발 및 데모 환경 지원

## 6. 데이터 흐름 설계
### 6.1 요청 흐름
1. 사용자가 키워드를 입력한다.
2. 클라이언트가 `/api/analyze?keyword=...` 요청을 보낸다.
3. `route.ts`가 `analyzeKeyword()`를 호출한다.
4. `analyzeKeyword()`는 SearchAd와 DataLab을 병렬 조회한다.
5. 실데이터가 있으면 정규화된 응답을 반환한다.
6. 둘 다 사용 불가능하면 mock 데이터를 반환한다.
7. 클라이언트는 결과를 UI에 반영한다.

### 6.2 오류 흐름
1. 키워드가 없으면 400 오류를 반환한다.
2. 외부 API 오류가 발생하면 500 오류를 반환한다.
3. 클라이언트는 오류 메시지를 상태 패널에 출력한다.

## 7. 데이터 모델 설계
```ts
type KeywordAnalysisResult = {
  keyword: string;
  summary: {
    monthlySearchPc: number | null;
    monthlySearchMobile: number | null;
    monthlySearchTotal: number | null;
  };
  trend: {
    date: string;
    value: number;
  }[];
  relatedKeywords: {
    keyword: string;
    monthlyTotal: number | null;
    competition: number | null;
  }[];
  insights: string[];
  sourceMeta: {
    provider: string;
    fetchedAt: string;
    mode: "live" | "mock";
  };
};
```

## 8. 화면 설계
### 8.1 상단 Hero 영역
- 서비스 제목
- 설명 문구
- 키워드 입력 필드
- `분석 시작` 버튼
- 환경변수 미설정 시 mock 동작 안내

### 8.2 대시보드 영역
- 결과 제목 및 데이터 모드 표시
- 검색량 카드 3개
  - 월간 PC 검색량
  - 월간 모바일 검색량
  - 월간 총 검색량
- 검색 추이 차트
- 빠른 인사이트 목록
- 연관 키워드 테이블

### 8.3 상태 화면
- 검색 전 상태
- 로딩 상태
- 오류 상태
- 빈 데이터 상태

## 9. 환경변수 설계
`.env.local` 또는 실행 환경에 다음 값을 설정한다.

```env
NAVER_SEARCHAD_ACCESS_KEY=
NAVER_SEARCHAD_SECRET_KEY=
NAVER_SEARCHAD_CUSTOMER_ID=
NAVER_DATALAB_CLIENT_ID=
NAVER_DATALAB_CLIENT_SECRET=
```

### 동작 규칙
- SearchAd 관련 3개 값이 모두 있으면 SearchAd 연동을 시도한다.
- DataLab 관련 2개 값이 모두 있으면 DataLab 연동을 시도한다.
- 두 계열 모두 없으면 mock 모드로 동작한다.

## 10. 설계 의사결정
### 10.1 Next.js 풀스택 채택 이유
- 프론트와 서버 API를 단일 프로젝트에서 관리할 수 있다.
- 배포 단순성이 높다.
- 타입 공유가 쉽다.

### 10.2 mock fallback 도입 이유
- API 키가 없는 환경에서도 화면 개발과 데모가 가능하다.
- 외부 API 의존으로 개발이 막히지 않는다.

### 10.3 단일 페이지 대시보드 구성 이유
- MVP에서는 사용자가 빠르게 핵심 지표를 확인하는 것이 중요하다.
- 참고 이미지의 탭 구조 전체를 도입하기보다 핵심 정보 집중형 구성이 적합하다.

## 11. 테스트 및 검증 항목
- `npm run typecheck`
- `npm run lint`
- `npm run build`

### 기능 검증
- 기본 예시 키워드가 자동 조회되는지 확인
- 공백 키워드 입력 시 검증되는지 확인
- mock 모드에서 차트와 표가 표시되는지 확인
- 실데이터 모드에서 API 응답이 정규화되는지 확인
- 모바일 화면에서 카드/표가 적절히 재배치되는지 확인

## 12. 향후 개선 과제
- SearchAd 응답 중 정확한 경쟁도 범위 해석 및 포맷 개선
- DataLab 기간/단위 옵션 추가
- 서버 캐시 전략 고도화
- 검색 이력 DB 저장
- 다중 키워드 비교 기능
- 차트 라이브러리 도입
