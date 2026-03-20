# Funding Fee Dashboard 분석문서

## 개요

Funding Fee Dashboard는 여러 거래소의 perpetual funding rate를 한 화면에서 비교하기 위한 실시간 대시보드다.
초기 버전은 10개 주요 티커만 비교했지만, 2026-03-20 확장 작업으로 거래소별 전체 USDT perpetual 티커를 수집하는 구조로 전환했다.

## 날짜별 분석 이력

### 2026-03-19

- [완료] 6개 거래소의 funding 데이터를 공통 스키마로 정규화하는 구조를 설계했다.
- [완료] 메모리 기반 스냅샷 저장소와 `REST snapshot + SSE stream` 전달 방식을 채택했다.
- [완료] 검색, 정렬, 거래소 토글, 즐겨찾기, 현재/예정 funding 전환 중심의 테이블 UI를 정의했다.

### 2026-03-20

- [완료] 고정 10개 티커 제한은 확장성에 맞지 않아 제거했다.
- [완료] 심볼 수가 100개 이상으로 늘어날 수 있으므로 기본 정렬 기준을 `시가총액`으로 전환했다.
- [완료] 사용자가 빠르게 기회를 볼 수 있도록 상단에 `괴리 Top 5` 요약 영역을 추가했다.
- [완료] 거래소 펀딩 데이터와 별도로 시가총액 메타데이터를 수집하는 구조를 도입했다.

## 현재 아키텍처

### 백엔드

- `backend/app/main.py`
  - `snapshot`, `stream`, `exchanges`, `health` API를 제공한다.
- `backend/app/service.py`
  - 거래소 데이터 수집과 시가총액 메타데이터 수집을 주기적으로 수행한다.
- `backend/app/exchanges.py`
  - 거래소별 REST 응답을 공통 `FundingEntry` 형태로 정규화한다.
- `backend/app/metadata.py`
  - 시가총액 기반 정렬용 메타데이터를 외부 시장 데이터 소스에서 수집한다.
- `backend/app/store.py`
  - 전체 심볼 합집합 기준으로 row를 구성하고, 현재/예정 funding 괴리 상위 종목을 계산한다.

### 프론트엔드

- `frontend/app/page.tsx`
  - hero 영역, 괴리 Top 5 영역, 메인 대시보드를 조합한다.
- `frontend/components/use-funding-stream.ts`
  - 최초 snapshot 조회 후 SSE를 통해 최신 스냅샷을 반영한다.
- `frontend/components/funding-dashboard.tsx`
  - 검색, 정렬, 즐겨찾기, 거래소 토글, 현재/예정 funding 전환, 히트맵 테이블 렌더링을 담당한다.

## 데이터 모델 분석

### FundingEntry

거래소별 개별 funding 데이터의 공통 스키마다.

- `exchange`
- `exchange_label`
- `symbol`
- `native_symbol`
- `base_asset`
- `quote_asset`
- `market_type`
- `funding_rate_current`
- `funding_rate_next`
- `funding_time_next`
- `updated_at`
- `status`
- `source_latency_ms`

### SnapshotRow

테이블 한 행을 구성하는 데이터 단위다.

- `symbol`
- `market_cap_rank`
- `market_cap_usd`
- `entries`

### SpreadLeader

상단 괴리 Top 5를 구성하는 요약 데이터다.

- `symbol`
- `market_cap_rank`
- `market_cap_usd`
- `spread_current`
- `spread_next`
- `exchange_count`

## 핵심 설계 판단

### 1. 전체 티커 확장

초기 버전의 `tracked_symbols` 기반 고정 목록은 빠른 프로토타입에는 적합했지만, 실제 사용에서는 빠르게 한계가 드러난다.
현재는 각 거래소가 반환하는 전체 USDT perpetual 티커를 수집하고, 저장소에서 전체 심볼 합집합 기준으로 row를 구성한다.

### 2. 시가총액 우선 정렬

전체 티커가 많아지면 알파벳 정렬은 실사용성이 떨어진다.
따라서 기본 정렬은 `market_cap_rank` 오름차순, 즉 시가총액 상위 종목 우선으로 전환했다.
시가총액 정보가 없는 종목은 후순위로 배치한다.

### 3. 괴리 Top 5

단순 테이블 탐색만으로는 기회 포착 속도가 떨어진다.
그래서 심볼별 `max(funding) - min(funding)` spread를 계산해 상단에 상위 5개를 노출한다.
현재 funding과 예정 funding 각각 별도로 계산해두고, 프론트에서는 현재 모드에 맞는 목록을 보여준다.

### 4. 시가총액 메타데이터 분리

거래소 API는 funding 데이터에는 적합하지만 시가총액 정렬 기준으로는 일관성이 부족하다.
이 때문에 funding 수집과 별개로 시가총액 메타데이터 수집 계층을 분리했다.

## 현재 리스크와 한계

- 거래소별 심볼 표기 차이로 시가총액 매핑 누락이 발생할 수 있다.
- `1000PEPE` 같은 파생 심볼은 alias 매핑으로 일부 보완했지만, 모든 케이스를 완전히 커버하지는 못한다.
- OKX는 여전히 티커별 funding-rate 개별 조회 구조라 전체 시장 확장 시 가장 부담이 큰 거래소다.
- 괴리 Top 5는 현재 전체 활성 거래소 기준으로 계산되며, 개별 사용자가 토글한 거래소 조합별 재계산까지는 하지 않는다.

## 다음 검토 후보

- OKX 조회 병렬성 제한 또는 배치 최적화
- 심볼 alias 사전 확장
- 대량 row 렌더링을 위한 virtualization 검토
- 시가총액 메타데이터 실패 시 캐시 유지 전략 강화
