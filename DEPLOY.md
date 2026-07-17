# Deploy

Two automated pipelines ship this repo. Both live in `.github/workflows/`.

## 1. GitHub Pages — landing + pitch (`pages.yml`)

Publishes the `docs/` folder (landing `docs/index.html`, pitch `docs/pitch/index.html`, assets).

**One-time setup:** GitHub → repo **Settings → Pages → Build and deployment → Source = "GitHub Actions"**.

**Triggers:** push to `main` touching `docs/**`, any published Release, or manual (`workflow_dispatch`).

**Live URLs:**
- Landing → https://edycutjong.github.io/linelock/
- Pitch → https://edycutjong.github.io/linelock/pitch/

## 2. Railway — x402 API (`railway.yml`)

Builds the `Dockerfile` and deploys the Express API. The server honours `$PORT`
(`config.ts`: `process.env.PORT ?? 8402`), which Railway injects.

**One-time setup:**
1. Create a Railway project + service for this API.
2. Repo **Settings → Secrets and variables → Actions**:
   - **Secret** `RAILWAY_TOKEN` — a Railway **project token** (Project → Settings → Tokens).
   - **Variable** `RAILWAY_SERVICE` — the Railway service name (e.g. `linelock-api`).
3. Set the app's runtime env vars in Railway (facilitator key, RPC, data-API keys, etc.).

**Triggers:** push to `main` (ignoring `docs/**`, `web/**`, `*.md`), any published Release, or manual.

> The **web/** Next.js ledger site is deployed separately (e.g. Vercel) and points at the Railway API URL via env — it is not part of these workflows. The `LedgerAnchor.sol` contract deploys to **Injective EVM mainnet** separately (see `contracts/DEPLOY.md`).

## Existing quality gates
`ci.yml` (typecheck + tests + coverage) and `codeql.yml` (security) run on every push/PR — unchanged.
