/**
 * x402 payment middleware wiring — the exact lines that matter.
 *
 * Signature pinned from the SHIPPED types
 * (node_modules/@injectivelabs/x402/dist/middleware/index.d.ts):
 *
 *   injectivePaymentMiddleware(routes: RouteMap, options: MiddlewareOptions)
 *
 * routes is a MAP keyed "METHOD /path" (NOT the flat {endpoint,network,asset,
 * amount} object sketched in ../ARCHITECTURE.md — that prose is outdated; the
 * shipped types win. See README "x402: the real surface" + STATUS.md).
 */
import { injectivePaymentMiddleware } from '@injectivelabs/x402/middleware';
import type { RouteMap, MiddlewareOptions } from '@injectivelabs/x402/middleware';
import type { RequestHandler } from 'express';
import {
  NET,
  PAYTO_ADDRESS,
  PRICE_USDC_UNITS,
  FACILITATOR_PK,
  API_BASE_URL,
  ACTIVE_NETWORK,
} from '../config';

export const EDGE_ROUTE_KEY = 'POST /api/edge';

export const EDGE_DESCRIPTION =
  'LineLock — one World Cup knockout edge: model probability vs market odds, ' +
  'a conviction staking ladder, and a pick hash. The x402 USDC receipt is the ' +
  'immutable pre-kickoff timestamp for the pick.';

/** The routes map for x402-gated endpoints. */
export function buildRoutes(): RouteMap {
  return {
    [EDGE_ROUTE_KEY]: {
      description: EDGE_DESCRIPTION,
      mimeType: 'application/json',
      accepts: [
        {
          network: NET.caip2, // eip155:1776 (mainnet) | eip155:1439 (testnet)
          asset: NET.usdc, // native Circle USDC (EIP-3009), 6dp
          amount: PRICE_USDC_UNITS, // "50000" = 0.05 USDC
          payTo: PAYTO_ADDRESS, // receiver — address only, decoupled from facilitator
          maxTimeoutSeconds: 120,
        },
      ],
    },
  };
}

/**
 * Build the Express middleware.
 *
 * settlementPolicy "before": verify → settle → run handler, so the handler can
 * read req.x402.txHash and bind pick_hash → receipt tx in the SAME ledger row
 * (zero extra RPC). Our handler is effectively infallible (computes an edge
 * from cached data), which is the documented use-case for "before".
 *
 * NOTE ON FUNDS: emitting the 402 quote needs NO funds — send402() builds the
 * requirements purely from this config. Settlement (real paid calls) needs the
 * facilitator wallet gassed; until then a paid request returns 402
 * payment_settlement_failed (honest), never a fake receipt.
 */
export function buildPaymentMiddleware(): RequestHandler {
  const options: MiddlewareOptions = {
    facilitator: { privateKey: FACILITATOR_PK, confirmations: 1 },
    baseUrl: API_BASE_URL,
    settlementPolicy: 'before',
  };
  return injectivePaymentMiddleware(buildRoutes(), options);
}

/** The quote a buyer sees in the 402 (mirrors what send402 emits) — for /verify + docs. */
export function quoteSummary() {
  return {
    route: EDGE_ROUTE_KEY,
    network: NET.caip2,
    network_name: NET.name,
    asset: NET.usdc,
    amount_units: PRICE_USDC_UNITS,
    amount_usdc: Number(PRICE_USDC_UNITS) / 1e6,
    payTo: PAYTO_ADDRESS,
    scheme: 'exact',
    asset_transfer_method: 'eip3009',
    active_network: ACTIVE_NETWORK,
    explorer: NET.explorer,
    rpc: NET.rpc,
  };
}
