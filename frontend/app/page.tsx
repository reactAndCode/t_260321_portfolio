"use client";

import { useMemo, useState } from "react";

import { FundingDashboard } from "../components/funding-dashboard";
import type { SpreadLeader } from "../components/types";
import { useFundingStream } from "../components/use-funding-stream";

export default function Page() {
  const { snapshot, loading, error } = useFundingStream();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showNextFunding, setShowNextFunding] = useState(false);

  const exchanges = useMemo(() => snapshot?.exchanges ?? [], [snapshot]);
  const topSpreads = useMemo(
    () =>
      showNextFunding
        ? snapshot?.top_spread_next ?? []
        : snapshot?.top_spread_current ?? [],
    [showNextFunding, snapshot],
  );

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Funding Rate Heatmap</p>
          <h1>Cross-Exchange Funding Dashboard</h1>
          <p className="hero-copy">
            Full-market perpetual coverage, market-cap-first ranking, and live
            spread monitoring across major exchanges.
          </p>
        </div>
        <div className="hero-meta">
          <div className="hero-stat">
            <span>Exchanges</span>
            <strong>{exchanges.length}</strong>
          </div>
          <div className="hero-stat">
            <span>Status</span>
            <strong>{loading ? "Syncing" : "Live"}</strong>
          </div>
          <div className="hero-stat">
            <span>Mode</span>
            <strong>{showNextFunding ? "Predicted" : "Current"}</strong>
          </div>
          <div className="hero-stat">
            <span>Symbols</span>
            <strong>{snapshot?.rows.length ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className="spread-panel">
        <div className="spread-header">
          <div>
            <p className="eyebrow">Top Spread</p>
            <h2>Funding divergence leaders</h2>
          </div>
          <p className="spread-copy">
            Largest exchange spread among symbols with at least two available
            funding values in the current view mode.
          </p>
        </div>
        <div className="spread-grid">
          {topSpreads.map((item, index) => (
            <article className="spread-card" key={item.symbol}>
              <span className="spread-rank">#{index + 1}</span>
              <strong>{item.symbol}</strong>
              <span>{formatSpread(item, showNextFunding)}</span>
              <span>{formatMeta(item)}</span>
            </article>
          ))}
          {topSpreads.length === 0 ? (
            <article className="spread-card empty">
              <strong>No spread leaders yet</strong>
              <span>Waiting for at least two exchanges per symbol.</span>
            </article>
          ) : null}
        </div>
      </section>

      <FundingDashboard
        snapshot={snapshot}
        error={error}
        loading={loading}
        favoritesOnly={favoritesOnly}
        onFavoritesOnlyChange={setFavoritesOnly}
        showNextFunding={showNextFunding}
        onShowNextFundingChange={setShowNextFunding}
      />
    </main>
  );
}

function formatSpread(item: SpreadLeader, showNextFunding: boolean) {
  const value = showNextFunding ? item.spread_next : item.spread_current;
  if (value === null || value === undefined) {
    return "-";
  }
  return `Spread ${(value * 100).toFixed(4)}%`;
}

function formatMeta(item: SpreadLeader) {
  const rank =
    item.market_cap_rank === null ? "Unranked" : `MCap #${item.market_cap_rank}`;
  return `${rank} | ${item.exchange_count} exchanges`;
}
