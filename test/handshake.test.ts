/**
 * x402 402-handshake tests against the REAL @injectivelabs/x402 middleware.
 *
 * Boots the Express app on an ephemeral port and asserts the unpaid path
 * returns a valid 402 quote — parsed with the package's own
 * parsePaymentRequired(), not a hand-rolled parser. No funds required.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { parsePaymentRequired } from '@injectivelabs/x402/client';
import { createApp } from '../api/server';
import { NET, PAYTO_ADDRESS, PRICE_USDC_UNITS } from '../config';

let server: Server;
let base: string;

beforeAll(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      base = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterAll(() => {
  server?.close();
});

describe('x402 402 handshake (real middleware, no funds)', () => {
  it('POST /api/edge with no payment → HTTP 402', async () => {
    const res = await fetch(`${base}/api/edge`, { method: 'POST' });
    expect(res.status).toBe(402);
  });

  it('402 body is a valid x402 v2 PaymentRequired with the right quote', async () => {
    const res = await fetch(`${base}/api/edge`, { method: 'POST' });
    const body = (await res.json()) as any;
    expect(body.x402Version).toBe(2);
    expect(Array.isArray(body.accepts)).toBe(true);
    const req = body.accepts[0];
    expect(req.scheme).toBe('exact');
    expect(req.network).toBe(NET.caip2);
    expect(req.amount).toBe(PRICE_USDC_UNITS);
    expect(req.asset.toLowerCase()).toBe(NET.usdc.toLowerCase());
    expect(req.payTo.toLowerCase()).toBe(PAYTO_ADDRESS.toLowerCase());
    expect(req.extra.assetTransferMethod).toBe('eip3009');
  });

  it('the PAYMENT-REQUIRED header base64 mirror parses via the SDK', async () => {
    const res = await fetch(`${base}/api/edge`, { method: 'POST' });
    const header = res.headers.get('payment-required');
    expect(header).toBeTruthy();
    const parsed = parsePaymentRequired(header!);
    expect(parsed.x402Version).toBe(2);
    expect(parsed.accepts[0].network).toBe(NET.caip2);
    expect(parsed.accepts[0].amount).toBe(PRICE_USDC_UNITS);
    expect(parsed.accepts[0].payTo.toLowerCase()).toBe(PAYTO_ADDRESS.toLowerCase());
  });

  it('a malformed PAYMENT-SIGNATURE header is rejected with 402', async () => {
    const res = await fetch(`${base}/api/edge`, {
      method: 'POST',
      headers: { 'PAYMENT-SIGNATURE': 'not-base64-@@@' },
    });
    expect(res.status).toBe(402);
    const body = (await res.json()) as any;
    expect(body.error).toBeTruthy();
  });

  it('GET /api/ledger is free (200) and CORS-open', async () => {
    const res = await fetch(`${base}/api/ledger`);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    const body = (await res.json()) as any;
    expect(body.rows.length).toBeGreaterThanOrEqual(20);
    expect(body.invariants.I3_rows_equal_receipts).toBe(true);
  });

  it('GET /health reports the active network + row count', async () => {
    const res = await fetch(`${base}/health`);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(true);
    expect(body.rows).toBeGreaterThanOrEqual(20);
  });
});
