from __future__ import annotations

import asyncio
import json
from contextlib import suppress

import httpx

from .config import settings
from .exchanges import ADAPTERS
from .metadata import market_metadata_service
from .schemas import SnapshotResponse
from .store import FundingStore


class FundingCollector:
    def __init__(self) -> None:
        self.store = FundingStore()
        self._task: asyncio.Task[None] | None = None

    async def start(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            with suppress(asyncio.CancelledError):
                await self._task
            self._task = None

    async def _run(self) -> None:
        while True:
            await self.collect_once()
            await asyncio.sleep(settings.refresh_interval_seconds)

    async def collect_once(self) -> None:
        timeout = httpx.Timeout(settings.request_timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout, headers={"User-Agent": "funding-dashboard/0.1"}) as client:
            exchange_task = asyncio.gather(*(adapter.fetch(client) for adapter in ADAPTERS))
            metadata_task = market_metadata_service.fetch(client)
            results, metadata = await asyncio.gather(exchange_task, metadata_task, return_exceptions=True)
        if isinstance(metadata, dict):
            self.store.replace_market_meta(metadata)
        if isinstance(results, Exception):
            raise results
        for result in results:
            self.store.replace_exchange(result.exchange, result.entries, result.health)

    def snapshot(self) -> SnapshotResponse:
        return self.store.snapshot()

    async def stream(self):
        while True:
            payload = self.snapshot().model_dump(mode="json")
            yield f"event: snapshot\ndata: {json.dumps(payload)}\n\n"
            await asyncio.sleep(settings.refresh_interval_seconds)


collector = FundingCollector()
