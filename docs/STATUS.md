# STATUS — LineLock build

_Last updated: 2026-07-12. Honest accounting of what is built, what runs now, and what is blocked on
wallet funding. **No on-chain receipt or mainnet transaction is ever fabricated.**_

## TL;DR
- ✅ Full stack built and wired to the **real** `@injectivelabs/x402` package (pinned from its shipped
  `dist/*.d.ts`, verified 2026-07-12).
- ✅ **70 tests pass** (`npm test`): CLV math, edge, ladder, hashing, similar-pick lookups, invariants
  I1–I5, settle idempotency, and the live 402 handshake parsed by the SDK's own `parsePaymentRequired`.
- ✅ `curl -i -X POST /api/edge` → **HTTP 402 + a valid x402 quote**, no funds required.
- ⛔ Real mainnet money-moving (paid call, CCTP mint, on-chain anchor) is **blocked on funding** — code
  is ready and left runnable.

## Runnable RIGHT NOW (no funds)

| Capability | How | Proof |
|---|---|---|
| CLV / edge / ladder engine | `npm test` | 70 passing tests |
| Build the 24-row CLV ledger | `npm run settle` | `fixtures/ledger-state.json`, record 15–9 |
| **Live 402 quote (real middleware)** | `npm run api` + `curl -i -X POST :8402/api/edge` | HTTP 402 + `PAYMENT-REQUIRED` header + `accepts[]` |
| **Paid 200 payload without funds** | `npm run api -- --demo` + `curl -s -X POST :8402/api/edge` | HTTP 200: edge + ladder + `similar_settled` (losses incl.); self-labeled `receipt:null`, note "Demo/unsettled" |
| Parse the quote (first-party client) | `npm run buyer` | prints network/asset/amount/payTo |
| Free public ledger API | `GET /api/ledger`, `/api/receipts/:tx`, `/api/anchor/:day`, `/api/verify` | JSON, CORS-open |
| Independent ledger audit | `npm run audit -- --all` | I1/I2/I3/I5 re-checked, "LEDGER PASSES" |
| Daily Merkle roots (off-chain) | `npm run settle && npx tsx scripts/anchor.ts` | `fixtures/anchors.json` |
| Latency bench | `npm run bench` | `fixtures/bench.json` (402-quote p50/p95) |
| Next.js ledger site (5 screens) | `cd web && npm run dev` | ledger · pay/reveal · audit · agent · verify |
| Submission gate | `npm run readiness` | pass/pending table |

## BLOCKED ON FUNDING (ready to run the moment the wallet is gassed)

The ops wallet `0x95DdED219bD3d763A184eB4187056b9F238aAaA2` currently holds **13 USDC on Base**, but
**0 INJ gas**, **0 Base ETH**, and **0 USDC on Injective**. The user is funding it separately (not done).

| Blocked item | Needs | Ready in |
|---|---|---|
| **Real paid x402 call** (a true Blockscout receipt) | payer holding ≥0.05 USDC on Injective + INJ gas; facilitator wallet gassed with INJ | `scripts/paid-call-smoke.ts` — does a balance preflight, refuses to fake, pays + prints the receipt tx when funded |
| **CCTP mint** (Base USDC → Injective USDC) | ~2 USDC on Base + gas both sides | `DEMO.md` funding flow; MCP `cctp_*` tools |
| **On-chain `LedgerAnchor` root** | ~0.3 INJ gas | `contracts/DEPLOY.md`; `npm run anchor` computes the roots, `scripts/anchor.ts --onchain <day> <tx>` records the posted tx |
| First real ledger rows (`is_placeholder=false`) | one paid call above | `POST /api/edge` handler already binds `pick_hash → receipt tx` when `req.x402.txHash` is present |

### Exact fund order (from the brief)
1. ~$2 Base ETH (gas to CCTP-burn) → 2. CCTP burn ~2 USDC Base→Injective → `cctp_mint` → 3. ~0.3 INJ for
gas on Injective EVM (facilitator settle + contract deploy).

## Seed-data honesty
- All 24 ledger rows are **`is_placeholder: true`** with **synthetic** receipt hashes
  (`0x` + `sha256("linelock-seed:<id>:<pick_hash>")`, deterministic, never on-chain). The API,
  ledger UI, receipt endpoint, and audit CLI all surface `is_placeholder`, and placeholder receipts are
  **not** linked to Blockscout. Numbers (odds/results) are plausible and internally consistent but are
  **not** a claim of a real settled wagering record.
- The engine, invariants, hashing, Merkle roots, and CLV math are **real** and identical to what real
  rows will use — only the receipt tx and match outcomes are seeded.

## Known deviations from the spec (documented, not hidden)
- `ARCHITECTURE.md` shows a flat `injectivePaymentMiddleware({endpoint,network,asset,amount})`. The
  shipped package uses a **routes map** + `options` object — we build against the shipped `.d.ts`. See
  README → "x402: the real surface".
- CLV headline `clv_pct` is the **relative** form (`entry/closing − 1`) to match the UI mockups;
  `COMPLEXITY.md` phrases the raw prob-point form. Both are computed and tested; documented in `engine/clv.ts`.
