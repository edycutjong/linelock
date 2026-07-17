# Architecture — LineLock (as built)

## System

```mermaid
flowchart LR
  subgraph Buyer["Buyer (human or agent)"]
    SK["worldcup-linelock\nAgent Skill"]
    CL["createInjectiveClient().fetch()\n(scripts/buyer.ts)"]
    MCP["Injective MCP server\naccount_balances · usdc_native_info · cctp_*"]
    SK --> MCP
    SK --> CL
  end

  CL -->|"POST /api/edge (402 → PAYMENT-SIGNATURE)"| MW

  subgraph API["Express API (api/)"]
    MW["injectivePaymentMiddleware\n(@injectivelabs/x402)\nPOST /api/edge · 0.05 USDC"]
    EH["edgeHandler → buildPick()"]
    FREE["free: GET /api/ledger\n/api/receipts/:tx · /api/anchor/:day · /api/verify"]
    MW --> EH
  end

  subgraph ENG["engine/ (pure, tested)"]
    EDGE["edge: model_prob vs market_odds"]
    LAD["conviction ladder"]
    CLV["CLV: entry vs closing"]
    HASH["pick_hash = sha256(canonical)"]
    MK["daily Merkle root"]
  end

  EH --> EDGE --> LAD
  EH --> HASH
  MW -->|"settle (before): req.x402.txHash"| INJ[("Injective EVM\nUSDC 0xa00C…235a")]

  subgraph DATA["data/"]
    FB["football-data.org\nfixtures/results"]
    OD["the-odds-api\nclosing-line snapshots (I4)"]
  end
  OD --> CLV

  SET["scripts/settle.ts\n(idempotent)"] --> DB[("db/ledger.sqlite\n+ fixtures/ledger-state.json")]
  SET --> CLV
  SET --> HASH
  DB --> FREE
  DB --> WEB["Next.js site (web/)\nledger · pay/reveal · audit · agent · verify"]
  MK --> ANCH["contracts/LedgerAnchor.sol\nAnchorPosted(day,root,count)"]
  BASE[("Base USDC")] -->|"CCTP burn → Iris → cctp_mint"| INJ
```

## Request paths

| Route | Gate | Handler | Returns |
|---|---|---|---|
| `POST /api/edge` | **x402 0.05 USDC** | `edgeHandler` | `{fixture, model_prob, market_odds, edge_pct, ladder[], similar_settled[], pick_hash, receipt?}` |
| `GET /api/ledger` | free, CORS | `ledgerHandler` | all settled rows + stats + I3 check |
| `GET /api/receipts/:tx` | free | `receiptHandler` | pick↔receipt binding, I1 delta, I2 re-hash |
| `GET /api/anchor/:day` | free | `anchorHandler` | daily Merkle root + per-pick proofs (I5) |
| `GET /api/verify` | free | `verifyHandler` | quote, usdc info, CCTP, bench, receipts feed |
| `GET /health` | free | `healthHandler` | row/receipt counts, active network |

## x402 wiring (the lines that matter — real signature)

```ts
import { injectivePaymentMiddleware } from '@injectivelabs/x402/middleware';

app.use(injectivePaymentMiddleware(
  { 'POST /api/edge': {
      description: '…',
      accepts: [{ network: 'eip155:1776', asset: USDC_MAINNET, amount: '50000',
                  payTo: PAYTO_ADDRESS, maxTimeoutSeconds: 120 }] } },
  { facilitator: { privateKey: FACILITATOR_PK, confirmations: 1 },
    settlementPolicy: 'before' }   // handler sees req.x402.txHash → binds pick_hash→tx
));
```

`settlementPolicy: 'before'` = verify → settle → run handler, so `edgeHandler` binds `pick_hash` to the
receipt tx in one ledger row with zero extra RPC. Emitting the 402 quote itself needs **no funds**.

## Data flow (the one deep flow)
1. Agent checks USDC via MCP → `POST /api/edge` → **402** with the x402 quote.
2. `createInjectiveClient().fetch()` signs EIP-3009 → facilitator settles → **receipt tx** (block time
   < kickoff = I1).
3. `edgeHandler` returns the edge + ladder + `pick_hash`, binding the receipt as a `pending` ledger row.
4. `settle.ts` freezes the closing line (I4), computes CLV, and publishes the row to `GET /api/ledger`.
5. `LedgerAnchor` commits the day's Merkle root (I5); `linelock-audit --all` diffs DB vs chain.

## Invariants → code
I1 `settle.ts:assertPreKickoff` · I2 `engine/hash.ts` + browser re-verify · I3 `db/ledger.ts:receiptCount`
· I4 `data/odds.ts:closingLineFromSnapshots` · I5 `engine/merkle.ts` + `contracts/LedgerAnchor.sol`.
