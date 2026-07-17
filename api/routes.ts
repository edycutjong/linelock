/**
 * Free (non-gated) endpoints + the gated edge handler body.
 *
 *   POST /api/edge        (gated by x402) — returns the sealed pick after payment
 *   GET  /api/ledger      (free, CORS)    — every settled pick, losses included
 *   GET  /api/receipts/:tx (free)         — pick ↔ receipt binding + I1/I2 audit
 *   GET  /api/anchor/:day (free)          — daily Merkle root + per-pick proofs (I5)
 *   GET  /api/verify      (free)          — quote, USDC info, CCTP, bench, feed
 *   GET  /health
 */
import type { Request, Response } from 'express';
import fs from 'node:fs';
import { buildPick, buildSimilarSettled } from '../engine/index';
import { verifyPickHash } from '../engine/hash';
import { buildMerkleTree, merkleProof } from '../engine/merkle';
import {
  openDb, allRows, settledRows, rowByReceipt, rowCount, receiptCount,
  computeStats, upsertRow, upsertMany, type DB,
} from '../db/ledger';
import type { LedgerRow, Side } from '../engine/types';
import {
  PATHS, PRICE_USDC_DISPLAY, NET, CCTP, ACTIVE_NETWORK,
  HAS_REAL_FACILITATOR_KEY, FOOTBALL_DATA, explorerTx,
} from '../config';
import { quoteSummary } from './middleware';

// ── Ledger source: DB, hydrated from ledger-state.json if empty ─────────────
let _db: DB | null = null;
export function getDb(): DB {
  if (_db) return _db;
  _db = openDb(PATHS.db);
  if (rowCount(_db) === 0 && fs.existsSync(PATHS.ledgerState)) {
    const state = JSON.parse(fs.readFileSync(PATHS.ledgerState, 'utf8'));
    // Single transaction: concurrent openers (parallel test workers) either see
    // an empty ledger and re-run this idempotent seed, or the full row set —
    // never a partially-seeded ledger.
    upsertMany(_db, state.rows as any[]);
  }
  return _db;
}

// ── helpers ─────────────────────────────────────────────────────────────────
export function preKickoffDelta(kickoffUtc: string, receiptTime: string): { hours: number; human: string; valid: boolean } {
  const ms = new Date(kickoffUtc).getTime() - new Date(receiptTime).getTime();
  const valid = ms > 0;
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const human = h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h ${m}m` : `${h}h ${m}m`;
  return { hours: ms / 3600000, human, valid };
}

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Resolve the sealed "next pick" — live fixture/odds if reachable, else fallback JSON. */
export function resolveNextPick() {
  const raw = JSON.parse(fs.readFileSync(PATHS.nextPick(), 'utf8'));
  const { pick, pick_hash } = buildPick({
    fixture: raw.fixture,
    competition: raw.competition,
    kickoff_utc: raw.kickoff_utc,
    side: raw.side as Side,
    side_label: raw.side_label,
    model_prob: raw.model_prob,
    market_odds: raw.market_odds,
  });
  return { pick, pick_hash, stage: raw.stage };
}

// ── handlers ─────────────────────────────────────────────────────────────────

/** POST /api/edge — reached only AFTER x402 verify+settle (or in --demo mode). */
export function edgeHandler(req: Request, res: Response): void {
  const x402 = (req as any).x402 as
    | { payer?: string; txHash?: string; network?: string; amount?: string; asset?: string }
    | undefined;

  const db = getDb();
  const { pick, pick_hash, stage } = resolveNextPick();
  const nowIso = new Date().toISOString();

  // Comparable settled picks (losses included, I3) — the buyer's track-record preview.
  const similar_settled = buildSimilarSettled(
    { fixture: pick.fixture, side: pick.side, edge_pct: pick.edge_pct },
    settledRows(db).map((r) => ({
      fixture: r.fixture,
      side: r.side,
      edge_pct: r.edge_pct,
      result: r.result,
      clv_pct: r.clv_pct,
      settled_at: r.settled_at,
    })),
    3,
  );

  // If a real receipt landed, bind pick_hash → tx in the ledger (pending until settled).
  if (x402?.txHash) {
    try {
      const row: LedgerRow = {
        id: `sold-${x402.txHash.slice(2, 12)}`,
        fixture: pick.fixture, competition: pick.competition, kickoff_utc: pick.kickoff_utc,
        side: pick.side, side_label: pick.side_label,
        entry_odds: pick.market_odds, closing_odds: pick.market_odds,
        model_prob: pick.model_prob, market_implied_prob: pick.market_implied_prob,
        edge_pct: pick.edge_pct, stake_tier: pick.recommended_tier,
        stake_name: pick.ladder.find((l) => l.tier === pick.recommended_tier)?.name ?? 'pass',
        stake_units: pick.ladder.find((l) => l.tier === pick.recommended_tier)?.stake_units ?? 0,
        result: 'pending', clv_pct: 0, clv_prob_points: 0, pick_hash,
        receipt_tx: x402.txHash, receipt_block_time: nowIso,
        sold_count: 1, revenue_usdc: PRICE_USDC_DISPLAY, settled_at: nowIso,
        is_placeholder: false, raw_json: JSON.stringify(pick),
      };
      upsertRow(db, row as any);
    } catch { /* non-fatal: still return the pick the buyer paid for */ }
  }

  res.json({
    ...pick,
    stage,
    similar_settled,
    pick_hash,
    receipt: x402?.txHash
      ? { tx: x402.txHash, network: x402.network, payer: x402.payer, explorer: explorerTx(x402.txHash) }
      : null,
    note: x402?.txHash
      ? 'Paid. This receipt is your pre-kickoff timestamp — block time is < kickoff on the explorer.'
      : 'Demo/unsettled response (no on-chain receipt bound).',
  });
}

/** GET /api/ledger — the free public ledger. */
export function ledgerHandler(_req: Request, res: Response): void {
  const db = getDb();
  const rows = allRows(db);
  const stats = computeStats(db);
  res.json({
    generated_at: new Date().toISOString(),
    price_usdc: PRICE_USDC_DISPLAY,
    active_network: ACTIVE_NETWORK,
    attribution: FOOTBALL_DATA.attribution,
    disclaimer:
      'Rows with is_placeholder=true are seed data with synthetic receipt hashes (no on-chain tx). See STATUS.md.',
    invariants: {
      I3_rows_equal_receipts: rowCount(db) === receiptCount(db),
      row_count: rowCount(db),
      receipt_count: receiptCount(db),
    },
    stats,
    rows: rows.map((r) => ({
      ...r,
      pre_kickoff: preKickoffDelta(r.kickoff_utc, r.receipt_block_time),
      receipt_explorer: r.is_placeholder ? null : explorerTx(r.receipt_tx),
    })),
  });
}

/** GET /api/receipts/:tx — auditor binding: re-hash the pick, check block time. */
export function receiptHandler(req: Request, res: Response): void {
  const db = getDb();
  const row = rowByReceipt(db, req.params.tx);
  if (!row) {
    res.status(404).json({ error: 'receipt_not_found', tx: req.params.tx });
    return;
  }
  const hashCheck = verifyPickHash(row.raw_json, row.pick_hash);
  const delta = preKickoffDelta(row.kickoff_utc, row.receipt_block_time);
  res.json({
    receipt_tx: row.receipt_tx,
    is_placeholder: row.is_placeholder,
    receipt_explorer: row.is_placeholder ? null : explorerTx(row.receipt_tx),
    pick_hash: row.pick_hash,
    hash_verifies: hashCheck.ok,
    recomputed_hash: hashCheck.actual,
    receipt_block_time: row.receipt_block_time,
    kickoff_utc: row.kickoff_utc,
    pre_kickoff: delta,
    I1_pre_kickoff_ok: delta.valid,
    result: row.result,
    clv_pct: row.clv_pct,
    served_pick: JSON.parse(row.raw_json),
  });
}

/** GET /api/anchor/:day — daily Merkle root + per-pick proofs (I5). */
export function anchorHandler(req: Request, res: Response): void {
  const db = getDb();
  const day = req.params.day;
  const rows = settledRows(db)
    .filter((r) => dayKey(r.settled_at) === day)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (rows.length === 0) {
    res.status(404).json({ error: 'no_picks_for_day', day });
    return;
  }
  const leaves = rows.map((r) => r.pick_hash);
  const tree = buildMerkleTree(leaves);
  const anchored = readAnchor(day);
  const onchainPosted = !!(anchored && (anchored as any).onchain && anchored.tx);
  res.json({
    day,
    merkle_root: tree.root,
    count: rows.length,
    onchain_anchor: anchored,
    onchain_posted: onchainPosted,
    anchor_matches: onchainPosted ? anchored!.merkleRoot.replace(/^0x/i, '') === tree.root : null,
    picks: rows.map((r, i) => ({
      id: r.id,
      pick_hash: r.pick_hash,
      receipt_tx: r.receipt_tx,
      proof: merkleProof(leaves, i),
    })),
  });
}

function readAnchor(day: string): { day: string; merkleRoot: string; count: number; tx?: string } | null {
  if (!fs.existsSync(PATHS.anchors)) return null;
  const anchors = JSON.parse(fs.readFileSync(PATHS.anchors, 'utf8'));
  return anchors[day] ?? null;
}

/** GET /api/verify — judge page data. */
export function verifyHandler(_req: Request, res: Response): void {
  const db = getDb();
  const rows = allRows(db);
  const bench = fs.existsSync(PATHS.bench()) ? JSON.parse(fs.readFileSync(PATHS.bench(), 'utf8')) : null;
  res.json({
    quote: quoteSummary(),
    usdc_native_info: {
      network: NET.caip2, address: NET.usdc, decimals: 6, symbol: 'USDC',
      name: 'USD Coin (native, Circle FiatTokenV2_2)', eip3009: true, explorer: `${NET.explorer}/token/${NET.usdc}`,
    },
    cctp: {
      version: 'V2', base_source_domain: CCTP.baseSourceDomain,
      token_messenger_v2: CCTP.tokenMessengerV2, message_transmitter_v2: CCTP.messageTransmitterV2,
      attestation_api: CCTP.attestationApi,
      status: HAS_REAL_FACILITATOR_KEY ? 'facilitator key present' : 'facilitator key not loaded',
      note: 'Funding flow (Base burn → Iris attest → cctp_mint) is funds-gated — see STATUS.md.',
    },
    bench,
    facilitator_funded: false,
    receipts_feed: rows
      .filter((r) => !r.is_placeholder)
      .slice(0, 25)
      .map((r) => ({ tx: r.receipt_tx, payer: 'n/a', time: r.receipt_block_time, explorer: explorerTx(r.receipt_tx) })),
    reproduce: {
      curl_402: `curl -i -X POST ${quoteSummary().route.split(' ')[1]}`,
      note: 'POST /api/edge with no PAYMENT-SIGNATURE header returns HTTP 402 + the quote above.',
    },
  });
}

export function healthHandler(_req: Request, res: Response): void {
  const db = getDb();
  res.json({
    ok: true, service: 'linelock-api', active_network: ACTIVE_NETWORK,
    rows: rowCount(db), receipts: receiptCount(db), price_usdc: PRICE_USDC_DISPLAY,
  });
}
