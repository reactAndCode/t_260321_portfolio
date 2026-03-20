"use client";

import { useEffect, useMemo, useState } from "react";

import type { FundingEntry, SnapshotResponse, SnapshotRow } from "./types";

type SortMode = "marketCap" | "symbol" | "average" | "spread" | "highest";

type Props = {
  snapshot: SnapshotResponse | null;
  error: string | null;
  loading: boolean;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (next: boolean) => void;
  showNextFunding: boolean;
  onShowNextFundingChange: (next: boolean) => void;
};

const FAVORITES_KEY = "funding-dashboard-favorites";

export function FundingDashboard({
  snapshot,
  error,
  loading,
  favoritesOnly,
  onFavoritesOnlyChange,
  showNextFunding,
  onShowNextFundingChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("marketCap");
  const [enabledExchanges, setEnabledExchanges] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored) as string[]);
      } catch {
        window.localStorage.removeItem(FAVORITES_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (snapshot && enabledExchanges.length === 0) {
      setEnabledExchanges(snapshot.exchanges.map((exchange) => exchange.exchange));
    }
  }, [snapshot, enabledExchanges.length]);

  const toggleFavorite = (symbol: string) => {
    const nextFavorites = favorites.includes(symbol)
      ? favorites.filter((item) => item !== symbol)
      : [...favorites, symbol];
    setFavorites(nextFavorites);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextFavorites));
  };

  const visibleExchanges = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    return snapshot.exchanges.filter((exchange) =>
      enabledExchanges.includes(exchange.exchange),
    );
  }, [enabledExchanges, snapshot]);

  const rows = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const mapped = snapshot.rows
      .map((row) => {
        const entries = visibleExchanges
          .map((exchange) => row.entries[exchange.exchange])
          .filter(Boolean) as FundingEntry[];
        const values = entries
          .map((entry) =>
            showNextFunding ? entry.funding_rate_next : entry.funding_rate_current,
          )
          .filter((value): value is number => value !== null);
        const average = values.length
          ? values.reduce((sum, value) => sum + value, 0) / values.length
          : 0;
        const spread = values.length ? Math.max(...values) - Math.min(...values) : 0;
        const highest = values.length ? Math.max(...values) : 0;
        return {
          row,
          symbol: row.symbol,
          average,
          spread,
          highest,
          marketCapRank: row.market_cap_rank,
        };
      })
      .filter((item) =>
        item.symbol.toLowerCase().includes(query.trim().toLowerCase()),
      )
      .filter((item) => !favoritesOnly || favorites.includes(item.symbol));

    mapped.sort((left, right) => {
      if (sortMode === "marketCap") {
        const leftRank = left.marketCapRank ?? Number.MAX_SAFE_INTEGER;
        const rightRank = right.marketCapRank ?? Number.MAX_SAFE_INTEGER;
        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }
      }
      if (sortMode === "average") return right.average - left.average;
      if (sortMode === "spread") return right.spread - left.spread;
      if (sortMode === "highest") return right.highest - left.highest;
      return left.symbol.localeCompare(right.symbol);
    });

    return mapped;
  }, [
    favorites,
    favoritesOnly,
    query,
    showNextFunding,
    snapshot,
    sortMode,
    visibleExchanges,
  ]);

  return (
    <section className="dashboard-panel">
      <div className="toolbar">
        <input
          className="search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search symbol"
        />
        <select
          className="toolbar-select"
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
        >
          <option value="marketCap">Sort: Market Cap</option>
          <option value="symbol">Sort: Symbol</option>
          <option value="average">Sort: Average Funding</option>
          <option value="spread">Sort: Exchange Spread</option>
          <option value="highest">Sort: Highest Funding</option>
        </select>
        <button
          className={`toolbar-button ${showNextFunding ? "active" : ""}`}
          onClick={() => onShowNextFundingChange(!showNextFunding)}
          type="button"
        >
          {showNextFunding ? "Predicted" : "Current"}
        </button>
        <button
          className={`toolbar-button ${favoritesOnly ? "active" : ""}`}
          onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
          type="button"
        >
          Favorites
        </button>
      </div>

      <div className="exchange-toggle-row">
        {snapshot?.exchanges.map((exchange) => (
          <button
            key={exchange.exchange}
            className={`exchange-chip ${
              enabledExchanges.includes(exchange.exchange) ? "active" : ""
            }`}
            onClick={() =>
              setEnabledExchanges((current) =>
                current.includes(exchange.exchange)
                  ? current.filter((item) => item !== exchange.exchange)
                  : [...current, exchange.exchange],
              )
            }
            type="button"
          >
            {exchange.label}
            <span className={`exchange-status ${exchange.status}`} />
          </button>
        ))}
      </div>

      <div className="status-row">
        <span>{loading ? "Loading market data..." : `Updated ${formatTime(snapshot?.updated_at)}`}</span>
        {error ? <span className="status-error">{error}</span> : null}
      </div>

      <div className="heatmap-wrap">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th>Symbol</th>
              {visibleExchanges.map((exchange) => (
                <th key={exchange.exchange}>{exchange.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ row, symbol }) => (
              <tr key={symbol}>
                <td>
                  <button
                    className={`favorite-toggle ${favorites.includes(symbol) ? "active" : ""}`}
                    onClick={() => toggleFavorite(symbol)}
                    type="button"
                    aria-label={
                      favorites.includes(symbol)
                        ? `Remove ${symbol} from favorites`
                        : `Add ${symbol} to favorites`
                    }
                  >
                    {favorites.includes(symbol) ? "*" : "+"}
                  </button>
                  <span className="symbol-wrap">
                    <span className="symbol-label">{symbol}</span>
                    <span className="symbol-meta">{formatRank(row)}</span>
                  </span>
                </td>
                {visibleExchanges.map((exchange) => {
                  const entry = row.entries[exchange.exchange];
                  const value = showNextFunding
                    ? entry?.funding_rate_next
                    : entry?.funding_rate_current;
                  return (
                    <td key={`${symbol}-${exchange.exchange}`}>
                      {entry ? (
                        <div className={`funding-cell ${colorClass(value)}`}>
                          <strong>{formatFunding(value)}</strong>
                          <span>{entry.native_symbol}</span>
                        </div>
                      ) : (
                        <div className="funding-cell funding-empty">
                          <strong>-</strong>
                          <span>n/a</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatFunding(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${(value * 100).toFixed(4)}%`;
}

function formatTime(value: string | undefined) {
  if (!value) {
    return "waiting for first snapshot";
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatRank(row: SnapshotRow) {
  if (row.market_cap_rank === null) {
    return "Unranked";
  }
  return `MCap #${row.market_cap_rank}`;
}

function colorClass(value: number | null | undefined) {
  if (value === null || value === undefined) return "neutral";
  if (value >= 0.00015) return "strong-positive";
  if (value > 0) return "positive";
  if (value <= -0.00015) return "strong-negative";
  if (value < 0) return "negative";
  return "neutral";
}
