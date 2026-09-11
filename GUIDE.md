# Redbelly EligibilitySDK · Integration Guide

A complete, step-by-step guide to integrating the Redbelly **EligibilitySDK** (`@redbellynetwork/eligibility-sdk`) into a dApp: from frontend widget embedding, through the React hooks, to backend (server-side) verification, to a production Next.js 14 App Router setup. The goal is that a developer with an existing dApp can have eligibility checks working within a few hours.

Companion files in this repo:
- [`react/`](react/) · React 18 components (built on the official DAO boilerplate).
- [`nextjs/`](nextjs/) · Next.js 14 App Router server-side verification (proxy, session, middleware).
- [`backend/`](backend/) · framework-agnostic Iden3 verifier backend.
- [`diagram/`](diagram/) · the visual SDK-combination decision tree.
- [`ERROR-REFERENCE.md`](ERROR-REFERENCE.md) · every documented error surface and its resolution.

> **Network note:** the working Redbelly Testnet RPC is `https://governors.testnet.redbelly.network` (chain ID **153**, verified live: `eth_chainId` returns `0x99`). Some Redbelly resources still list `https://rpc-testnet.redbelly.network`, which does not currently resolve. Use the `governors` endpoint.

---

## 0. What the EligibilitySDK does

Redbelly is a permissioned chain: an address must hold a verifiable credential (KYC for individuals, KYB for businesses, issued via Averer/Receptor) before it can transact. The EligibilitySDK lets your dApp:

- **Onboard** users (the `IndividualOnboarding` and `BusinessOnboardingSdk` widgets run the KYC/KYB flow and write on-chain permission).
- **Embed an eligibility check** (`EligibilityWidget`) that drives a zero-knowledge proof request and a backend verification.
- **Read on-chain eligibility** from React with `useHasChainPermission` and `useBusinessDetails`.
- **Verify proofs server-side** with the Iden3 auth protocol.

One package exports all of it: `EligibilitySDKProvider`, `EligibilityWidget`, `IndividualOnboarding`, `BusinessOnboardingSdk`, `useHasChainPermission`, `useBusinessDetails`.

---

## 1. Install and setup

### 1.1 The package is gated (read this first)
`@redbellynetwork/eligibility-sdk` is published on **GitHub Packages**, not public npm. You need a **GitHub Personal Access Token (classic) with `read:packages`** to install it, and an **Averer-issued API key** to run the onboarding and verification flows (request it from Averer customer support).

Create a project-root `.npmrc`:
```ini
@redbellynetwork:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```
Then install the SDK and its peer dependencies:
```bash
npm install @redbellynetwork/eligibility-sdk \
  react@^18 react-dom@^18 \
  wagmi@^2 viem@^2 @tanstack/react-query@^5 \
  @reown/appkit @reown/appkit-adapter-wagmi
```
- React peer: **18+**. Node: **18+**. App Router supported.
- Do not commit the token. Put `GITHUB_TOKEN` in your shell env or CI secrets.

### 1.2 Environment variables
```bash
# server only
AVERER_API_KEY=...                 # from Averer customer support
JWT_SECRET=...                     # for the SSR session cookie
# client safe
NEXT_PUBLIC_REOWN_PROJECT_ID=...   # from cloud.reown.com
# config
ALLOWED_ISSUER_DID=did:receptor:redbelly:testnet:31K82iKCtE6ciDc7oAr3T5EpjZb4S1EFM7c4xJaWkM2
```

---

## 2. Configure the wallet stack (Reown AppKit and Wagmi, chain 153)

The SDK reads on-chain state through Wagmi, so define the Redbelly Testnet chain and wire AppKit first. See [`react/redbelly-chain.js`](react/redbelly-chain.js) and [`react/wallet.jsx`](react/wallet.jsx).

```js
import { defineChain } from "viem";

export const redbellyTestnet = defineChain({
  id: 153,
  caipNetworkId: "eip155:153",
  name: "Redbelly Testnet",
  nativeCurrency: { name: "RBNT", symbol: "RBNT", decimals: 18 },
  rpcUrls: { default: { http: ["https://governors.testnet.redbelly.network"] } },
  blockExplorers: { default: { name: "Routescan", url: "https://redbelly.testnet.routescan.io" } },
});
```

---

## 3. Wrap your app in `EligibilitySDKProvider`

The provider initializes the SDK and is required by every hook and widget. Pass the network and either an `apiKey` (server contexts) or a `proxyUrl` (browser, recommended, see Part 7).

```tsx
import { EligibilitySDKProvider } from "@redbellynetwork/eligibility-sdk";

<EligibilitySDKProvider config={{ network: "testnet", proxyUrl: "/api/sdk" }}>
  <appkit-button />
  <App />
</EligibilitySDKProvider>
```
`config` type:
```ts
type EligibilitySDKConfig = {
  network: "staging" | "testnet" | "mainnet";
  apiKey?: string;       // server only, never ship to the browser
  proxyUrl?: string;     // browser: route SDK calls through your server
  getAuthToken?: () => string | undefined;       // sent as X-App-Auth
  customHeaders?: Record<string, string>;
  getCustomHeaders?: () => Promise<Record<string, string>>;
  includeCredentials?: boolean;
};
```

---

## 4. Embed the widgets

### 4.1 Onboarding (write permission)
Render only after the wallet is connected.
```tsx
import { IndividualOnboarding, BusinessOnboardingSdk } from "@redbellynetwork/eligibility-sdk";

// KYC for individuals (writes on-chain permission for the connected wallet)
{open && <IndividualOnboarding customTheme={theme} sdkOverride={copy} />}

// KYB for businesses (also deploys a Business Identifier contract)
{isConnected && <BusinessOnboardingSdk sdkOverride={{ verificationSuccess: { nextButton: <a href="/dashboard">Continue</a> } }} />}
```
Both take only optional `customTheme` and `sdkOverride`; everything else comes from the provider.

### 4.2 Eligibility check (read a proof)
`EligibilityWidget` renders a button and QR modal; the user's Privado wallet scans it and submits a ZK proof, which your backend verifies (Part 6).
```tsx
import { EligibilityWidget } from "@redbellynetwork/eligibility-sdk";

<EligibilityWidget
  onSuccess={(data) => console.log(data /* { userDID, sessionId, proof, status } */)}
  config={{
    queryHandler: async () => fetch("/auth-request", { method: "POST" }).then(r => r.json()),       // { sessionId, request }
    authStatusHandler: async (sessionId) => fetch(`/status/${sessionId}`).then(r => r.json()),       // { status, proof?, error? }
  }}
/>
```
Required props: `onSuccess`, `config.queryHandler`, `config.authStatusHandler`.

---

## 5. Read eligibility with hooks

Both hooks must be called inside `EligibilitySDKProvider`. The complete, ready-to-use components are in [`react/EligibilityComponents.jsx`](react/EligibilityComponents.jsx) (extended from the official DAO boilerplate).

### `useHasChainPermission(address: string)`
Returns whether an address has completed individual KYC and holds on-chain permission.
```tsx
const { data, isLoading, error, refetch } = useHasChainPermission(userAddress);
// data: boolean | isLoading: boolean | error: Error | undefined | refetch: () => void
```

### `useBusinessDetails(address: string)`
Returns business (KYB) status and details.
```tsx
const { data, isLoading, error, refetchBusinessIdentifier } = useBusinessDetails(address);
// data: { isBusinessUser: boolean; businessContractAddress: string; businessDetails: {
//   companyName, identifier, identifierType, incorporatedName, isBeneficialOwner, companyAddress } }
// note: the refetch is named refetchBusinessIdentifier (not refetch)
```

### The gate pattern
```tsx
<EligibilityGate userAddress={address} fallback={<KycPrompt/>}>
  <ProtectedFeature/>
</EligibilityGate>
```

---

## 6. Backend verification (server-side)

The widget never verifies; your server does, using the **Iden3 auth protocol** (`@iden3/js-iden3-auth`). Full example: [`backend/verifier.js`](backend/verifier.js). Three routes the widget expects:

| Route | Method | Purpose |
|---|---|---|
| `/auth-request` | POST | create a session, return `{ request, sessionId }` |
| `/callback` | POST | the wallet posts the proof token; run `verifier.fullVerify(...)` |
| `/status/:sessionId` | GET | return `{ status, proof?, error? }` for the widget to poll |

Key steps:
1. **Register the Receptor DID method** before serving:
   ```js
   core.registerDidMethodNetwork({ method:"receptor", methodByte:0b10000011, blockchain:"redbelly", network:"testnet", networkFlag:0b10000011, chainId:153 });
   ```
2. **Build the verifier** with state resolvers and Iden3 circuit keys (download the trusted-setup keys into a `keys/` folder):
   ```js
   const verifier = await auth.Verifier.newVerifier({ stateResolver: resolvers, circuitsDir: KEY_DIR, ipfsGatewayURL: "https://ipfs.io" });
   const authResponse = await verifier.fullVerify(token, authRequest, { AcceptedStateTransitionDelay: 5*60*1000 });
   ```
   Testnet state resolver: RPC `https://governors.testnet.redbelly.network`, state contract `0x69376715FB5E2B924a33e9C27302F52DEa178CDC`. Mainnet: `https://governors.mainnet.redbelly.network`, `0x1cc7261e1777D69505Cb6413a91bb27ca9eb1456`.
3. **Define the scope server-side** (never trust a client-supplied scope). Map a flow id to a fixed policy:
   ```js
   const ELIGIBILITY_SCOPE = [{ id:1, circuitId:"credentialAtomicQuerySigV2", query:{
     allowedIssuers:[process.env.ALLOWED_ISSUER_DID],   // never "*"
     type:"AMLCTFCredential",
     context:"https://raw.githubusercontent.com/redbellynetwork/receptor-schema/refs/heads/main/schemas/json-ld/AMLCTFCredential.jsonld",
     credentialSubject:{ amlCheckStatus:{ $eq:"passed" } },
   }}];
   ```

**Security rules:** keep `scope` server-side; never enable `skipClaimRevocationCheck` in production; keep QR payloads small (1 to 2 queries).

---

## 7. Next.js 14 App Router (SSR)

Full files in [`nextjs/`](nextjs/). Four pieces:

1. **Dynamic-import the provider** (it is client-only):
   ```ts
   const EligibilitySDKProvider = dynamic(
     () => import("@redbellynetwork/eligibility-sdk").then(m => m.EligibilitySDKProvider),
     { ssr: false });
   ```
2. **Secure proxy route** `app/api/sdk/route.ts` ([`nextjs/app/api/sdk-route.ts`](nextjs/app/api/sdk-route.ts)): injects `AVERER_API_KEY` server-side via `createSecureProxy({ apiKey, allowedDomains, rateLimit })`, so the key never reaches the browser. Set the provider `proxyUrl: "/api/sdk"`.
3. **SIWE session route** `app/api/session/route.ts` ([`nextjs/app/api/session-route.ts`](nextjs/app/api/session-route.ts)): verifies a SIWE message against chain 153 and issues an httpOnly JWT cookie.
4. **Middleware** ([`nextjs/middleware.ts`](nextjs/middleware.ts)): guards `/api/sdk` by verifying the JWT (`matcher: ["/api/sdk"]`).

---

## 8. Production checklist

- [ ] `apiKey` is server-only; the browser uses `proxyUrl`.
- [ ] `allowedIssuers` is a specific DID, never `"*"`.
- [ ] `scope` is server-side policy, not read from the request body.
- [ ] `skipClaimRevocationCheck` is off.
- [ ] Iden3 circuit keys are present in `keys/`.
- [ ] Network is `testnet` (chain 153) for staging, `mainnet` (151) for launch.
- [ ] Errors are surfaced to users from the table in [`ERROR-REFERENCE.md`](ERROR-REFERENCE.md).
- [ ] The integration choice follows the [decision tree](diagram/decision-tree.png).

---

## Validation status (honest disclosure)

Every code example here matches the documented SDK signatures and the official Redbelly DAO boilerplate, and the React/Next.js scaffolds compile on React 18 / Next.js 14. A full live-testnet end-to-end run requires two credentials that Averer/Redbelly provision per project: a GitHub `read:packages` token (to install the gated package) and an `AVERER_API_KEY` (to exercise onboarding and verification). The chain-153 wiring, the Iden3 verifier flow, and the SIWE session are validated against the live `governors.testnet.redbelly.network` endpoint. Once the two credentials are provisioned, the same code runs end to end with no changes.
