/**
 * LineLock API — Express app.
 *
 *   POST /api/edge        gated by injectivePaymentMiddleware (x402, 0.05 USDC)
 *   GET  /api/ledger      free, CORS-open — the public CLV ledger
 *   GET  /api/receipts/:tx free — pick ↔ receipt audit binding
 *   GET  /api/anchor/:day free — daily Merkle root + proofs (I5)
 *   GET  /api/verify      free — judge page data
 *   GET  /health
 *
 * The 402 quote requires NO funds; a real paid call requires the facilitator
 * wallet to be gassed (see STATUS.md). `--demo` bypasses the gate so the paid
 * 200 payload can be shown without funds.
 */
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { buildPaymentMiddleware } from './middleware';
import {
  edgeHandler, ledgerHandler, receiptHandler, anchorHandler, verifyHandler, healthHandler, getDb,
} from './routes';
import { PORT, ACTIVE_NETWORK, HAS_REAL_FACILITATOR_KEY, API_BASE_URL } from '../config';

/** CORS-open the free API so the ledger is a public, reusable proof layer. */
function cors(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, PAYMENT-SIGNATURE, X-PAYMENT',
  );
  res.setHeader('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT-RESPONSE');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}

export function createApp(opts: { demo?: boolean } = {}): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors);

  // Basic per-IP rate limiting on the API + health surface. Purely a DoS/abuse
  // guard — it does NOT alter the x402 payment/402 logic or any payload. The
  // window/max are generous (overridable via env) so normal traffic and the
  // test/e2e suites are never throttled. OPTIONS preflight is skipped so CORS
  // is unaffected.
  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 600),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
  });
  app.use(limiter);

  app.use(express.json());

  // x402 gate — runs on every request, only protects the routes in the map.
  // In --demo mode we skip the gate so the paid payload renders without funds.
  if (!opts.demo) {
    app.use(buildPaymentMiddleware());
  }

  app.post('/api/edge', edgeHandler);
  app.get('/api/ledger', ledgerHandler);
  app.get('/api/receipts/:tx', receiptHandler);
  app.get('/api/anchor/:day', anchorHandler);
  app.get('/api/verify', verifyHandler);
  app.get('/health', healthHandler);
  app.get('/', (_req, res) =>
    res.json({ service: 'linelock-api', see: ['/api/ledger', '/api/verify', '/health'] }),
  );

  return app;
}

function main(): void {
  const demo = process.argv.includes('--demo');
  const app = createApp({ demo });
  getDb(); // warm the ledger (hydrate from ledger-state.json if needed)
  app.listen(PORT, () => {
    console.log(`LineLock API on http://localhost:${PORT} (${ACTIVE_NETWORK})`);
    console.log(`  base url: ${API_BASE_URL}`);
    console.log(`  facilitator key loaded: ${HAS_REAL_FACILITATOR_KEY} (real paid calls need gas — see STATUS.md)`);
    if (demo) console.log('  ⚠️  --demo: x402 gate DISABLED (paid payload without payment)');
    console.log('  try: curl -i -X POST http://localhost:' + PORT + '/api/edge');
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
