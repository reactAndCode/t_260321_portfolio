from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .config import settings
from .service import collector


@asynccontextmanager
async def lifespan(_: FastAPI):
    await collector.collect_once()
    await collector.start()
    yield
    await collector.stop()


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/funding/snapshot")
async def funding_snapshot():
    return collector.snapshot()


@app.get("/api/v1/funding/stream")
async def funding_stream():
    return StreamingResponse(collector.stream(), media_type="text/event-stream")


@app.get("/api/v1/exchanges")
async def exchanges():
    snapshot = collector.snapshot()
    return {"updated_at": snapshot.updated_at, "exchanges": snapshot.exchanges}


@app.get("/api/v1/health")
async def health():
    snapshot = collector.snapshot()
    degraded = [exchange for exchange in snapshot.exchanges if exchange.status != "ok"]
    return {
        "status": "degraded" if degraded else "ok",
        "updated_at": snapshot.updated_at,
        "refresh_interval_seconds": settings.refresh_interval_seconds,
        "exchange_count": len(snapshot.exchanges),
        "degraded_exchanges": degraded,
    }
