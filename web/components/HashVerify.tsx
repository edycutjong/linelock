'use client';
import { useEffect, useState } from 'react';

/** Canonical JSON (sorted keys, recursive) — must match engine/hash.ts. */
function sortDeep(v: any): any {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === 'object') {
    const out: any = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(v[k]);
    return out;
  }
  return v;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function HashVerify({ rawJson, expected }: { rawJson: string; expected: string }) {
  const [state, setState] = useState<{ actual: string; ok: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      const canonical = JSON.stringify(sortDeep(JSON.parse(rawJson)));
      const actual = await sha256Hex(canonical);
      setState({ actual, ok: actual === expected });
    })();
  }, [rawJson, expected]);

  return (
    <div>
      <div className="kv"><span className="k">stored pick_hash</span><span className="v mono">{expected.slice(0, 24)}…</span></div>
      <div className="kv"><span className="k">recomputed (in your browser)</span><span className="v mono">{state ? `${state.actual.slice(0, 24)}…` : 'hashing…'}</span></div>
      <div className="kv">
        <span className="k">I2 tamper check</span>
        <span className="v" style={{ color: state?.ok ? 'var(--color-success)' : state ? 'var(--color-error)' : 'var(--text-mid)' }}>
          {state ? (state.ok ? 'MATCH ✓ — served pick is untampered' : 'MISMATCH ✗') : '…'}
        </span>
      </div>
    </div>
  );
}
