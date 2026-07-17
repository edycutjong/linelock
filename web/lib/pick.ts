import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export interface Rung { tier: number; name: string; stake_units: number; rationale: string }
export interface PickPreview {
  fixture: string; stage: string; kickoff_utc: string; side_label: string;
  model_prob: number; market_odds: number; market_implied_prob: number;
  edge_pct: number; ev_pct: number; recommended_tier: number; ladder: Rung[];
}

/** Mirror of the engine's edge + ladder (kept tiny so web stays standalone). */
function recommendTier(edge: number, prob: number): number {
  if (prob >= 0.62 && edge >= 0.05) return 3;
  if (edge >= 0.08) return 2;
  if (edge >= 0.03) return 1;
  return 0;
}
const RUNGS = [
  { tier: 1, name: 'probe', stake_units: 2 },
  { tier: 2, name: 'value', stake_units: 5 },
  { tier: 3, name: 'banker', stake_units: 8 },
];

/** Read the sealed next pick and compute what a paid call would reveal. */
export function getNextPickPreview(): PickPreview {
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), '..', 'fixtures', 'next-pick.json'), 'utf8'),
  );
  const implied = 1 / raw.market_odds;
  const edge = raw.model_prob - implied;
  const ev = raw.model_prob * raw.market_odds - 1;
  const rec = recommendTier(edge, raw.model_prob);
  const ladder: Rung[] = RUNGS.map((r) => ({
    ...r,
    rationale:
      r.tier === rec
        ? 'Recommended for this edge.'
        : r.tier === 3
          ? 'Max sizing — reserved for short-priced high-confidence spots.'
          : r.tier === 2
            ? 'Standard value stake at ≥8% edge.'
            : 'Probe stake for thin edges.',
  }));
  return {
    fixture: raw.fixture, stage: raw.stage, kickoff_utc: raw.kickoff_utc,
    side_label: raw.side_label, model_prob: raw.model_prob, market_odds: raw.market_odds,
    market_implied_prob: Math.round(implied * 1e4) / 1e4,
    edge_pct: Math.round(edge * 1e4) / 1e4,
    ev_pct: Math.round(ev * 1e4) / 1e4,
    recommended_tier: rec, ladder,
  };
}
