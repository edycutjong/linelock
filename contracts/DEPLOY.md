# Deploying LedgerAnchor on Injective EVM

`LedgerAnchor.sol` is a ~40-line write-once daily Merkle checkpoint. It is the
5th honestly-named Injective surface (Injective EVM smart contract), built/
deployed with the official **`injective-evm-developer`** Agent Skill:

```
npx skills add InjectiveLabs/agent-skills --skill injective-evm-developer
```

## ⚠️ FUNDS-GATED
Deploying + posting a root needs **INJ gas** on the ops wallet
(`0x95DdED219bD3d763A184eB4187056b9F238aAaA2`), which is **not funded yet** (see
`../STATUS.md`). Everything below is ready to run the moment ~0.3 INJ lands. No
step here is faked, and no contract address is claimed until it is really
deployed.

## Networks (from @injectivelabs/x402/networks)
- Mainnet `eip155:1776` · chainId `1776` · RPC `https://sentry.evm-rpc.injective.network` · explorer `https://blockscout.injective.network`
- Testnet `eip155:1439` · chainId `1439` · RPC `https://k8s.testnet.json-rpc.injective.network` · explorer `https://testnet.blockscout.injective.network`

## Deploy (Foundry example)
```bash
forge create contracts/LedgerAnchor.sol:LedgerAnchor \
  --rpc-url https://sentry.evm-rpc.injective.network \
  --private-key $OPS_WALLET_PK
# verify on Blockscout:
forge verify-contract <ADDR> LedgerAnchor \
  --verifier blockscout \
  --verifier-url https://blockscout.injective.network/api
```

## Post a daily root
1. `npm run settle` → `npm run anchor` (writes `fixtures/anchors.json` with each
   day's `day_number`, `merkleRoot`, `count`).
2. For a day: `postAnchor(day_number, merkleRoot, count)` from the owner wallet.
3. Record the tx so the audit can diff DB vs chain:
   ```
   npx tsx scripts/anchor.ts --onchain <YYYY-MM-DD> <0x-anchor-tx>
   ```
4. `linelock-audit --all` now shows `MATCHES chain ✓` for that day, and
   `GET /api/anchor/:day` returns `onchain_posted: true, anchor_matches: true`.

## Why write-once
An anchor cannot be overwritten (`AlreadyAnchored`). If a settled ledger row is
edited after its day was anchored, the recomputed root will not match the posted
root — the tamper is provable to anyone holding the `AnchorPosted` event.
