import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import type { LedgerResponse, LedgerRow, LedgerStats } from './types';

// Read at call time (runtime), not module load — so it works after build.
// Dynamic key defeats webpack DefinePlugin's build-time inlining of
// `process.env.LINELOCK_API_URL`, which would otherwise freeze it to '' .
const API_ENV_KEY = 'LINELOCK_API_URL';
const apiBase = () => process.env[API_ENV_KEY] || '';
const FIXTURE = path.join(process.cwd(), '..', 'fixtures', 'ledger-state.json');

function preKickoff(kickoff_utc: string, receipt_block_time: string) {
  const ms = new Date(kickoff_utc).getTime() - new Date(receipt_block_time).getTime();
  const valid = ms > 0;
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const human = h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h ${m}m` : `${h}h ${m}m`;
  return { hours: ms / 3600000, human, valid };
}

function decorate(rows: LedgerRow[]): LedgerRow[] {
  return rows.map((r) => ({
    ...r,
    pre_kickoff: r.pre_kickoff ?? preKickoff(r.kickoff_utc, r.receipt_block_time),
    receipt_explorer: r.receipt_explorer ?? (r.is_placeholder ? null : `https://blockscout.injective.network/tx/${r.receipt_tx}`),
  }));
}

/** Fetch the ledger from the API; fall back to the committed fixture. */
export async function getLedger(): Promise<{ data: LedgerResponse; source: 'api' | 'fixture' }> {
  const API = apiBase();
  if (API) {
    try {
      const res = await fetch(`${API}/api/ledger`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as LedgerResponse;
        return { data: { ...data, rows: decorate(data.rows) }, source: 'api' };
      }
    } catch {
      /* fall through to fixture */
    }
  }
  const raw = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const rows = decorate(raw.rows as LedgerRow[]);
  return {
    data: {
      price_usdc: raw.price_usdc,
      active_network: 'mainnet',
      attribution: raw.attribution,
      disclaimer: raw.disclaimer,
      stats: raw.stats as LedgerStats,
      rows,
      invariants: {
        I3_rows_equal_receipts: new Set(rows.map((r) => r.receipt_tx)).size === rows.length,
        row_count: rows.length,
        receipt_count: new Set(rows.map((r) => r.receipt_tx)).size,
      },
    },
    source: 'fixture',
  };
}

export async function getRowByHash(hash: string): Promise<LedgerRow | undefined> {
  const { data } = await getLedger();
  return data.rows.find((r) => r.pick_hash === hash);
}

export async function getRowByReceipt(tx: string): Promise<LedgerRow | undefined> {
  const { data } = await getLedger();
  return data.rows.find((r) => r.receipt_tx === tx);
}

export interface VerifyData {
  quote: { amount_usdc: number; network: string; asset: string; payTo: string };
  usdc: { address: string; decimals: number; symbol: string };
  cctp: { version: string; base_source_domain: number; token_messenger_v2: string };
  bench: { quote_ms?: { p50: number; p95: number } } | null;
  facilitator_funded: boolean;
}

export async function getVerify(): Promise<VerifyData> {
  const API = apiBase();
  if (API) {
    try {
      const res = await fetch(`${API}/api/verify`, { cache: 'no-store' });
      if (res.ok) {
        const d = (await res.json()) as any;
        return {
          quote: { amount_usdc: d.quote.amount_usdc, network: d.quote.network, asset: d.quote.asset, payTo: d.quote.payTo },
          usdc: { address: d.usdc_native_info.address, decimals: d.usdc_native_info.decimals, symbol: d.usdc_native_info.symbol },
          cctp: { version: d.cctp.version, base_source_domain: d.cctp.base_source_domain, token_messenger_v2: d.cctp.token_messenger_v2 },
          bench: d.bench,
          facilitator_funded: d.facilitator_funded,
        };
      }
    } catch { /* fall through */ }
  }
  let bench: any = null;
  try {
    bench = JSON.parse(fs.readFileSync(path.join(process.cwd(), '..', 'fixtures', 'bench.json'), 'utf8'));
  } catch { /* none */ }
  return {
    quote: { amount_usdc: 0.05, network: 'eip155:1776', asset: '0xa00C59fF5a080D2b954d0c75e46E22a0c371235a', payTo: '0x45078eD96C2bB171009A47a57aF5C085Bf4fD0e3' },
    usdc: { address: '0xa00C59fF5a080D2b954d0c75e46E22a0c371235a', decimals: 6, symbol: 'USDC' },
    cctp: { version: 'V2', base_source_domain: 6, token_messenger_v2: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d' },
    bench,
    facilitator_funded: false,
  };
}
