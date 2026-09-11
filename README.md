# Redbelly EligibilitySDK · Integration Guide

A complete, step-by-step guide to integrating the Redbelly **EligibilitySDK** (`@redbellynetwork/eligibility-sdk`) into a dApp: frontend widget embedding, the React hooks, backend (server-side) verification, and a production Next.js 14 App Router setup, plus a full error-resolution reference and a visual decision tree.

**Live guide:** https://redbelly.smartcodedbot.com/eligibility

## Contents
- [`GUIDE.md`](GUIDE.md) · the step-by-step integration guide (install through production).
- [`react/`](react/) · React 18 components built on the official Redbelly DAO boilerplate: `useHasChainPermission`, `useBusinessDetails`, the `EligibilityGate` pattern, the onboarding launchers, the `EligibilityWidget`, plus the wallet and chain setup.
- [`nextjs/`](nextjs/) · Next.js 14 App Router server-side verification: the secure SDK proxy route, the SIWE session route, the client-only provider, and middleware.
- [`backend/`](backend/) · a framework-agnostic Iden3 verifier (`/auth-request`, `/callback`, `/status/:sessionId`).
- [`diagram/`](diagram/) · the SDK-combination decision tree as a visual diagram ([`decision-tree.png`](diagram/decision-tree.png)) plus reproducible Mermaid source and the integration-patterns write-up.
- [`ERROR-REFERENCE.md`](ERROR-REFERENCE.md) · every documented error surface, its cause, and its resolution.

## Quick map to the task requirements
| Requirement | Where |
|---|---|
| Step-by-step guide (frontend to backend to production) | `GUIDE.md` |
| React `useHasChainPermission` and `useBusinessDetails` | `react/EligibilityComponents.jsx` |
| Next.js App Router server-side verification | `nextjs/` |
| Integration patterns with a visual decision tree | `diagram/` |
| Error resolution for every documented error | `ERROR-REFERENCE.md` |

## Notes
- Working testnet RPC: `https://governors.testnet.redbelly.network` (chain **153**). The older `rpc-testnet.redbelly.network` listed in some resources does not currently resolve.
- The SDK is published on GitHub Packages (needs a `read:packages` token) and the onboarding/verification flows need an Averer API key. Code here matches the documented signatures and the official DAO boilerplate; a full live-testnet run needs those two credentials. See the validation note in `GUIDE.md`.

MIT licensed. See [LICENSE](LICENSE).
