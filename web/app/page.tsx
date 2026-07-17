import Link from 'next/link';
import { getLedger, getVerify } from '../lib/ledger';
import { getNextPickPreview } from '../lib/pick';
import { PayReveal } from '../components/PayReveal';
import { CLVBadge, StakeBadge, ReceiptChip, KickoffDelta, OddsMove, ResultMark, pct } from '../components/ui';

export const dynamic = 'force-dynamic';

export default async function LedgerHome() {
  const [{ data, source }, verify, pick] = await Promise.all([getLedger(), getVerify(), Promise.resolve(getNextPickPreview())]);
  const s = data.stats;

  return (
    <>
      <div className="pill-row" style={{ marginTop: 18 }}>
        <span className="pill">Injective x402</span>
        <span className="pill">USDC CCTP</span>
        <span className="pill">MCP Server</span>
        <span className="pill">Agent Skills</span>
        <span className="pill">EVM contract</span>
        <span className="pill" style={{ color: 'var(--accent)' }}>data: {source}</span>
      </div>

      <h1 className="section-title" style={{ fontSize: 30, marginTop: 20 }}>
        Every tipster shows you screenshots. <span style={{ color: 'var(--primary)' }}>LineLock shows you receipts.</span>
      </h1>
      <p className="muted" style={{ maxWidth: 720, marginTop: -4 }}>
        Buy the next World Cup knockout edge for {data.price_usdc} USDC via Injective x402 — the receipt
        timestamps it before kickoff. Audit every past pick for free below: entry vs closing line, CLV,
        result. Losses kept public on purpose.
      </p>

      {/* Hero stats */}
      <section className="hero-grid">
        <div className="card stat"><div className="stripe energy-strip" /><div className="label">Record (settled)</div><div className="value">{s.wins}–{s.losses}{s.voids ? `–${s.voids}` : ''} <small>{(s.win_rate * 100).toFixed(0)}% W</small></div></div>
        <div className="card stat"><div className="stripe energy-strip" /><div className="label">ROI</div><div className="value pink">{pct(s.roi_pct)}</div></div>
        <div className="card stat"><div className="stripe energy-strip" /><div className="label">Avg CLV · beat-close</div><div className="value gold">{pct(s.avg_clv_pct, 2)} <small>{(s.beat_close_rate * 100).toFixed(0)}% beat</small></div></div>
      </section>

      {/* Next pick — the sealed row + x402 flow */}
      <PayReveal pick={pick} quote={verify.quote} />

      {/* Settled ledger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="section-title">Settled Ledger</h2>
        <span className="muted mono tiny">
          {s.total_sold} calls sold · {s.total_revenue_usdc} USDC · I3 rows==receipts:{' '}
          {data.invariants?.I3_rows_equal_receipts ? '✓' : '✗'}
        </span>
      </div>

      <section className="card ledger">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Fixture</th><th>Side</th><th>Odds (E → C)</th><th>Stake</th><th>Result</th><th>CLV</th><th>Proof</th><th>Receipt</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} className={r.is_placeholder ? 'placeholder' : ''}>
                <td>
                  <Link href={`/pick/${r.pick_hash}`} className="fixture-link">{r.fixture}</Link>
                </td>
                <td className="muted">{r.side_label}</td>
                <td><OddsMove entry={r.entry_odds} closing={r.closing_odds} /></td>
                <td><StakeBadge tier={r.stake_tier} name={r.stake_name} units={r.stake_units} /></td>
                <td><ResultMark result={r.result} /></td>
                <td><CLVBadge value={r.clv_pct} /></td>
                <td><KickoffDelta row={r} /></td>
                <td><ReceiptChip row={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="note warn" style={{ marginTop: 16 }}>
        {data.disclaimer} Real paid receipts (is_placeholder=false) appear here once the ops wallet is
        funded — see <Link href="/verify" style={{ color: 'var(--accent)' }}>Verify</Link>.
      </p>

      <footer className="footer">
        <span>{data.attribution}</span>
        <span>LineLock · Injective Global Cup · {data.active_network}</span>
      </footer>
    </>
  );
}
