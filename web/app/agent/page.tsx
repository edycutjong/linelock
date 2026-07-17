import { getNextPickPreview } from '../../lib/pick';

export const dynamic = 'force-dynamic';

export default function AgentView() {
  const pick = getNextPickPreview();
  return (
    <>
      <h1 className="section-title" style={{ marginTop: 22 }}>Agent view · same API, no API keys</h1>
      <p className="muted" style={{ maxWidth: 720, marginTop: -4 }}>
        The <span className="mono">worldcup-linelock</span> Agent Skill turns any harness into a buyer:
        check USDC via the Injective MCP server, pay the x402 quote, validate the pick hash, read the free
        ledger. No accounts, no API keys — the payment IS the auth.
      </p>

      <div className="grid2" style={{ marginTop: 18 }}>
        <div className="terminal">
          <div className="dim"># Claude Code · skill: worldcup-linelock</div>
          <div><span className="prompt">agent&gt;</span> mcp injective account_balances --address 0x95Dd…aAaA2</div>
          <div className="dim">  USDC (Injective): 0.42  ·  INJ gas: 0.31  → ok to buy</div>
          <div><span className="prompt">agent&gt;</span> curl -i -X POST $LINELOCK_API/api/edge</div>
          <div className="dim">  ← HTTP 402  ·  PAYMENT-REQUIRED present</div>
          <div className="dim">  accepts[0] = eip155:1776 · 50000 units USDC · payTo 0x4507…D0e3</div>
          <div><span className="prompt">agent&gt;</span> createInjectiveClient().fetch(...)  <span className="dim"># signs EIP-3009</span></div>
          <div className="ok">  ✓ PAYMENT-RESPONSE · tx 0x… · 650ms · block time &lt; kickoff</div>
          <div><span className="prompt">agent&gt;</span> verify sha256(pick) == pick_hash</div>
          <div className="ok">  ✓ hash match — pick untampered</div>
          <div><span className="prompt">agent&gt;</span> pick:</div>
          <div className="gold">  {pick.side_label} · model {(pick.model_prob * 100).toFixed(0)}% · edge +{(pick.edge_pct * 100).toFixed(1)}% · rung {pick.recommended_tier} ({pick.ladder.find((r) => r.tier === pick.recommended_tier)?.stake_units}U)</div>
          <div className="dim">  (funded run — the demo wallet here is unfunded; see Verify)</div>
        </div>

        <div className="card panel">
          <div className="label" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)', marginBottom: 8 }}>the same purchase, human side</div>
          <div className="headline" style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>{pick.fixture}</div>
          <div className="kv"><span className="k">side</span><span className="v">{pick.side_label}</span></div>
          <div className="kv"><span className="k">model / implied</span><span className="v">{(pick.model_prob * 100).toFixed(0)}% / {(pick.market_implied_prob * 100).toFixed(0)}%</span></div>
          <div className="kv"><span className="k">edge</span><span className="v" style={{ color: 'var(--accent)' }}>+{(pick.edge_pct * 100).toFixed(1)}%</span></div>
          <div className="kv"><span className="k">recommended rung</span><span className="v">R{pick.recommended_tier} · {pick.ladder.find((r) => r.tier === pick.recommended_tier)?.stake_units}U</span></div>
          <p className="note" style={{ marginTop: 12 }}>Install: <span className="mono">npx skills add https://github.com/&lt;user&gt;/linelock --skill worldcup-linelock</span></p>
        </div>
      </div>

      <h2 className="section-title">What the skill does</h2>
      <div className="card panel">
        <div className="kv"><span className="k">1 · balance</span><span className="v">MCP account_balances + usdc_native_info</span></div>
        <div className="kv"><span className="k">2 · pay</span><span className="v">createInjectiveClient().fetch() → EIP-3009 → PAYMENT-RESPONSE receipt</span></div>
        <div className="kv"><span className="k">3 · validate</span><span className="v">re-hash served pick == pick_hash (I2)</span></div>
        <div className="kv"><span className="k">4 · audit</span><span className="v">GET /api/ledger → trailing avg CLV before trusting a pick</span></div>
      </div>
    </>
  );
}
