import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRowByHash } from '../../../lib/ledger';
import { HashVerify } from '../../../components/HashVerify';
import { CLVBadge, StakeBadge, ResultMark, ReceiptChip, pct } from '../../../components/ui';

export const dynamic = 'force-dynamic';

export default async function PickAudit({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const row = await getRowByHash(hash);
  if (!row) notFound();

  const pick = JSON.parse(row.raw_json);
  const delta = row.pre_kickoff;

  return (
    <>
      <p style={{ marginTop: 18 }}><Link href="/" className="mono muted" style={{ textDecoration: 'none' }}>&larr; ledger</Link></p>
      <h1 className="section-title" style={{ marginTop: 6 }}>{row.fixture} · <span style={{ color: 'var(--primary)' }}>{row.side_label}</span></h1>

      <div className="grid3">
        <div className="card stat"><div className="label">Result</div><div className="value" style={{ fontSize: 26 }}><ResultMark result={row.result} /></div></div>
        <div className="card stat"><div className="label">CLV vs close</div><div className="value" style={{ fontSize: 26 }}><CLVBadge value={row.clv_pct} /></div></div>
        <div className="card stat"><div className="label">Stake rung</div><div className="value" style={{ fontSize: 20, marginTop: 4 }}><StakeBadge tier={row.stake_tier} name={row.stake_name} units={row.stake_units} /></div></div>
      </div>

      {/* Pre-kickoff timeline (I1) */}
      <h2 className="section-title">Receipt predates kickoff (I1)</h2>
      <div className="card panel">
        <div className="kv"><span className="k">receipt block time</span><span className="v mono">{row.receipt_block_time}</span></div>
        <div className="kv"><span className="k">kickoff (UTC)</span><span className="v mono">{row.kickoff_utc}</span></div>
        <div className="kv"><span className="k">delta</span><span className="v" style={{ color: 'var(--color-success)' }}>paid {delta?.human} before kickoff {delta?.valid ? '✓' : '✗'}</span></div>
        <div style={{ marginTop: 12, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, var(--color-success), var(--accent))', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 0, top: 12, fontSize: 11 }} className="mono muted">receipt</span>
          <span style={{ position: 'absolute', right: 0, top: 12, fontSize: 11 }} className="mono muted">kickoff</span>
        </div>
      </div>

      {/* Hash verify (I2) */}
      <h2 className="section-title">Pick-hash re-verify (I2)</h2>
      <div className="card panel">
        <HashVerify rawJson={row.raw_json} expected={row.pick_hash} />
      </div>

      {/* Closing line trail (I4) */}
      <h2 className="section-title">Closing-line trail (I4)</h2>
      <div className="card panel">
        <div className="kv"><span className="k">entry odds (sold)</span><span className="v mono">{row.entry_odds.toFixed(2)} · implied {(row.market_implied_prob * 100).toFixed(1)}%</span></div>
        <div className="kv"><span className="k">closing odds (last snapshot ≤ KO)</span><span className="v mono">{row.closing_odds.toFixed(2)} · implied {((1 / row.closing_odds) * 100).toFixed(1)}%</span></div>
        <div className="kv"><span className="k">model probability</span><span className="v mono">{(row.model_prob * 100).toFixed(0)}%</span></div>
        <div className="kv"><span className="k">edge at entry</span><span className="v mono">{pct(row.edge_pct)}</span></div>
        <div className="kv"><span className="k">CLV (relative)</span><span className="v mono">{pct(row.clv_pct)} · {(row.clv_prob_points * 100).toFixed(2)} pts</span></div>
      </div>

      {/* Receipt + raw JSON */}
      <h2 className="section-title">Receipt &amp; served JSON</h2>
      <div className="card panel">
        <div className="kv"><span className="k">receipt</span><span className="v"><ReceiptChip row={row} /></span></div>
        <div className="kv"><span className="k">placeholder</span><span className="v">{String(row.is_placeholder)}{row.is_placeholder ? ' (synthetic — not on-chain)' : ''}</span></div>
        <pre className="codeblock" style={{ marginTop: 12 }}>{JSON.stringify(pick, null, 2)}</pre>
      </div>
    </>
  );
}
