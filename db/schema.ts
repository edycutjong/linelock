/**
 * SQLite schema for the LineLock public ledger.
 *
 * One table, `picks`, is the ledger. Every PAID pick becomes exactly one row
 * (invariant I3 — losses included), keyed by its receipt tx. Idempotent:
 * settle.ts rebuilds the same rows on every run.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS picks (
  id                  TEXT PRIMARY KEY,
  fixture             TEXT    NOT NULL,
  competition         TEXT    NOT NULL,
  stage               TEXT,
  kickoff_utc         TEXT    NOT NULL,
  side                TEXT    NOT NULL,
  side_label          TEXT    NOT NULL,
  model_prob          REAL    NOT NULL,
  entry_odds          REAL    NOT NULL,
  closing_odds        REAL    NOT NULL,
  market_implied_prob REAL    NOT NULL,
  edge_pct            REAL    NOT NULL,
  ev_pct              REAL    NOT NULL,
  stake_tier          INTEGER NOT NULL,
  stake_name          TEXT    NOT NULL,
  stake_units         REAL    NOT NULL,
  result              TEXT    NOT NULL,   -- win | loss | void | pending
  clv_pct             REAL    NOT NULL,   -- relative headline CLV (entry/closing - 1)
  clv_prob_points     REAL    NOT NULL,   -- implied(closing) - implied(entry)
  pick_hash           TEXT    NOT NULL,   -- sha256(canonical pick JSON) — I2
  receipt_tx          TEXT    NOT NULL,   -- x402 payment tx (or synthetic placeholder)
  receipt_block_time  TEXT    NOT NULL,   -- must be < kickoff_utc — I1
  sold_count          INTEGER NOT NULL DEFAULT 0,
  revenue_usdc        REAL    NOT NULL DEFAULT 0,
  settled_at          TEXT    NOT NULL,
  is_placeholder      INTEGER NOT NULL DEFAULT 1,  -- 1 = seed row, no real on-chain receipt
  raw_json            TEXT    NOT NULL   -- exact served CanonicalPick JSON (re-hashable)
);

CREATE INDEX IF NOT EXISTS idx_picks_receipt ON picks(receipt_tx);
CREATE INDEX IF NOT EXISTS idx_picks_kickoff ON picks(kickoff_utc);
CREATE INDEX IF NOT EXISTS idx_picks_hash    ON picks(pick_hash);
`;
