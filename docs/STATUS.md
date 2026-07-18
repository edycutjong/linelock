# STATUS — LineLock build

_Last updated: 2026-07-18. Honest accounting of what is built, what runs now, and what remains
pending. **No on-chain receipt or mainnet transaction is ever fabricated.**_

## 2026-07-18 — REAL SETTLEMENTS (Injective EVM mainnet, `eip155:1776`)

The live API (`api.linelock.edycu.dev`) has settled **four real paid x402 calls** at **0.05 USDC**
each — payer `0x95DdED219bD3d763A184eB4187056b9F238aAaA2` → payTo
`0x45078eD96C2bB171009A47a57aF5C085Bf4fD0e3`. Every hash is verifiable at
`https://blockscout.injective.network/tx/<hash>`:

| # | Tx hash | Note |
|---|---|---|
| 1 | [`0xc4327f40b1bc22a1ddb0f102f064e265e66c2ee9b51e5d6dd7eb6e69c41a1beb`](https://blockscout.injective.network/tx/0xc4327f40b1bc22a1ddb0f102f064e265e66c2ee9b51e5d6dd7eb6e69c41a1beb) | **First real sale** — now a real `is_placeholder: false` row on the live public ledger (fixture "SF: FRA vs ESP", 25 rows total) |
| 2 | [`0x89cd955cf4cab5efcb7a25cbc8e25851c8524a186f2aa449d11e4b598541a07d`](https://blockscout.injective.network/tx/0x89cd955cf4cab5efcb7a25cbc8e25851c8524a186f2aa449d11e4b598541a07d) | Bought **autonomously** by CupOracle's `wc_edge` |
| 3 | [`0x8848e7798a4ff28f1c817a74f052b75f3462b33bcd4cba9400cc86b18143045e`](https://blockscout.injective.network/tx/0x8848e7798a4ff28f1c817a74f052b75f3462b33bcd4cba9400cc86b18143045e) | Bought **autonomously** by AgentDuel's RED duelist |
| 4 | [`0x2c1c8b549d19dc898f997ff03ad3a36ca2dfda194db392f830dac6414321d139`](https://blockscout.injective.network/tx/0x2c1c8b549d19dc898f997ff03ad3a36ca2dfda194db392f830dac6414321d139) | AgentDuel's RED duelist, second buy |

**CCTP funding path executed for real:** burn on Base (domain 6)
`0x66ce1116e75f780e60259e394304e86f7565b52276f9d49e4c7fc66209427b37` → Iris attestation → mint on
Injective
[`0xd757a98d6abb3e760898fc8c30447f6a8b86d35c0745db4f474ea56d3c4464ac`](https://blockscout.injective.network/tx/0xd757a98d6abb3e760898fc8c30447f6a8b86d35c0745db4f474ea56d3c4464ac)
(2 USDC). Funding is done: the ops wallet is gassed and USDC is minted on Injective.

**Still pending (kept honest):** the `LedgerAnchor.sol` mainnet deploy (funds now available, contract
not yet deployed), and **24 of the 25** live ledger rows remain labeled seed/placeholder
(`is_placeholder: true`).

## TL;DR
- ✅ Full stack built and wired to the **real** `@injectivelabs/x402` package (pinned from its shipped
  `dist/*.d.ts`, verified 2026-07-12).
- ✅ **70 tests pass** (`npm test`): CLV math, edge, ladder, hashing, similar-pick lookups, invariants
  I1–I5, settle idempotency, and the live 402 handshake parsed by the SDK's own `parsePaymentRequired`.
- ✅ `curl -i -X POST /api/edge` → **HTTP 402 + a valid x402 quote**, no funds required.
- ✅ **Real mainnet settlements (2026-07-18):** four paid x402 calls settled + CCTP mint executed —
  see the section above.
- ⏳ Only the **LedgerAnchor mainnet deploy** remains pending (funds available, not yet deployed).

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

## FUNDING & MONEY-MOVING STATUS (funding done 2026-07-18)

The ops wallet `0x95DdED219bD3d763A184eB4187056b9F238aAaA2` is now **gassed with INJ** and holds
**USDC on Injective** (CCTP mint executed — see the settlements section above). Funding is no longer a
blocker.

| Item | Status | Where |
|---|---|---|
| **Real paid x402 call** (a true Blockscout receipt) | ✅ **DONE — four settled** (first: `0xc4327f40…c41a1beb`) | `scripts/paid-call-smoke.ts` — balance preflight, refuses to fake, pays + prints the receipt tx |
| **CCTP mint** (Base USDC → Injective USDC) | ✅ **DONE** (burn `0x66ce1116…209427b37` → mint `0xd757a98d…3c4464ac`, 2 USDC) | `DEMO.md` funding flow; MCP `cctp_*` tools |
| **On-chain `LedgerAnchor` root** | ⏳ **PENDING** — funds available, contract not yet deployed | `contracts/DEPLOY.md`; `npm run anchor` computes the roots, `scripts/anchor.ts --onchain <day> <tx>` records the posted tx |
| First real ledger rows (`is_placeholder=false`) | ✅ **DONE — 1 of 25 live rows real** (fixture "SF: FRA vs ESP") | `POST /api/edge` handler binds `pick_hash → receipt tx` when `req.x402.txHash` is present |

### Fund order used (from the brief)
1. ~$2 Base ETH (gas to CCTP-burn) → 2. CCTP burn ~2 USDC Base→Injective → `cctp_mint` → 3. ~0.3 INJ for
gas on Injective EVM (facilitator settle + contract deploy). Steps 1–3 executed 2026-07-18; only the
contract deploy itself remains.

## Seed-data honesty
- The live ledger now also carries **one real row** (`is_placeholder: false`, receipt
  `0xc4327f40…c41a1beb`, 2026-07-18); the 24 seed rows below remain labeled placeholder.
- All 24 seed ledger rows are **`is_placeholder: true`** with **synthetic** receipt hashes
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
