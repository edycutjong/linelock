# DEMO — LineLock

A ≤3-minute demo you can run **today with zero funds** — the whole wow beat is live and self-verifying —
plus the exact steps that unblock the funded on-chain path.

> One line: *pay-per-pick World Cup edge API on Injective x402 where the USDC receipt IS the pre-kickoff
> timestamp; a free public ledger CLV-scores every settled pick, losses included.*

---

## ⭐ The magic-moment beat (the "oh") — no funds, ~25 seconds

**The same `POST /api/edge` is `402` without payment and `200` with the edge — and the `200` publishes its
own losing prices. Then the judge recomputes the entire track record from scratch and it checks.**

Everything below is real and runnable now; **nothing here depends on a live paid on-chain tx.**

```bash
# (0:18) hit the paywall — no key, no login, no funds
npm run api &                                        # Express API on :8402 (x402 gate ON)
curl -i -X POST http://localhost:8402/api/edge       # → HTTP 402 · PAYMENT-REQUIRED · accepts[]
#   the API's answer to an unpaid call is literally "pay me": 0.05 USDC on eip155:1776.

# (0:35) see the ACTUAL paid 200 payload — still no funds (gate disabled, honestly labeled)
kill %1 2>/dev/null                                  # stop the gated server first (same port)
npm run api -- --demo &                              # same API, x402 gate DISABLED
curl -s -X POST http://localhost:8402/api/edge       # → HTTP 200: the real edge payload
```

The `200` is the exact thing a buyer gets for five cents — rendered without funds because `--demo`
disables the gate (and it says so: `receipt` is `null`, `note` = *"Demo/unsettled response"*). Real
captured output:

```jsonc
{
  "side_label": "France to advance",
  "model_prob": 0.58, "edge_pct": 0.0922, "recommended_tier": 2,
  "ladder": [ /* 4 conviction rungs: pass · probe · value · banker */ ],
  "pick_hash": "f7ad4164…588c22",
  "similar_settled": [
    { "fixture": "FRA vs AUS", "edge_pct": 0.0922, "result": "win", "clv_pct":  0.0904 },
    { "fixture": "ENG vs SUI", "edge_pct": 0.0895, "result": "win", "clv_pct":  0.0756 },
    { "fixture": "CRO vs CAN", "edge_pct": 0.0852, "result": "win", "clv_pct": -0.0612 }
  ],
  "receipt": null,
  "note": "Demo/unsettled response (no on-chain receipt bound)."
}
```

Point at **`CRO vs CAN — win, CLV −6.1%`**: *"That's a pick I won and still flag as a bad price. The
`similar_settled` strip is drawn from my own settled ledger, losses and negative-CLV wins included. The
`receipt` field is where the USDC tx lands — its block time is the pre-kickoff proof (invariant I1)."*

```bash
# (0:55) recompute the entire track record from scratch — no funds, no trust
npm run audit -- --all         # re-hashes every pick (I2), re-checks every block-time<kickoff (I1),
                               # recomputes every daily Merkle root (I5)  → "✓ LEDGER PASSES INDEPENDENT AUDIT"
```

That is the "oh": in ~25 seconds and with **zero funds**, a skeptical judge hits the paywall, sees the real
edge payload, and independently recomputes the whole ledger — losses included. The hard part (the payment
gate + the hash/Merkle notarization + the CLV accountability) is *witnessed*, not asserted.

---

## Full ≤3:00 script

### 0. Setup (30s)
```bash
npm install
npm run settle          # builds the 24-row CLV ledger → fixtures/ledger-state.json
npm run api             # API on http://localhost:8402
# in another shell:
cd web && npm install && npm run dev     # site on http://localhost:3402
```

### 1. Hook — the ledger, not a screenshot (0:00–0:18)
Open **http://localhost:3402**. Hero: record **15–9 · +24.2% ROI · +2.9% avg CLV**. Scroll the settled
table — every row has entry→closing odds, a CLV badge, a "pre-KO" delta, and a receipt chip.
Say: *"Every tipster shows screenshots. This is a ledger — and the losses are kept on purpose."*

### 2. The magic-moment beat (0:18–1:05)
Run the **402 → `--demo` 200 → audit** sequence above. This is the centrepiece — do it in the terminal so
the judge sees the paywall, the real payload, and the recomputation with their own eyes.

### 3. Audit a settled pick in the browser (1:05–1:40)
Back on the site, click any ledger row → the **audit page**: the receipt-predates-kickoff timeline ("paid
40h before kickoff ✓" — I1), the **in-browser** sha256 re-verify of the served pick (I2 MATCH ✓), the
closing-line trail (I4), and the raw JSON. Show a **losing** row that still has **positive CLV**: *"This
bet was right and lost — CLV proves the edge was real."*

> Honesty note to say out loud: the 24 seed rows are labeled `is_placeholder: true` with synthetic receipt
> hashes — the *engine, hashes, Merkle roots, and CLV math are real and identical to what live rows use*;
> only the receipt tx and match outcomes are seeded until the wallet is funded. Nothing is presented as an
> on-chain settlement that isn't one.

### 4. Agent view (1:40–2:05)
Open **/agent** — the `worldcup-linelock` Skill transcript (MCP `account_balances` → 402 → pay → validate
hash) beside the human UI. *"Same API, no API keys — the agent pays per call; the payment IS the auth."*
(The transcript is an illustrative preview of the funded call, labeled as such.)

### 5. Verify / judge panel (2:05–2:35)
Open **/verify** — the live x402 quote, `usdc_native_info` (MCP), the CCTP flow, the bench tiles, and the
"reproduce me" curl block. Read the funding-status banner out loud — don't hide it.

### 6. Close (2:35–3:00)
*"Buy the next pick for five cents. Audit every past pick for free."* Show the README **"Injective
technologies used"** section — x402 · MCP · Agent Skills · CCTP (+ the EVM anchor), each with its code home.

---

## What the judge witnesses now vs. what is honestly deferred

| Capability | Witnessable now (no funds)? | How |
|---|---|---|
| x402 paywall (real middleware) | ✅ | `curl -i -X POST /api/edge` → 402 + `accepts[]` |
| The paid 200 edge payload (edge · ladder · similar_settled) | ✅ | `npm run api -- --demo` → 200, `receipt:null` labeled |
| CLV ledger + pre-kickoff delta + losses kept | ✅ | site + `GET /api/ledger` |
| Independent re-audit (hash · block-time · Merkle) | ✅ | `npm run audit -- --all` → "LEDGER PASSES" |
| In-browser sha256 re-verify (I2) | ✅ | click a ledger row → audit page |
| **Real on-chain paid receipt** (block time < kickoff) | ⛔ funds-gated | `scripts/paid-call-smoke.ts` — refuses to fake; pays + prints tx when funded |
| **CCTP mint** (Base USDC → Injective) | ⛔ funds-gated | MCP `cctp_*`; ~2 USDC on Base + gas |
| **On-chain `LedgerAnchor` root** (I5 on-chain) | ⛔ funds-gated | `contracts/DEPLOY.md`; ~0.3 INJ gas |

> Seed ledger rows are `is_placeholder: true` with synthetic receipt hashes (not on-chain). The `--demo`
> 200 returns `receipt: null`. No placeholder is ever presented as a real settlement.

**User steps: DONE.** The site is **LIVE: https://linelock.edycu.dev/** (API: https://api.linelock.edycu.dev),
and the ≤3:00 demo video is **DONE: https://youtu.be/MHHYIJkLRbo** (zero-funds cut). Still honestly
pending (funds-gated, never faked): the first real on-chain receipt and the LedgerAnchor mainnet deploy.

---

## Funded path (run when the wallet is gassed — see STATUS.md)

```bash
# preflight is safe with no funds; it refuses to fake a receipt
npx tsx scripts/paid-call-smoke.ts

# once funded (INJ gas + USDC on Injective):
#   → createInjectiveClient().fetch() pays 0.05 USDC,
#   → prints the receipt tx + https://blockscout.injective.network/tx/<tx>,
#   → POST /api/edge binds pick_hash → receipt as the first real (non-placeholder) ledger row.
```

### CCTP funding (Base → Injective)
1. Ensure ~2 USDC + gas on Base. 2. Burn via TokenMessengerV2 `0x28b5…cf5d` (source domain 6). 3. Poll
`iris-api.circle.com` for the attestation. 4. `cctp_mint` on Injective (MCP `cctp_*` tools). 5. ~0.3 INJ
for gas. Record both explorer links.

### On-chain LedgerAnchor (I5, funds-gated)
`npm run anchor` → deploy `contracts/LedgerAnchor.sol` (via the `injective-evm-developer` skill) →
`postAnchor(day_number, merkleRoot, count)` → `npx tsx scripts/anchor.ts --onchain <YYYY-MM-DD> <tx>`.
`npm run audit -- --all` then shows `MATCHES chain ✓`.
