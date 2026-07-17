export interface LedgerRow {
  id: string;
  fixture: string;
  competition: string;
  kickoff_utc: string;
  side: string;
  side_label: string;
  entry_odds: number;
  closing_odds: number;
  model_prob: number;
  market_implied_prob: number;
  edge_pct: number;
  stake_tier: number;
  stake_name: string;
  stake_units: number;
  result: 'win' | 'loss' | 'void' | 'pending';
  clv_pct: number;
  clv_prob_points: number;
  pick_hash: string;
  receipt_tx: string;
  receipt_block_time: string;
  sold_count: number;
  revenue_usdc: number;
  settled_at: string;
  is_placeholder: boolean;
  raw_json: string;
  pre_kickoff?: { hours: number; human: string; valid: boolean };
  receipt_explorer?: string | null;
}

export interface LedgerStats {
  wins: number; losses: number; voids: number; settled: number;
  win_rate: number; total_staked_units: number; total_profit_units: number;
  roi_pct: number; avg_clv_pct: number; beat_close_rate: number;
  total_sold: number; total_revenue_usdc: number;
  banker_count: number; value_count: number; probe_count: number;
}

export interface LedgerResponse {
  price_usdc: number;
  active_network: string;
  attribution: string;
  disclaimer?: string;
  stats: LedgerStats;
  rows: LedgerRow[];
  invariants?: { I3_rows_equal_receipts: boolean; row_count: number; receipt_count: number };
}

export const EXPLORER = 'https://blockscout.injective.network';
