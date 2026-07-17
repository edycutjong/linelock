'use client';
import { useState } from 'react';
import type { PickPreview } from '../lib/pick';

interface Quote { amount_usdc: number; network: string; asset: string; payTo: string }
type Phase = 'sealed' | 'quote' | 'signing' | 'revealed';

export function PayReveal({ pick, quote }: { pick: PickPreview; quote: Quote }) {
  const [phase, setPhase] = useState<Phase>('sealed');

  const kickoff = new Date(pick.kickoff_utc).toUTCString();

  return (
    <section className="card active next-pick" style={{ marginBottom: 8 }}>
      <div className="stripe energy-strip" />
      {phase === 'sealed' && (
        <div className="next-row">
          <div>
            <div className="tag">🔒 NEXT PICK · {pick.stage} · LOCKED</div>
            <div className="headline">
              {pick.fixture.replace(/^[A-Z0-9]+:\s*/, '')} &nbsp;
              <span className="redact">████</span> @ <span className="redact">█.██</span> · rung{' '}
              <span className="redact">█</span>
            </div>
            <div className="muted small mono">Intel requires an active x402 clearance. Kickoff {kickoff}.</div>
          </div>
          <button className="btn btn-primary" onClick={() => setPhase('quote')}>
            Pay {quote.amount_usdc} USDC via x402
          </button>
        </div>
      )}

      {phase === 'quote' && (
        <div>
          <div className="tag">HTTP 402 · PAYMENT REQUIRED</div>
          <div className="grid2" style={{ marginTop: 6 }}>
            <div className="kv"><span className="k">amount</span><span className="v">{quote.amount_usdc} USDC ({(quote.amount_usdc * 1e6).toFixed(0)} units)</span></div>
            <div className="kv"><span className="k">network</span><span className="v">{quote.network} (Injective EVM)</span></div>
            <div className="kv"><span className="k">asset</span><span className="v">{quote.asset.slice(0, 10)}…{quote.asset.slice(-6)}</span></div>
            <div className="kv"><span className="k">payTo</span><span className="v">{quote.payTo.slice(0, 10)}…{quote.payTo.slice(-6)}</span></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button className="btn btn-primary" onClick={() => { setPhase('signing'); setTimeout(() => setPhase('revealed'), 900); }}>
              Sign &amp; submit (EIP-3009)
            </button>
            <button className="btn btn-ghost" onClick={() => setPhase('sealed')}>Cancel</button>
          </div>
          <p className="muted tiny mono" style={{ marginTop: 12 }}>
            This is a UI preview of the flow. A real paid call uses createInjectiveClient().fetch() and
            needs a gassed wallet holding USDC on Injective — see Verify → funding status.
          </p>
        </div>
      )}

      {phase === 'signing' && (
        <div className="next-row">
          <div className="tag">✍️ SIGNING EIP-3009 AUTHORIZATION…</div>
          <div className="muted mono small">Submitting to facilitator · 650ms finality</div>
        </div>
      )}

      {phase === 'revealed' && (
        <div>
          <div className="tag" style={{ color: 'var(--accent)' }}>✓ REVEALED · receipt = pre-kickoff timestamp</div>
          <div className="headline">{pick.fixture} · <span style={{ color: 'var(--primary)' }}>{pick.side_label}</span></div>
          <div className="grid3" style={{ marginTop: 10 }}>
            <div className="kv"><span className="k">model</span><span className="v">{(pick.model_prob * 100).toFixed(0)}%</span></div>
            <div className="kv"><span className="k">mkt implied</span><span className="v">{(pick.market_implied_prob * 100).toFixed(0)}%</span></div>
            <div className="kv"><span className="k">edge</span><span className="v" style={{ color: 'var(--accent)' }}>+{(pick.edge_pct * 100).toFixed(1)}%</span></div>
          </div>
          <div className="rungs" style={{ marginTop: 12 }}>
            {pick.ladder.map((r) => (
              <div key={r.tier} className={`rung ${r.tier === pick.recommended_tier ? 'rec' : ''}`}>
                <span className="num">{r.tier}</span>
                <span className="rname">{r.name}{r.tier === pick.recommended_tier ? ' · recommended' : ''}</span>
                <span className="stake">{r.stake_units}U</span>
              </div>
            ))}
          </div>
          <p className="note" style={{ marginTop: 14 }}>
            The x402 USDC receipt tx would land here with block time &lt; kickoff — that IS the proof the
            pick predates the match. After settlement it becomes the next public ledger row.
          </p>
          <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => setPhase('sealed')}>Reset</button>
        </div>
      )}
    </section>
  );
}
