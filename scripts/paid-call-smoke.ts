/**
 * paid-call-smoke.ts — the FUNDS-GATED end-to-end paid call. Ready to run the
 * moment the ops wallet is funded; refuses to pretend otherwise.
 *
 *   npx tsx scripts/paid-call-smoke.ts            # against a running API (npm run api)
 *   npx tsx scripts/paid-call-smoke.ts --url <u>  # against a deployed API
 *
 * Preflight (no funds needed):
 *   - reads the payer's native INJ balance (gas) and USDC balance on Injective
 *   - if either is zero, prints EXACTLY what to fund and exits WITHOUT paying
 * Full run (funds present):
 *   - createInjectiveClient().fetch() → pays 0.05 USDC → prints the receipt tx +
 *     Blockscout link, then times the round-trip and updates fixtures/bench.json.
 *
 * This never fabricates a receipt. If settlement fails, it says so.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPublicClient, http, formatUnits, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createInjectiveClient,
  parsePaymentResponseHeader,
} from '@injectivelabs/x402/client';
import { NET, OPS_WALLET_PK, API_BASE_URL, explorerTx, PATHS } from '../config';

const ERC20_BALANCE_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const;

function argVal(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function preflight(): Promise<{ ready: boolean; inj: bigint; usdc: bigint; addr: `0x${string}` }> {
  const account = privateKeyToAccount(OPS_WALLET_PK!);
  const client = createPublicClient({ transport: http(NET.rpc) });
  let inj = 0n, usdc = 0n;
  try {
    inj = await client.getBalance({ address: account.address });
    const erc20 = getContract({ address: NET.usdc, abi: ERC20_BALANCE_ABI, client });
    usdc = (await erc20.read.balanceOf([account.address])) as bigint;
  } catch (e) {
    console.error(`  (balance read failed — RPC issue: ${(e as Error).message})`);
  }
  return { ready: inj > 0n && usdc >= 50000n, inj, usdc, addr: account.address };
}

async function main(): Promise<void> {
  if (!OPS_WALLET_PK) {
    console.error('✗ OPS_WALLET_PK not set. See build/.env.local.');
    process.exit(1);
  }
  const url = (argVal('--url') ?? API_BASE_URL) + '/api/edge';
  console.log(`paid-call-smoke → ${url}  (${NET.name})`);

  const pf = await preflight();
  console.log(`  payer   : ${pf.addr}`);
  console.log(`  INJ gas : ${formatUnits(pf.inj, 18)} INJ`);
  console.log(`  USDC    : ${formatUnits(pf.usdc, 6)} USDC (need >= 0.05)`);

  if (!pf.ready) {
    console.log('\n⛔ NOT FUNDED — skipping the real payment (honest: no receipt fabricated).');
    console.log('   Fund the payer, then re-run:');
    if (pf.inj === 0n) console.log('     • ~0.3 INJ for gas on Injective EVM');
    if (pf.usdc < 50000n) console.log('     • >= 0.05 USDC on Injective (bridge via CCTP from Base — see DEMO.md)');
    process.exit(3);
  }

  console.log('\n✓ Funded. Executing real paid call…');
  const t0 = performance.now();
  const buyer = createInjectiveClient({ privateKey: OPS_WALLET_PK, preferredNetworks: [NET.caip2], defaultToken: 'USDC' });
  const res = await buyer.fetch(url, { method: 'POST' });
  const dt = performance.now() - t0;
  const receipt = parsePaymentResponseHeader(res);
  console.log(`← HTTP ${res.status} in ${dt.toFixed(0)}ms`);
  if (receipt?.success) {
    console.log(`  ✓ receipt tx : ${receipt.transaction}`);
    console.log(`  explorer     : ${explorerTx(receipt.transaction)}`);
    // fold the real total into bench.json
    if (fs.existsSync(PATHS.bench())) {
      const b = JSON.parse(fs.readFileSync(PATHS.bench(), 'utf8'));
      b.total_paid_ms = Math.round(dt);
      b.first_paid_receipt = { tx: receipt.transaction, at: new Date().toISOString() };
      fs.writeFileSync(PATHS.bench(), JSON.stringify(b, null, 2));
    }
  } else {
    console.error('  ✗ settlement did not succeed:', receipt);
    process.exit(2);
  }
  console.log('\n  pick:', JSON.stringify(await res.json().catch(() => ({})), null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
