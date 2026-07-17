/**
 * buyer.ts — the client side of the x402 flow, using the FIRST-PARTY client
 * (no hand-rolled signing).
 *
 *   npm run buyer                 # parse-only: fetch the 402 and print the quote (NO funds needed)
 *   npm run buyer -- --pay        # full pay via createInjectiveClient().fetch() (FUNDS-GATED)
 *   npm run buyer -- --url <u>    # target a deployed API instead of localhost
 *
 * The parse-only path exercises parsePaymentRequired() from @injectivelabs/x402
 * and is fully testable today. --pay needs the payer wallet gassed with INJ +
 * holding USDC on Injective; until then it prints exactly what is missing.
 */
import { fileURLToPath } from 'node:url';
import {
  createInjectiveClient,
  parsePaymentRequired,
  parsePaymentResponseHeader,
} from '@injectivelabs/x402/client';
import { API_BASE_URL, NET, OPS_WALLET_PK, HAS_REAL_FACILITATOR_KEY, explorerTx } from '../config';

function argVal(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function parseOnly(url: string): Promise<void> {
  console.log(`→ POST ${url} (no payment header)`);
  const res = await fetch(url, { method: 'POST' });
  console.log(`← HTTP ${res.status} ${res.statusText}`);
  if (res.status !== 402) {
    console.log('  (expected 402 — is the API running? `npm run api`)');
    console.log(await res.text());
    return;
  }
  const header = res.headers.get('payment-required');
  if (!header) {
    console.log('  (no PAYMENT-REQUIRED header on the 402 — unexpected)');
    console.log(await res.text());
    return;
  }
  const quote = parsePaymentRequired(header);
  const req = quote.accepts[0];
  console.log('\n  x402 quote (parsed with @injectivelabs/x402 parsePaymentRequired):');
  console.log(`    network : ${req.network}`);
  console.log(`    asset   : ${req.asset}`);
  console.log(`    amount  : ${req.amount} units  (= ${Number(req.amount) / 1e6} USDC)`);
  console.log(`    payTo   : ${req.payTo}`);
  console.log(`    scheme  : ${req.scheme} · method ${(req.extra as any)?.assetTransferMethod}`);
  console.log('\n  To pay: `npm run buyer -- --pay` (needs a gassed wallet holding USDC on Injective).');
}

async function pay(url: string): Promise<void> {
  if (!OPS_WALLET_PK) {
    console.error('✗ OPS_WALLET_PK not set — cannot sign a payment. See build/.env.local.');
    process.exit(1);
  }
  console.log('⚠️  --pay attempts a REAL on-chain payment on', NET.name);
  console.log('    Requires: payer wallet gassed with INJ + holding USDC on Injective.');
  const client = createInjectiveClient({
    privateKey: OPS_WALLET_PK,
    preferredNetworks: [NET.caip2],
    defaultToken: 'USDC',
  });
  try {
    const res = await client.fetch(url, { method: 'POST' });
    console.log(`← HTTP ${res.status}`);
    const receipt = parsePaymentResponseHeader(res);
    if (receipt) {
      console.log('\n  ✓ PAYMENT-RESPONSE receipt:');
      console.log(`    success     : ${receipt.success}`);
      console.log(`    transaction : ${receipt.transaction}`);
      console.log(`    explorer    : ${explorerTx(receipt.transaction)}`);
      console.log(`    payer       : ${receipt.payer}`);
    }
    const body = await res.json().catch(() => null);
    if (body) console.log('\n  pick:', JSON.stringify(body, null, 2));
  } catch (e) {
    console.error('\n✗ Paid call failed (expected until the wallet is funded):');
    console.error('  ', (e as Error).message);
    console.error('  See STATUS.md → "Blocked on funding".');
    process.exit(2);
  }
}

async function main(): Promise<void> {
  const url = (argVal('--url') ?? API_BASE_URL) + '/api/edge';
  console.log(`facilitator key loaded on server side: ${HAS_REAL_FACILITATOR_KEY}\n`);
  if (process.argv.includes('--pay')) await pay(url);
  else await parseOnly(url);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
