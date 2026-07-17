import type { Metadata } from 'next';
import './globals.css';
import { Nav } from '../components/Nav';

export const metadata: Metadata = {
  title: 'LineLock — lock the line, prove the pick',
  description:
    'Pay-per-pick World Cup edge on Injective x402. The USDC receipt is the pre-kickoff timestamp; a free public ledger CLV-scores every settled pick — losses included.',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mesh" />
        <div className="scan-lines" />
        <Nav />
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
