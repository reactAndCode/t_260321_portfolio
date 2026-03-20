export type ExchangeStatus = "ok" | "degraded";

export type FundingEntry = {
  exchange: string;
  exchange_label: string;
  symbol: string;
  native_symbol: string;
  base_asset: string;
  quote_asset: string;
  market_type: "perpetual";
  funding_rate_current: number | null;
  funding_rate_next: number | null;
  funding_time_next: string | null;
  updated_at: string;
  status: ExchangeStatus;
  source_latency_ms: number | null;
};

export type SnapshotRow = {
  symbol: string;
  market_cap_rank: number | null;
  market_cap_usd: number | null;
  entries: Record<string, FundingEntry>;
};

export type SpreadLeader = {
  symbol: string;
  market_cap_rank: number | null;
  market_cap_usd: number | null;
  spread_current: number | null;
  spread_next: number | null;
  exchange_count: number;
};

export type ExchangeHealth = {
  exchange: string;
  label: string;
  status: ExchangeStatus;
  message: string | null;
  updated_at: string | null;
  symbols_loaded: number;
};

export type SnapshotResponse = {
  updated_at: string;
  exchanges: ExchangeHealth[];
  rows: SnapshotRow[];
  top_spread_current: SpreadLeader[];
  top_spread_next: SpreadLeader[];
};
