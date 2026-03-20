from __future__ import annotations

import asyncio
from collections.abc import Iterable

import httpx

from .config import settings
from .schemas import SymbolMarketMeta


SYMBOL_ALIASES: dict[str, tuple[str, ...]] = {
    "1000PEPE": ("PEPE",),
    "1000BONK": ("BONK",),
    "1000FLOKI": ("FLOKI",),
    "XBT": ("BTC",),
}


class MarketMetadataService:
    async def fetch(self, client: httpx.AsyncClient) -> dict[str, SymbolMarketMeta]:
        pages = [
            client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": settings.market_metadata_vs_currency,
                    "order": "market_cap_desc",
                    "per_page": 250,
                    "page": page,
                    "sparkline": "false",
                },
            )
            for page in range(1, settings.market_metadata_pages + 1)
        ]

        responses = await asyncio.gather(*pages)
        metadata: dict[str, SymbolMarketMeta] = {}
        for response in responses:
            response.raise_for_status()
            for item in response.json():
                symbol = str(item.get("symbol") or "").upper()
                rank = item.get("market_cap_rank")
                market_cap = item.get("market_cap")
                if not symbol:
                    continue
                existing = metadata.get(symbol)
                if existing and existing.market_cap_rank is not None and rank is not None:
                    if existing.market_cap_rank <= rank:
                        continue
                metadata[symbol] = SymbolMarketMeta(
                    symbol=symbol,
                    market_cap_rank=int(rank) if rank is not None else None,
                    market_cap_usd=float(market_cap) if market_cap is not None else None,
                )

        self._apply_aliases(list(metadata.values()), metadata)
        return metadata

    def _apply_aliases(
        self,
        items: Iterable[SymbolMarketMeta],
        target: dict[str, SymbolMarketMeta],
    ) -> None:
        for item in items:
            for alias, sources in SYMBOL_ALIASES.items():
                if item.symbol in sources and alias not in target:
                    target[alias] = SymbolMarketMeta(
                        symbol=alias,
                        market_cap_rank=item.market_cap_rank,
                        market_cap_usd=item.market_cap_usd,
                    )
market_metadata_service = MarketMetadataService()
