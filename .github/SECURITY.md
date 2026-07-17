# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| latest (`main`) | ✅ |

## Reporting a Vulnerability

Please **do not** open a public issue for security vulnerabilities. Instead,
report them privately:

- Email **edy.cu@live.com**, or
- Use GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) (Security → Report a vulnerability).

You'll get an acknowledgment within 48 hours and a resolution timeline after
triage. Please give us a reasonable window to patch before public disclosure.

## Scope Notes

LineLock settles real USDC over Injective x402. If you find an issue in the
payment gate (`api/middleware.ts`), the pick-commit hashing (`engine/hash.ts`),
the Merkle anchor (`engine/merkle.ts`, `contracts/LedgerAnchor.sol`), or any of
the data invariants **I1–I5**, please report it privately first — these paths
touch value and proof integrity. Never include real private keys in a report;
the ops wallet key is loaded only from a gitignored `.env.local`.
