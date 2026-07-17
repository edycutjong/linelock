# 🖥️ web/ — LineLock ledger site

> The Next.js 14 App-Router site: a public, auditable front-end over the edge API — buy the next pick via x402, then audit every past pick (CLV, receipts, hashes) for free.

**[↩ Root README](../README.md)** · **[🏗️ Architecture](../docs/ARCHITECTURE.md)** · **[▶ Demo](../docs/DEMO.md)**

## 📦 What's here

| File | Purpose |
| --- | --- |
| `app/page.tsx` | Ledger home — hero stats, the sealed next pick (PayReveal), and the full settled ledger table. |
| `app/pick/[hash]/page.tsx` | Per-pick audit page (I1/I2/I4) — pre-kickoff timeline, hash re-verify, closing-line trail, raw JSON. |
| `app/verify/page.tsx` | Judge panel — x402 quote, native USDC info, CCTP funding path, bench, live receipts feed, reproduce steps. |
| `app/agent/page.tsx` | Agent view — the `worldcup-linelock` skill flow as a terminal + the same purchase, human side. |
| `app/layout.tsx` · `app/{globals,tokens}.css` | Root layout, nav mount, design tokens. |
| `components/PayReveal.tsx` | Client sealed → 402 quote → signing → revealed pay flow for the next pick. |
| `components/HashVerify.tsx` | Client-side `sha256(pick) == pick_hash` re-verify widget (I2). |
| `components/Nav.tsx` · `components/ui.tsx` | Top nav + shared badges (CLV, stake, receipt chip, odds move, result). |
| `lib/ledger.ts` | `server-only` data layer: fetch `/api/ledger` + `/api/verify` from the live API, fall back to committed fixtures. |
| `lib/pick.ts` · `lib/types.ts` | Next-pick preview + shared ledger types. |

## 🖥️ Screens

| Screen | Route | What it shows |
| --- | --- | --- |
| **Ledger** | `/` | Record/ROI/avg-CLV hero stats and the settled ledger table (losses included), each row linking to its audit page. |
| **Pay / Reveal** | `/` (PayReveal) | The sealed next pick unlocking through the x402 flow: locked → HTTP 402 quote → signing → revealed edge + ladder. |
| **Audit** | `/pick/[hash]` | One pick's proofs: receipt-predates-kickoff timeline (I1), pick-hash re-verify (I2), closing-line/CLV trail (I4), receipt + served JSON. |
| **Agent** | `/agent` | How an agent harness buys it with no API keys — MCP balance check, x402 pay, hash validate, free-ledger audit. |
| **Verify** | `/verify` | Everything a reviewer needs to reproduce: quote, USDC, CCTP path, bench latency, receipts feed, and honest funding status. |

## 🚀 Run it

Run from the **repo root** via the `web:*` wrappers, or directly inside `web/`:

```bash
# from repo root
npm run web:dev      # next dev on http://localhost:3402
npm run web:build
npm run web:start

# or inside web/
cd web && npm install && npm run dev   # → :3402
```

For live data, boot the API first (`npm run api` on `:8402`) and point the site at it with `LINELOCK_API_URL`. With no API reachable, every screen renders from the committed fixtures.

## ⚙️ Environment

| Var | Default | Role |
| --- | --- | --- |
| `LINELOCK_API_URL` | _(unset)_ | Base URL of the edge API (e.g. `http://localhost:8402`). Read at runtime in `lib/ledger.ts`; unset → the site falls back to `../fixtures/*.json`. |

`PORT` for the site itself is pinned to `3402` in `package.json` (`next dev -p 3402`), not an env var.

## 🧪 Notes

- All data-fetching pages are `dynamic = 'force-dynamic'` — no stale build-time snapshot; the API URL is read at request time (a dynamic env key defeats webpack inlining).
- Works **fully offline** against committed fixtures, so the 5 screens render even before the API is up or the wallet is funded.
- The site never fakes a receipt: the ledger keeps **losses public** and marks seed rows `is_placeholder` (synthetic hashes); real on-chain receipts stream into Verify only after the first funded paid call — see [`docs/STATUS.md`](../docs/STATUS.md).
