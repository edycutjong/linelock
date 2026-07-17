import { getVerify, getLedger } from '../../lib/ledger';

export const dynamic = 'force-dynamic';

export default async function Verify() {
  const [v, { data }] = await Promise.all([getVerify(), getLedger()]);
  const realReceipts = data.rows.filter((r) => !r.is_placeholder);

  return (
    <>
      <h1 className="section-title" style={{ marginTop: 22 }}>Verify · Judge Panel</h1>
      <p className="muted" style={{ maxWidth: 720, marginTop: -4 }}>
        Everything a reviewer needs to reproduce and audit LineLock — the live x402 quote, the USDC
        asset, the CCTP funding path, latency, and the honest funding status.
      </p>

      <div className="grid2" style={{ marginTop: 18 }}>
        <div className="card panel">
          <div className="label" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>x402 quote (POST /api/edge)</div>
          <div className="kv"><span className="k">price</span><span className="v">{v.quote.amount_usdc} USDC</span></div>
          <div className="kv"><span className="k">network</span><span className="v">{v.quote.network}</span></div>
          <div className="kv"><span className="k">asset</span><span className="v mono">{v.quote.asset}</span></div>
          <div className="kv"><span className="k">payTo</span><span className="v mono">{v.quote.payTo}</span></div>
        </div>

        <div className="card panel">
          <div className="label" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-mid)' }}>usdc_native_info (MCP)</div>
          <div className="kv"><span className="k">symbol</span><span className="v">{v.usdc.symbol}</span></div>
          <div className="kv"><span className="k">decimals</span><span className="v">{v.usdc.decimals}</span></div>
          <div className="kv"><span className="k">address</span><span className="v mono">{v.usdc.address}</span></div>
          <div className="kv"><span className="k">EIP-3009</span><span className="v">yes (Circle FiatTokenV2_2)</span></div>
        </div>
      </div>

      {/* CCTP */}
      <h2 className="section-title" id="cctp">CCTP funding · Base → Injective</h2>
      <div className="card panel">
        <div className="kv"><span className="k">version</span><span className="v">{v.cctp.version}</span></div>
        <div className="kv"><span className="k">Base source domain</span><span className="v">{v.cctp.base_source_domain}</span></div>
        <div className="kv"><span className="k">TokenMessengerV2</span><span className="v mono">{v.cctp.token_messenger_v2}</span></div>
        <div className="kv"><span className="k">flow</span><span className="v">burn on Base → Iris attest → cctp_mint on Injective</span></div>
        <p className="note warn" style={{ marginTop: 12 }}>
          Funding status: <strong>not funded yet</strong>. The ops wallet holds 13 USDC on Base but 0 INJ
          gas and 0 USDC on Injective. The burn→attest→mint hop + real paid call unblock once ~0.3 INJ +
          the CCTP mint land. No mainnet tx is claimed until it really happens.
        </p>
      </div>

      {/* Bench */}
      <h2 className="section-title">Bench (N=20)</h2>
      <div className="grid3">
        <div className="card stat"><div className="label">402-quote p50</div><div className="value gold" style={{ fontSize: 30 }}>{v.bench?.quote_ms ? `${v.bench.quote_ms.p50}ms` : 'run bench'}</div></div>
        <div className="card stat"><div className="label">402-quote p95</div><div className="value gold" style={{ fontSize: 30 }}>{v.bench?.quote_ms ? `${v.bench.quote_ms.p95}ms` : '—'}</div></div>
        <div className="card stat"><div className="label">facilitator confirm</div><div className="value" style={{ fontSize: 22, marginTop: 6 }}><span className="muted">N/A · funds-gated</span></div></div>
      </div>

      {/* Receipts feed */}
      <h2 className="section-title">Live receipts feed</h2>
      <div className="card panel">
        {realReceipts.length === 0 ? (
          <p className="muted mono small">No on-chain receipts yet — {data.rows.length} seed rows are labeled placeholder. Real receipts stream here after the first funded paid call.</p>
        ) : (
          realReceipts.slice(0, 10).map((r) => (
            <div className="kv" key={r.receipt_tx}><span className="k mono">{r.receipt_block_time}</span><span className="v mono">{r.receipt_tx}</span></div>
          ))
        )}
      </div>

      {/* Reproduce */}
      <h2 className="section-title">Reproduce me</h2>
      <pre className="codeblock">{`# 1. install + settle the ledger
npm i && npm run settle

# 2. boot the API and prove the 402 (NO funds needed)
npm run api &
curl -i -X POST http://localhost:8402/api/edge      # → HTTP 402 + x402 quote

# 3. parse the quote with the first-party client
npm run buyer                                        # prints the parsed quote

# 4. audit the whole ledger independently
npm run audit -- --all`}</pre>

      <footer className="footer"><span>{data.attribution}</span><span>reproduce in &lt; 5 min</span></footer>
    </>
  );
}
