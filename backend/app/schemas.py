from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ExchangeStatus = Literal["ok", "degraded"]


class FundingEntry(BaseModel):
    exchange: str
    exchange_label: str
    symbol: str
    native_symbol: str
    base_asset: str
    quote_asset: str
    market_type: Literal["perpetual"] = "perpetual"
    funding_rate_current: float | None = None
    funding_rate_next: float | None = None
    funding_time_next: datetime | None = None
    updated_at: datetime
    status: ExchangeStatus = "ok"
    source_latency_ms: float | None = None


class SymbolMarketMeta(BaseModel):
    symbol: str
    market_cap_rank: int | None = None
    market_cap_usd: float | None = None


class SnapshotRow(BaseModel):
    symbol: str
    market_cap_rank: int | None = None
    market_cap_usd: float | None = None
    entries: dict[str, FundingEntry]


class SpreadLeader(BaseModel):
    symbol: str
    market_cap_rank: int | None = None
    market_cap_usd: float | None = None
    spread_current: float | None = None
    spread_next: float | None = None
    exchange_count: int


class ExchangeHealth(BaseModel):
    exchange: str
    label: str
    status: ExchangeStatus
    message: str | None = None
    updated_at: datetime | None = None
    symbols_loaded: int = 0


class SnapshotResponse(BaseModel):
    updated_at: datetime
    exchanges: list[ExchangeHealth]
    rows: list[SnapshotRow]
    top_spread_current: list[SpreadLeader]
    top_spread_next: list[SpreadLeader]


class StreamEvent(BaseModel):
    type: Literal["snapshot", "heartbeat"]
    payload: SnapshotResponse | None = None
    emitted_at: datetime = Field(default_factory=datetime.utcnow)
