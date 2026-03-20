from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from .config import settings
from .schemas import (
    ExchangeHealth,
    FundingEntry,
    SnapshotResponse,
    SnapshotRow,
    SpreadLeader,
    SymbolMarketMeta,
)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class FundingStore:
    def __init__(self) -> None:
        self.updated_at = utc_now()
        self._entries: dict[str, dict[str, FundingEntry]] = defaultdict(dict)
        self._health: dict[str, ExchangeHealth] = {}
        self._market_meta: dict[str, SymbolMarketMeta] = {}

    def replace_exchange(self, exchange: str, entries: list[FundingEntry], health: ExchangeHealth) -> None:
        self._entries[exchange] = {entry.symbol: entry for entry in entries}
        self._health[exchange] = health
        self.updated_at = utc_now()

    def replace_market_meta(self, metadata: dict[str, SymbolMarketMeta]) -> None:
        self._market_meta = metadata
        self.updated_at = utc_now()

    def snapshot(self) -> SnapshotResponse:
        symbols = sorted(
            {symbol for entries in self._entries.values() for symbol in entries},
            key=self._symbol_sort_key,
        )
        rows: list[SnapshotRow] = []
        for symbol in symbols:
            row_entries: dict[str, FundingEntry] = {}
            for exchange in sorted(self._entries.keys()):
                item = self._entries[exchange].get(symbol)
                if item is not None:
                    row_entries[exchange] = item
            if not row_entries:
                continue
            metadata = self._market_meta.get(symbol)
            rows.append(
                SnapshotRow(
                    symbol=symbol,
                    market_cap_rank=metadata.market_cap_rank if metadata else None,
                    market_cap_usd=metadata.market_cap_usd if metadata else None,
                    entries=row_entries,
                )
            )
        return SnapshotResponse(
            updated_at=self.updated_at,
            exchanges=sorted(self._health.values(), key=lambda item: item.label),
            rows=rows,
            top_spread_current=self._top_spread(rows, use_next=False),
            top_spread_next=self._top_spread(rows, use_next=True),
        )

    def _symbol_sort_key(self, symbol: str) -> tuple[int, int | None, str]:
        metadata = self._market_meta.get(symbol)
        if metadata and metadata.market_cap_rank is not None:
            return (0, metadata.market_cap_rank, symbol)
        return (1, None, symbol)

    def _top_spread(self, rows: list[SnapshotRow], use_next: bool) -> list[SpreadLeader]:
        leaders: list[SpreadLeader] = []
        for row in rows:
            values = [
                entry.funding_rate_next if use_next else entry.funding_rate_current
                for entry in row.entries.values()
                if (entry.funding_rate_next if use_next else entry.funding_rate_current) is not None
            ]
            if len(values) < 2:
                continue
            spread = max(values) - min(values)
            leaders.append(
                SpreadLeader(
                    symbol=row.symbol,
                    market_cap_rank=row.market_cap_rank,
                    market_cap_usd=row.market_cap_usd,
                    spread_current=None if use_next else spread,
                    spread_next=spread if use_next else None,
                    exchange_count=len(values),
                )
            )
        leaders.sort(
            key=lambda item: (
                -(
                    item.spread_next
                    if use_next and item.spread_next is not None
                    else item.spread_current or 0
                ),
                item.market_cap_rank if item.market_cap_rank is not None else 10**9,
                item.symbol,
            )
        )
        return leaders[: settings.top_spread_limit]
