# Funding Fee Dashboard 개발수행태스크

## 완료된 작업

1. [완료] `backend/` 와 `frontend/` 기본 구조를 구성했다.
2. [완료] `FastAPI` 백엔드 수집기와 API 골격을 구현했다.
3. [완료] 6개 거래소 연동을 구현했다.
4. [완료] 메모리 기반 최신 스냅샷 저장소를 구현했다.
5. [완료] `snapshot`, `stream`, `exchanges`, `health` API를 구현했다.
6. [완료] `Next.js` 기반 대시보드 화면을 구현했다.
7. [완료] 검색, 정렬, 즐겨찾기, 거래소 토글, 현재/예정 funding 전환 기능을 구현했다.
8. [완료] `Next.js`를 `16.2.0`으로 업그레이드했다.
9. [완료] hydration warning 완화를 위해 `body suppressHydrationWarning`를 적용했다.
10. [완료] 로컬 실행 검증을 수행했다.

## 2026-03-20 확장 작업

1. [완료] 고정 10개 티커 제한을 제거하고 거래소별 전체 USDT perpetual 티커 수집 구조로 전환했다.
2. [완료] 시가총액 메타데이터 수집 계층을 추가했다.
3. [완료] 스냅샷 구조를 `SnapshotRow`, `SpreadLeader` 기반으로 확장했다.
4. [완료] 기본 정렬을 `Market Cap` 우선으로 변경했다.
5. [완료] 종목 셀에 시가총액 순위 표시를 추가했다.
6. [완료] 상단에 거래소 간 funding 괴리 Top 5 요약 UI를 추가했다.
7. [완료] 현재/예정 funding 모드에 맞는 괴리 Top 5 전환을 연결했다.
8. [완료] 요구사항, 분석, 태스크, 사용자 매뉴얼 문서를 최신 상태로 갱신했다.

## 현재 주요 파일 위치

- 백엔드 엔트리: `backend/app/main.py`
- 거래소 수집 로직: `backend/app/exchanges.py`
- 메타데이터 수집 로직: `backend/app/metadata.py`
- 수집 서비스: `backend/app/service.py`
- 스냅샷 저장소: `backend/app/store.py`
- 스키마 정의: `backend/app/schemas.py`
- 프론트 메인 페이지: `frontend/app/page.tsx`
- 대시보드 UI: `frontend/components/funding-dashboard.tsx`
- 스트림 연결: `frontend/components/use-funding-stream.ts`

## 검증 결과

1. [완료] `python -m compileall backend\\app` 실행으로 백엔드 문법 검증을 통과했다.
2. [완료] `python -c "from app.store import FundingStore"` 수준의 import 검증을 통과했다.
3. [완료] `npx tsc --noEmit` 실행으로 프론트 TypeScript 타입 검증을 통과했다.
4. [보류] `npm run build` 는 Next.js 컴파일 자체는 완료됐지만, 이후 현재 환경에서 `spawn EPERM` 으로 종료됐다.
5. [보류] `npm run lint` 는 현재 `next lint` 실행 방식 문제로 정상 수행되지 않았다.

## 현재 리스크 및 후속 후보

1. [대기] OKX는 전체 티커 확장 시 개별 funding 조회 수가 많아 병목 가능성이 있다.
2. [대기] 일부 파생 심볼은 시가총액 메타데이터 매핑이 누락될 수 있다.
3. [대기] 종목 수 증가에 따라 테이블 virtualization 도입이 필요할 수 있다.
4. [대기] 시가총액 메타데이터 실패 시 장기 캐시 전략을 보강할 필요가 있다.
