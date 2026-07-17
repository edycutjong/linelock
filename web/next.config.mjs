/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: LINELOCK_API_URL is read at RUNTIME in lib/ledger.ts (server-side),
  // NOT declared here — a next.config `env` block would inline it at build time.
  // Unset → the site renders from the committed ../fixtures/ledger-state.json;
  // set → server components fetch the live API (with the fixture as fallback).
};
export default nextConfig;
