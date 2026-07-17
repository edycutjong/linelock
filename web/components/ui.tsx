import type { LedgerRow } from '../lib/types';

export function pct(x: number, dp = 1): string {
  const v = (x * 100).toFixed(dp);
  return `${x >= 0 ? '+' : ''}${v}%`;
}

export function CLVBadge({ value }: { value: number }) {
  const pos = value > 0;
  return <span className={`clv ${pos ? 'pos' : 'neg'}`}>{pct(value)}{pos ? ' ✓' : ''}</span>;
}

export function StakeBadge({ tier, name, units }: { tier: number; name: string; units: number }) {
  const cls = tier === 3 ? 'banker' : tier === 2 ? 'value' : 'probe';
  return (
    <span className={`badge ${cls}`}>
      R{tier} · {units}U · {name}
    </span>
  );
}

export function ReceiptChip({ row }: { row: LedgerRow }) {
  const short = `${row.receipt_tx.slice(0, 6)}…${row.receipt_tx.slice(-4)}`;
  if (row.is_placeholder) {
    return (
      <span className="chip seed" title="Seed row — synthetic receipt, not on-chain">
        {short} <span className="badge seed">seed</span>
      </span>
    );
  }
  return (
    <a className="chip" href={row.receipt_explorer ?? '#'} target="_blank" rel="noreferrer" title="View on Blockscout">
      {short} <span aria-hidden>&#8599;</span>
    </a>
  );
}

export function KickoffDelta({ row }: { row: LedgerRow }) {
  const d = row.pre_kickoff;
  if (!d) return null;
  return (
    <span className="badge pre" title={`receipt block time was ${d.human} before kickoff`}>
      {d.human} pre-KO
    </span>
  );
}

export function OddsMove({ entry, closing }: { entry: number; closing: number }) {
  return (
    <span className="odds-move">
      {entry.toFixed(2)} <span className="arrow" aria-hidden>&rarr;</span> {closing.toFixed(2)}
    </span>
  );
}

export function ResultMark({ result }: { result: LedgerRow['result'] }) {
  if (result === 'win') return <span className="result-win">&#10003; win</span>;
  if (result === 'loss') return <span className="result-loss">&#10007; loss</span>;
  if (result === 'pending') return <span className="result-pending">&#9679; pending</span>;
  return <span className="muted">void</span>;
}
