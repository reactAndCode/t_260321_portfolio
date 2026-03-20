# Funding Fee Dashboard 사용매뉴얼

## 날짜별 변경 이력

### 2026-03-19

- [완료] 기본 대시보드 사용법 문서를 작성했다.

### 2026-03-20

- [완료] 전체 티커 확장, 시가총액 정렬, 괴리 Top 5 기능 기준으로 사용법을 갱신했다.

## 1. 프로젝트 실행

### 백엔드 실행

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## 2. 접속 주소

- 프론트엔드: `http://127.0.0.1:3000`
- 백엔드 API: `http://127.0.0.1:8000`
- 백엔드 문서: `http://127.0.0.1:8000/docs`

## 3. 화면 사용법

### 상단 요약 영역

- `Exchanges`: 현재 연결된 거래소 수를 보여준다.
- `Status`: 데이터 동기화 중인지, 실시간 반영 중인지 보여준다.
- `Mode`: 현재 `Current` 또는 `Predicted` 모드를 보여준다.
- `Symbols`: 현재 스냅샷에 포함된 전체 종목 수를 보여준다.

### 괴리 Top 5

- hero 아래 카드 영역에서 거래소 간 funding 괴리가 가장 큰 5개 종목을 보여준다.
- `Current` 모드에서는 현재 funding 기준 괴리를 보여준다.
- `Predicted` 모드에서는 예정 funding 기준 괴리를 보여준다.
- 카드에는 종목명, spread 값, 시가총액 순위, 비교 가능한 거래소 수가 표시된다.

### 메인 대시보드

- 상단 `Search symbol` 입력창으로 심볼을 검색할 수 있다.
- `Sort`는 기본값이 `Market Cap`이며, `Symbol`, `Average Funding`, `Exchange Spread`, `Highest Funding`로 변경 가능하다.
- `Current` / `Predicted` 버튼으로 현재 funding 과 다음 예정 funding 표시를 전환할 수 있다.
- `Favorites` 버튼으로 즐겨찾기 종목만 볼 수 있다.
- 거래소 칩을 눌러 특정 거래소 컬럼을 끄거나 다시 표시할 수 있다.
- 각 종목 왼쪽의 별 버튼으로 즐겨찾기를 추가하거나 해제할 수 있다.
- 종목명 아래에는 `MCap #순위`가 표시되며, 순위 정보가 없으면 `Unranked`로 표시된다.

## 4. 백엔드 API

### 최신 스냅샷

```text
GET /api/v1/funding/snapshot
```

전체 거래소 funding 데이터와 시가총액 메타데이터, 괴리 Top 5 정보를 JSON 형태로 반환한다.

주요 응답 필드:

- `updated_at`
- `exchanges`
- `rows`
- `top_spread_current`
- `top_spread_next`

### 실시간 스트림

```text
GET /api/v1/funding/stream
```

SSE 방식으로 최신 스냅샷을 주기적으로 전달한다.

### 거래소 상태

```text
GET /api/v1/exchanges
```

지원 거래소 목록과 상태를 반환한다.

### 헬스체크

```text
GET /api/v1/health
```

수집기 동작 상태와 거래소 이상 여부를 반환한다.

## 5. 참고사항

- 루트 주소 `http://127.0.0.1:8000/` 는 별도 페이지가 없으므로 `Not Found` 가 정상이다.
- 일부 거래소는 `next funding` 값을 제공하지 않아 `-` 로 표시될 수 있다.
- 시가총액 순위는 외부 메타데이터 소스를 기반으로 하므로 일부 파생 심볼은 `Unranked` 로 남을 수 있다.
- 거래소 수와 종목 수가 많아질수록 첫 수집 주기는 더 길어질 수 있다.
