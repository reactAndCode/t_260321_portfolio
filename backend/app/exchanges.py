from __future__ import annotations

import asyncio
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import httpx

from .schemas import ExchangeHealth, FundingEntry


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def from_millis(value: Any) -> datetime | None:
    if value in (None, "", 0):
        return None
    try:
        return datetime.fromtimestamp(int(value) / 1000, tz=timezone.utc)
    except (TypeError, ValueError):
        return None


@dataclass(slots=True)
class ExchangeResult:
    exchange: str
    label: str
    entries: list[FundingEntry]
    health: ExchangeHealth


class ExchangeAdapter:
    exchange: str
    label: str

    async def fetch(self, client: httpx.AsyncClient) -> ExchangeResult:
        raise NotImplementedError

    def _normalize_entries(self, items: Iterable[FundingEntry]) -> list[FundingEntry]:
        return sorted(items, key=lambda item: item.symbol)


class BinanceAdapter(ExchangeAdapter):
    exchange = "binance"
    label = "Binance"

    async def fetch(self, client: httpx.AsyncClient) -> ExchangeResult:
        started_at = utc_now()
        try:
            response = await client.get("https://fapi.binance.com/fapi/v1/premiumIndex")
            response.raise_for_status()
            payload = response.json()
            entries = []
            for item in payload:
                symbol = item["symbol"]
                if not symbol.endswith("USDT"):
                    continue
                base_asset = symbol.removesuffix("USDT")
                entries.append(
                    FundingEntry(
                        exchange=self.exchange,
                        exchange_label=self.label,
                        symbol=base_asset,
                        native_symbol=symbol,
                        base_asset=base_asset,
                        quote_asset="USDT",
                        funding_rate_current=float(item.get("lastFundingRate") or 0),
                        funding_rate_next=float(item.get("lastFundingRate") or 0),
                        funding_time_next=from_millis(item.get("nextFundingTime")),
                        updated_at=utc_now(),
                        source_latency_ms=(utc_now() - started_at).total_seconds() * 1000,
                    )
                )
            filtered = self._normalize_entries(entries)
            health = ExchangeHealth(
                exchange=self.exchange,
                label=self.label,
                status="ok",
                updated_at=utc_now(),
                symbols_loaded=len(filtered),
            )
            return ExchangeResult(self.exchange, self.label, filtered, health)
        except Exception as exc:
            return ExchangeResult(
                self.exchange,
                self.label,
                [],
                ExchangeHealth(
                    exchange=self.exchange,
                    label=self.label,
                    status="degraded",
                    message=str(exc),
                    updated_at=utc_now(),
                ),
            )


class BybitAdapter(ExchangeAdapter):
    exchange = "bybit"
    label = "Bybit"

    async def fetch(self, client: httpx.AsyncClient) -> ExchangeResult:
        started_at = utc_now()
        try:
            response = await client.get(
                "https://api.bybit.com/v5/market/tickers",
                params={"category": "linear"},
            )
            response.raise_for_status()
            payload = response.json()["result"]["list"]
            entries = []
            for item in payload:
                symbol = item["symbol"]
                if not symbol.endswith("USDT"):
                    continue
                base_asset = symbol.removesuffix("USDT")
                next_rate = item.get("fundingRate")
                entries.append(
                    FundingEntry(
                        exchange=self.exchange,
                        exchange_label=self.label,
                        symbol=base_asset,
                        native_symbol=symbol,
                        base_asset=base_asset,
                        quote_asset="USDT",
                        funding_rate_current=float(item.get("fundingRate") or 0),
                        funding_rate_next=float(next_rate) if next_rate is not None else None,
                        funding_time_next=from_millis(item.get("nextFundingTime")),
                        updated_at=utc_now(),
                        source_latency_ms=(utc_now() - started_at).total_seconds() * 1000,
                    )
                )
            filtered = self._normalize_entries(entries)
            health = ExchangeHealth(
                exchange=self.exchange,
                label=self.label,
                status="ok",
                updated_at=utc_now(),
                symbols_loaded=len(filtered),
            )
            return ExchangeResult(self.exchange, self.label, filtered, health)
        except Exception as exc:
            return ExchangeResult(
                self.exchange,
                self.label,
                [],
                ExchangeHealth(
                    exchange=self.exchange,
                    label=self.label,
                    status="degraded",
                    message=str(exc),
                    updated_at=utc_now(),
                ),
            )


class OKXAdapter(ExchangeAdapter):
    exchange = "okx"
    label = "OKX"

    async def fetch(self, client: httpx.AsyncClient) -> ExchangeResult:
        started_at = utc_now()
        try:
            instruments_response = await client.get(
                "https://www.okx.com/api/v5/public/instruments",
                params={"instType": "SWAP"},
            )
            instruments_response.raise_for_status()
            instruments = instruments_response.json()["data"]
            mapping = {
                item["instId"]: item["settleCcy"]
                for item in instruments
                if item.get("settleCcy") == "USDT"
            }
            entries = []
            funding_requests = [
                client.get(
                    "https://www.okx.com/api/v5/public/funding-rate",
                    params={"instId": inst_id},
                )
                for inst_id in mapping
            ]
            funding_responses = await asyncio.gather(*funding_requests)
            for (inst_id, quote_asset), funding_response in zip(mapping.items(), funding_responses, strict=False):
                funding_response.raise_for_status()
                data = funding_response.json()["data"]
                if not data:
                    continue
                item = data[0]
                base_asset = inst_id.split("-")[0]
                entries.append(
                    FundingEntry(
                        exchange=self.exchange,
                        exchange_label=self.label,
                        symbol=base_asset,
                        native_symbol=inst_id,
                        base_asset=base_asset,
                        quote_asset=quote_asset,
                        funding_rate_current=float(item.get("fundingRate") or 0),
                        funding_rate_next=float(item.get("nextFundingRate") or 0),
                        funding_time_next=from_millis(item.get("fundingTime")),
                        updated_at=utc_now(),
                        source_latency_ms=(utc_now() - started_at).total_seconds() * 1000,
                    )
                )
            filtered = self._normalize_entries(entries)
            health = ExchangeHealth(
                exchange=self.exchange,
                label=self.label,
                status="ok",
                updated_at=utc_now(),
                symbols_loaded=len(filtered),
            )
            return ExchangeResult(self.exchange, self.label, filtered, health)
        except Exception as exc:
            return ExchangeResult(
                self.exchange,
                self.label,
                [],
                ExchangeHealth(
                    exchange=self.exchange,
                    label=self.label,
                    status="degraded",
                    message=str(exc),
                    updated_at=utc_now(),
                ),
            )


class BitgetAdapter(ExchangeAdapter):
    exchange = "bitget"
    label = "Bitget"

    async def fetch(self, client: httpx.AsyncClient) -> ExchangeResult:
        started_at = utc_now()
        try:
            response = await client.get(
                "https://api.bitget.com/api/v2/mix/market/tickers",
                params={"productType": "USDT-FUTURES"},
            )
            response.raise_for_status()
            payload = response.json()["data"]
            entries = []
            for item in payload:
                symbol = item["symbol"]
                if not symbol.endswith("USDT"):
                    continue
                base_asset = symbol.removesuffix("USDT")
                entries.append(
                    FundingEntry(
                        exchange=self.exchange,
                        exchange_label=self.label,
                        symbol=base_asset,
                        native_symbol=symbol,
                        base_asset=base_asset,
                        quote_asset="USDT",
                        funding_rate_current=float(item.get("fundingRate") or 0),
                        funding_rate_next=float(item.get("fundingRate") or 0),
                        funding_time_next=from_millis(item.get("nextFundingTime")),
                        updated_at=utc_now(),
                        source_latency_ms=(utc_now() - started_at).total_seconds() * 1000,
                    )
                )
            filtered = self._normalize_entries(entries)
            health = ExchangeHealth(
                exchange=self.exchange,
                label=self.label,
                status="ok",
                updated_at=utc_now(),
                symbols_loaded=len(filtered),
            )
            return ExchangeResult(self.exchange, self.label, filtered, health)
        except Exception as exc:
            return ExchangeResult(
                self.exchange,
                self.label,
                [],
                ExchangeHealth(
                    exchange=self.exchange,
                    label=self.label,
                    status="degraded",
                    message=str(exc),
                    updated_at=utc_now(),
                ),
            )


class KuCoinAdapter(ExchangeAdapter):
    exchange = "kucoin"
    label = "KuCoin"

    async def fetch(self, client: httpx.AsyncClient) -> ExchangeResult:
        started_at = utc_now()
        try:
            response = await client.get("https://api-futures.kucoin.com/api/v1/contracts/active")
            response.raise_for_status()
            payload = response.json()["data"]
            entries = []
            for item in payload:
                symbol = item["symbol"]
                if not symbol.endswith("USDTM"):
                    continue
                base_asset = symbol.removesuffix("USDTM")
                entries.append(
                    FundingEntry(
                        exchange=self.exchange,
                        exchange_label=self.label,
                        symbol=base_asset,
                        native_symbol=symbol,
                        base_asset=base_asset,
                        quote_asset="USDT",
                        funding_rate_current=float(item.get("fundingFeeRate") or 0),
                        funding_rate_next=float(item.get("predictedFundingFeeRate") or 0),
                        funding_time_next=from_millis(item.get("nextFundingRateTime")),
                        updated_at=utc_now(),
                        source_latency_ms=(utc_now() - started_at).total_seconds() * 1000,
                    )
                )
            filtered = self._normalize_entries(entries)
            health = ExchangeHealth(
                exchange=self.exchange,
                label=self.label,
                status="ok",
                updated_at=utc_now(),
                symbols_loaded=len(filtered),
            )
            return ExchangeResult(self.exchange, self.label, filtered, health)
        except Exception as exc:
            return ExchangeResult(
                self.exchange,
                self.label,
                [],
                ExchangeHealth(
                    exchange=self.exchange,
                    label=self.label,
                    status="degraded",
                    message=str(exc),
                    updated_at=utc_now(),
                ),
            )


class GateAdapter(ExchangeAdapter):
    exchange = "gate"
    label = "Gate"

    async def fetch(self, client: httpx.AsyncClient) -> ExchangeResult:
        started_at = utc_now()
        try:
            response = await client.get("https://api.gateio.ws/api/v4/futures/usdt/contracts")
            response.raise_for_status()
            payload = response.json()
            entries = []
            for item in payload:
                symbol = item["name"]
                if not symbol.endswith("_USDT"):
                    continue
                base_asset = symbol.removesuffix("_USDT")
                entries.append(
                    FundingEntry(
                        exchange=self.exchange,
                        exchange_label=self.label,
                        symbol=base_asset,
                        native_symbol=symbol,
                        base_asset=base_asset,
                        quote_asset="USDT",
                        funding_rate_current=float(item.get("funding_rate") or 0),
                        funding_rate_next=float(item.get("funding_rate_indicative") or 0),
                        funding_time_next=from_millis(item.get("funding_next_apply")),
                        updated_at=utc_now(),
                        source_latency_ms=(utc_now() - started_at).total_seconds() * 1000,
                    )
                )
            filtered = self._normalize_entries(entries)
            health = ExchangeHealth(
                exchange=self.exchange,
                label=self.label,
                status="ok",
                updated_at=utc_now(),
                symbols_loaded=len(filtered),
            )
            return ExchangeResult(self.exchange, self.label, filtered, health)
        except Exception as exc:
            return ExchangeResult(
                self.exchange,
                self.label,
                [],
                ExchangeHealth(
                    exchange=self.exchange,
                    label=self.label,
                    status="degraded",
                    message=str(exc),
                    updated_at=utc_now(),
                ),
            )


ADAPTERS: list[ExchangeAdapter] = [
    BinanceAdapter(),
    OKXAdapter(),
    BybitAdapter(),
    BitgetAdapter(),
    KuCoinAdapter(),
    GateAdapter(),
]
