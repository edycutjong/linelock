---
name: worldcup-linelock
description: >
  Buy and audit World Cup betting edges from LineLock over Injective x402.
  Use when the user wants the next knockout pick (model probability vs market
  odds + a conviction staking ladder), wants to pay per-call in USDC without an
  API key, or wants to audit a tipster's settled record by closing-line value
  (CLV). Handles: checking USDC balance via the Injective MCP server, paying the
  0.05 USDC x402 quote, validating the returned pick hash, and reading the free
  public ledger to compute trailing CLV before trusting a pick.
license: MIT
---

# worldcup-linelock

Teach any harness (Claude Code / Cursor / Codex) to be a **buyer** on LineLock:
a pay-per-pick World Cup edge API on **Injective EVM** where the x402 USDC
receipt IS the pick's pre-kickoff timestamp, plus a **free** public ledger that
CLV-scores every settled pick (losses included).

Install:

```
npx skills add https://github.com/edycutjong/linelock-inj --skill worldcup-linelock
```

Config: set `LINELOCK_API` (default `https://linelock.edycu.dev`) and, to
pay, `OPS_WALLET_PK` (a funded Injective EVM key holding USDC).

## When to use
- "Get me the next World Cup knockout edge / pick."
- "Is this tipster real? Check their CLV." → read the free ledger, no payment.
- "Pay for the edge and prove the receipt predates kickoff."

## The flow (4 steps)

### 1. Check USDC balance (Injective MCP server — free, no payment)
Use the Injective MCP server (`InjectiveLabs/mcp-server`, stdio,
`INJECTIVE_NETWORK=mainnet`):
- `account_balances { address }` → confirm ≥ 0.05 USDC on Injective.
- `usdc_native_info` → the USDC contract address + decimals used by the quote
  (do not hardcode from docs; pin from here).
- If low, fund via CCTP: `cctp_supported_chains` → burn on Base (domain 6) →
  `cctp_attestation_status` → `cctp_mint` on Injective. `address_normalize`
  converts `inj1…` ↔ `0x…` for display.

### 2. Pay the x402 quote (first-party client — never hand-roll signing)
```
POST {LINELOCK_API}/api/edge         # no payment header → HTTP 402 + quote
```
The 402 body (and the `PAYMENT-REQUIRED` base64 header) is an x402 v2
`PaymentRequired`: `accepts[0] = { network: "eip155:1776", asset: <USDC>,
amount: "50000", payTo, scheme: "exact" }`. Pay with the shipped client:

```ts
import { createInjectiveClient, parsePaymentResponseHeader } from '@injectivelabs/x402/client';
const client = createInjectiveClient({ privateKey: process.env.OPS_WALLET_PK,
  preferredNetworks: ['eip155:1776'], defaultToken: 'USDC' });
const res = await client.fetch(`${API}/api/edge`, { method: 'POST' }); // auto-handles the 402
const receipt = parsePaymentResponseHeader(res); // { success, transaction, network, payer }
```
`receipt.transaction` is the on-chain tx — its **block time is your pre-kickoff
proof** (verify on Blockscout: `https://blockscout.injective.network/tx/<tx>`).
The repo's `scripts/buyer.ts` implements exactly this (run `npm run buyer` for
the free 402-parse path, `-- --pay` to pay).

### 3. Validate the pick hash (tamper check — I2)
The 200 body includes `pick_hash`. Re-hash the served pick JSON with
`sha256(canonical JSON)` (sorted keys) and confirm it equals `pick_hash`. If it
differs, the response was tampered — reject it.

### 4. Read the ledger + compute trailing CLV (free — decide before you trust)
```
GET {LINELOCK_API}/api/ledger        # free, CORS-open, losses included
```
Trust signal = `stats.avg_clv_pct` and `stats.beat_close_rate` over the settled
sample, NOT the win/loss record. Positive average CLV across ~20+ picks = real
edge independent of variance. Audit any single pick:
```
GET {LINELOCK_API}/api/receipts/<tx> # hash_verifies + I1 pre-kickoff delta
```

## Guardrails
- Never trust a pick whose `pick_hash` does not re-verify (step 3).
- Never treat a row with `is_placeholder: true` as an on-chain receipt — those
  are seed rows with synthetic tx hashes.
- A row is only pre-kickoff-valid if `receipt_block_time < kickoff_utc` (the API
  returns `pre_kickoff` + `I1_pre_kickoff_ok`).
- 0.05 USDC per call — cheap to poll, but the ledger is the free audit surface;
  use it before paying.

## Injective surfaces used
`x402` (`injectivePaymentMiddleware` server / `createInjectiveClient` buyer) ·
`MCP Server` (`account_balances`, `usdc_native_info`, CCTP tools,
`address_normalize`) · `USDC CCTP` (Base→Injective funding) · this **Agent
Skill** itself is the distribution channel.
