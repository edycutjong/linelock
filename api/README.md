# 🔌 api/ — LineLock x402 edge API

> The Express service that gates the paid pick behind Injective **x402** and serves the free, CLV-scored public ledger + audit/anchor/verify proofs.

**[↩ Root README](../README.md)** · **[🏗️ Architecture](../docs/ARCHITECTURE.md)** · **[▶ Demo](../docs/DEMO.md)**

## 📦 What's here

| File | Purpose |
| --- | --- |
| `server.ts` | Express app factory (`createApp`) + `main()`. CORS-opens the free API, mounts the x402 gate (skipped in `--demo`), wires every route, listens on `:8402`. |
| `middleware.ts` | The real `@injectivelabs/x402` wiring: builds the `RouteMap` for `POST /api/edge` (network/asset/amount/payTo), `settlementPolicy: 'before'`, and `quoteSummary()` used by `/verify` + docs. |
| `routes.ts` | Every handler: gated `edgeHandler` (binds `pick_hash → receipt tx`), free `ledger`/`receipt`/`anchor`/`verify`/`health`, plus the SQLite ledger hydration (`getDb`) and pre-kickoff/Merkle helpers. |

## 🔌 Endpoints

| Method | Path | x402-gated? | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/edge` | ✅ yes (0.05 USDC) | Returns the sealed pick + conviction ladder after payment; binds the receipt tx into the ledger. Reached only after verify+settle (or in `--demo`). |
| `GET` | `/api/ledger` | free | Every settled pick — losses included (I3). Stats, invariants, pre-kickoff deltas, explorer links. |
| `GET` | `/api/receipts/:tx` | free | Auditor binding: re-hashes the served pick (I2) + checks receipt block time < kickoff (I1). |
| `GET` | `/api/anchor/:day` | free | Daily Merkle root + per-pick proofs (I5); reports whether an on-chain anchor was posted. |
| `GET` | `/api/verify` | free | Judge-panel data: live x402 quote, native USDC info, CCTP path, bench, receipts feed, reproduce steps. |
| `GET` | `/health` | free | Liveness + row/receipt counts + active network. |
| `GET` | `/` | free | Service index JSON. |

The 402 quote on `POST /api/edge` is emitted purely from config — **no funds required**. Real settlement needs the facilitator wallet gassed; until then a paid request returns an honest `402 payment_settlement_failed`, never a fake receipt.

## 🚀 Run it

Run from the **repo root** (scripts live in the root `package.json`):

```bash
npm install
npm run settle                 # build the CLV ledger from fixtures first
npm run api                    # boot Express on http://localhost:8402 (x402 gate ON)
curl -i -X POST http://localhost:8402/api/edge   # → HTTP 402 + real x402 quote (no funds)

# no-funds paid-payload path — gate OFF:
npm run api -- --demo          # same server, x402 gate DISABLED
curl -s -X POST http://localhost:8402/api/edge   # → 200: edge + ladder (receipt: null)
```

`npm start` is an alias of `npm run api`. Free reads work with zero setup:

```bash
curl -s http://localhost:8402/api/ledger | jq .stats
curl -s http://localhost:8402/api/verify
```

Related root scripts: `npm run settle` (build ledger), `npm run audit -- --all` (independent audit CLI).

## ⚙️ Environment

Read via `../config.ts` (copy `../.env.example` → `.env.local`). All optional; the 402 proof needs none of them.

| Var | Default | Role |
| --- | --- | --- |
| `PORT` | `8402` | API listen port. |
| `LINELOCK_NETWORK` | `mainnet` | `mainnet` (eip155:1776) or `testnet` (eip155:1439). |
| `LINELOCK_PRICE_UNITS` | `50000` | Price in USDC 6dp units (0.05 USDC). |
| `PAYTO_ADDRESS` | built-in | x402 receiver address (address only, no key). |
| `OPS_WALLET_PK` | — | Facilitator/settlement private key. Absent → 402 quote still works; real paid calls fail honestly. |
| `OPS_WALLET_ADDRESS` | — | Facilitator wallet address (display/status). |
| `LINELOCK_API_URL` | `http://localhost:8402` | Self base URL (also read by the web site to fetch live data). |
| `FOOTBALL_DATA_KEY` / `ODDS_API_KEY` | — | Optional live fixture/odds data; falls back to committed fixtures. |

## 🧪 Notes

- Covered by the root Vitest suite (`npm test`) — CLV, edge, ladder, hash, invariants I1–I5, settle, and the 402 handshake.
- **The 402 quote works with zero funds** — it's built from config, not a live chain call.
- A **real on-chain receipt is funds-gated**: settlement needs the facilitator wallet gassed. See [`docs/STATUS.md`](../docs/STATUS.md); the code [refuses to fabricate a receipt](../scripts/paid-call-smoke.ts).
- The ledger is **CLV-scored with losses included** (I3: `rows == receipts`). Seed rows carry `is_placeholder: true` (synthetic receipt hashes, no on-chain tx) and are labeled as such in every response.
