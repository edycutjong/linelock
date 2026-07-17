# Contributing

Thanks for your interest in improving **LineLock** — the pay-per-pick World Cup
edge API on Injective x402 with a free, CLV-scored public ledger. 🧾

## Getting Started

1. Fork the repo and branch from `main`: `git checkout -b feat/your-feature`
2. Install dependencies: `npm install`
3. (Optional) Copy the env template for live data APIs: `cp .env.example .env.local`
   — the core (tests, ledger, 402 quote, the web site) runs from committed
   fixtures with an **empty** `.env.local`, so this step is only needed to pull
   fresh football/odds data.
4. Build the ledger + boot the API:
   ```bash
   npm run settle          # build the CLV ledger from fixtures/picks.csv
   npm run api &            # Express API on :8402 — POST /api/edge → HTTP 402
   ```
5. Run the ledger site: `cd web && npm install && npm run dev` → http://localhost:3402

## Before You Open a PR

- `npm run typecheck` passes (`tsc --noEmit`).
- `npm test` passes (**70** vitest tests: edge · ladder · CLV · hash · similar ·
  settle · invariants I1–I5 · 402 handshake).
- `npm run web:build` passes (Next.js production build).
- `npm run e2e` passes (Playwright, demo mode — no keys needed).
- Add or update tests for any behavior change — especially anything touching the
  data invariants **I1–I5** (they *are* the product).
- Keep commits conventional (`feat:`, `fix:`, `docs:`, `chore:`).

## Honesty Rules (please respect these)

- Never fabricate an on-chain receipt, mainnet tx hash, or live demo URL. Seed
  ledger rows are labeled `is_placeholder: true`; keep that labeling intact.
- Funds-gated code paths (real paid call, CCTP mint, on-chain anchor) must fail
  loudly when unfunded — they must never fake a result.

## Reporting Bugs / Requesting Features

Open an issue using the provided templates. Include repro steps, expected vs.
actual behavior, and environment details.
