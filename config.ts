/**
 * LineLock — central config.
 *
 * All Injective/x402 constants are pinned from the SHIPPED @injectivelabs/x402
 * types (`node_modules/@injectivelabs/x402/dist/*.d.ts`), verified 2026-07-12 —
 * NOT from any prose. Where the spec's ARCHITECTURE.md sketch disagreed, the
 * shipped types win (see README "x402: the real surface" and STATUS.md).
 */
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Load build/.env.local (gitignored). Falls back to process env in CI.
const HERE = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.join(HERE, '.env.local') });

export const ROOT = HERE;

// ── Injective EVM networks (CAIP-2), pinned from x402/networks ──────────────
export const NETWORKS = {
  mainnet: {
    caip2: 'eip155:1776' as const,
    chainId: 1776,
    name: 'Injective EVM',
    rpc: 'https://sentry.evm-rpc.injective.network',
    explorer: 'https://blockscout.injective.network',
    usdc: '0xa00C59fF5a080D2b954d0c75e46E22a0c371235a' as `0x${string}`,
  },
  testnet: {
    caip2: 'eip155:1439' as const,
    chainId: 1439,
    name: 'Injective EVM Testnet',
    rpc: 'https://k8s.testnet.json-rpc.injective.network',
    explorer: 'https://testnet.blockscout.injective.network',
    usdc: '0x0C382e685bbeeFE5d3d9C29e29E341fEE8E84C5d' as `0x${string}`,
  },
} as const;

export type NetworkKey = keyof typeof NETWORKS;

/** Active network for the API middleware. Mainnet per PRD; override with LINELOCK_NETWORK=testnet. */
export const ACTIVE_NETWORK: NetworkKey =
  (process.env.LINELOCK_NETWORK as NetworkKey) === 'testnet' ? 'testnet' : 'mainnet';

export const NET = NETWORKS[ACTIVE_NETWORK];

// ── Pricing ─────────────────────────────────────────────────────────────────
/** 0.05 USDC in smallest units (USDC = 6 decimals). */
export const PRICE_USDC_UNITS = process.env.LINELOCK_PRICE_UNITS ?? '50000';
export const USDC_DECIMALS = 6;
export const PRICE_USDC_DISPLAY = Number(PRICE_USDC_UNITS) / 10 ** USDC_DECIMALS; // 0.05

// ── Wallet / payment config ─────────────────────────────────────────────────
function normalizePk(pk: string | undefined): `0x${string}` | undefined {
  if (!pk) return undefined;
  const trimmed = pk.trim();
  const withPrefix = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
  return /^0x[0-9a-fA-F]{64}$/.test(withPrefix) ? (withPrefix as `0x${string}`) : undefined;
}

/** Ops/facilitator wallet private key (funded separately by user). May be undefined in CI. */
export const OPS_WALLET_PK = normalizePk(process.env.OPS_WALLET_PK);
export const OPS_WALLET_ADDRESS = (process.env.OPS_WALLET_ADDRESS ?? '') as string;

/** x402 receiver (payTo). Address only, no key. */
export const PAYTO_ADDRESS = (process.env.PAYTO_ADDRESS ??
  '0x45078eD96C2bB171009A47a57aF5C085Bf4fD0e3') as `0x${string}`;

/**
 * A deterministic, well-known THROWAWAY key used ONLY when no real key is set
 * (tests / CI / example). It never holds funds; it exists so the middleware can
 * construct (it requires a facilitator or facilitatorUrl) and emit a valid 402.
 * anvil account #0 — public, do not fund.
 */
export const DUMMY_TEST_PK =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as `0x${string}`;

/** The key the middleware facilitator will use. Real key if present, else dummy (402 still works). */
export const FACILITATOR_PK: `0x${string}` = OPS_WALLET_PK ?? DUMMY_TEST_PK;
export const HAS_REAL_FACILITATOR_KEY = OPS_WALLET_PK !== undefined;

// ── Data API keys ───────────────────────────────────────────────────────────
export const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_KEY ?? '';
export const ODDS_API_KEY = process.env.ODDS_API_KEY ?? '';

// football-data.org — FIFA World Cup 2026
export const FOOTBALL_DATA = {
  base: 'https://api.football-data.org/v4',
  competition: 2000, // WC
  season: 2026,
  attribution: 'Football data provided by the Football-Data.org API',
};

// the-odds-api.com
export const ODDS_API = {
  base: 'https://api.the-odds-api.com/v4',
  sportH2H: 'soccer_fifa_world_cup',
  sportOutrights: 'soccer_fifa_world_cup_winner',
  regions: 'eu,uk',
  markets: 'h2h',
  oddsFormat: 'decimal',
};

// ── Server ──────────────────────────────────────────────────────────────────
export const PORT = Number(process.env.PORT ?? 8402);
export const API_BASE_URL = process.env.LINELOCK_API_URL ?? `http://localhost:${PORT}`;

// ── Paths ───────────────────────────────────────────────────────────────────
export const PATHS = {
  db: path.join(HERE, 'db', 'ledger.sqlite'),
  picksCsv: path.join(HERE, 'fixtures', 'picks.csv'),
  ledgerState: path.join(HERE, 'fixtures', 'ledger-state.json'),
  oddsSnapshots: path.join(HERE, 'fixtures', 'odds-snapshots'),
  anchors: path.join(HERE, 'fixtures', 'anchors.json'),
  nextPick: () => path.join(HERE, 'fixtures', 'next-pick.json'),
  bench: () => path.join(HERE, 'fixtures', 'bench.json'),
};

// ── CCTP V2 (mainnet) — for the funding flow (funds-gated) ──────────────────
export const CCTP = {
  tokenMessengerV2: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
  messageTransmitterV2: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
  attestationApi: 'https://iris-api.circle.com',
  baseSourceDomain: 6,
};

export function explorerTx(txhash: string, net: NetworkKey = ACTIVE_NETWORK): string {
  return `${NETWORKS[net].explorer}/tx/${txhash}`;
}
export function explorerAddress(addr: string, net: NetworkKey = ACTIVE_NETWORK): string {
  return `${NETWORKS[net].explorer}/address/${addr}`;
}
