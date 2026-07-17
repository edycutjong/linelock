'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Ledger' },
  { href: '/verify', label: 'Verify' },
  { href: '/agent', label: 'Agent' },
];

export function Nav() {
  const path = usePathname();
  return (
    <div className="topbar">
      <Link href="/" className="brand" style={{ textDecoration: 'none' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="LineLock" />
        <span className="name">LineLock</span>
      </Link>
      <nav className="nav">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={path === l.href ? 'active' : ''}>
            {l.label}
          </Link>
        ))}
        <a href="/verify#cctp" className="btn btn-ghost" style={{ marginLeft: 8 }}>
          Fund via CCTP
        </a>
      </nav>
    </div>
  );
}
