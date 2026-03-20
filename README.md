# Funding Fee Dashboard

거래소별 선물 `funding fee` 를 한 화면에서 비교하는 실시간 히트맵 대시보드입니다.

## Structure

- `backend/`: `FastAPI` 기반 수집기 + API + SSE 스트림
- `frontend/`: `Next.js` 기반 대시보드 UI

## Backend Run

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

기본 API 주소는 `http://127.0.0.1:8000` 입니다.

http://127.0.0.1:8000/docs

## Frontend Run

```bash
cd frontend
npm install
npm run dev
```

필요하면 `NEXT_PUBLIC_API_BASE_URL` 로 백엔드 주소를 지정합니다.

## Implemented v1

- 6개 거래소 어댑터: Binance, OKX, Bybit, Bitget, KuCoin, Gate
- 메모리 기반 최신 스냅샷 캐시
- `snapshot`, `stream`, `exchanges`, `health` API
- 심볼 검색, 정렬, 거래소 토글, 즐겨찾기, 현재/예상 funding 전환
- 참고 이미지 스타일의 히트맵 테이블 UI

## Docs

- [요구사항](./docs/requirements.md)
- [분석문서](./docs/analysis.md)
- [개발수행태스크](./docs/development_tasks.md)
- [사용매뉴얼](./docs/user_manual.md)

## Notes

- 일부 거래소는 `predicted/next funding` 를 직접 제공하지 않으므로 `-` 로 표시될 수 있습니다.
- OKX 는 현재 구현상 개별 funding 조회를 사용하므로 다른 거래소보다 느릴 수 있습니다. 다음 단계에서 동시성 제한/배치 최적화를 추가하는 것이 좋습니다.

