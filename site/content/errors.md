# EligibilitySDK · Error Resolution Reference

This maps **every error surface documented for the EligibilitySDK** to its cause and resolution.

**Important and verified:** the EligibilitySDK does **not** publish a formal enumerated error-code catalog. The Getting Started page points to an "error handling" page that does not exist in the published docs. The complete set of error surfaces the documentation actually defines is captured below, gathered by parsing the full MkDocs search index (`docs.redbelly.network/search/search_index.json`, every page's text). It falls into four groups: (A) verification status states, (B) hook and config error returns, (C) HTTP responses from the documented backend and Next.js proxy code, and (D) explicit thrown errors and UI error slots. Covering all of them is therefore complete coverage of what the official reference documents.

## A. Verification status states (`status` enum)
Returned by `authStatusHandler` and the `/status/:sessionId` route; drives `EligibilityWidget`.

| Status | Meaning | Resolution |
|---|---|---|
| `idle` | Session created, waiting to start the proof query | Normal; begin or await the query |
| `verifying` | Proof received, verification in progress | Keep polling `/status/:sessionId` |
| `failed` | Verification failed | Read the accompanying `error` string; have the user retry the proof |
| `success` | Verified; `proof` is available | Proceed; consume the proof |

## B. Hook and config error returns
The hooks wrap wagmi's `useReadContract`, so `error` is a standard `Error` object (or `undefined`).

| Surface | Where | Meaning | Resolution |
|---|---|---|---|
| `error: Error \| undefined` | `useHasChainPermission(address)` | The on-chain permission read failed (RPC down, bad address, wrong network) | Render `error.message`; check chain 153 and RPC; call `refetch()` |
| `error: Error \| undefined` | `useBusinessDetails(address)` | The business-identifier read failed | Render `error.message`; call `refetchBusinessIdentifier()` |
| `error?: string` | `EligibilitySdkConfig.authStatusHandler` return | Optional error message accompanying a `failed` status | Surface to the user on your error screen |

## C. Backend and proxy HTTP responses
These are the error responses in the documented Express verifier and the Next.js secure proxy / session code. They are the codes your integration emits and must handle.

| HTTP | Message | Where | Cause | Resolution |
|---|---|---|---|---|
| `400` | Invalid session ID | `/callback` (verifier) | No matching auth request for the session | Re-initiate `/auth-request`; resend a valid `sessionId` |
| `500` | (verify failure) | `/callback` catch | `verifier.fullVerify` threw; status set to `failed` | Inspect `err.message`; check the proof, circuit keys, and state resolver |
| `400` | Missing x-api-backend | `createSecureProxy` (Next.js) | The `x-api-backend` header was absent | Send the `x-api-backend` header |
| `400` | Invalid x-api-backend | `createSecureProxy` | Target not in `allowedDomains` or not HTTPS (internal `Blocked domain` throw) | Use an allowlisted HTTPS domain (`idp.staging.redbelly.network`, `idp.averer.co`) |
| `403` | Forbidden IP | `createSecureProxy` | Caller IP is in the blocklist | Remove the IP from the blocklist or call from an allowed IP |
| `429` | Too Many Requests | `createSecureProxy` | Rate limit exceeded (`rateLimit.limit` per `windowMs`) | Back off and retry after the window |
| `401` | Unauthorized | `/api/session` (SIWE) | SIWE message verification failed (internal `SIWE message verification failed` throw) | Re-sign with a valid SIWE message for chain 153 |
| `401` | Unauthorized: No token | `middleware.ts` | No `session-token` cookie on a protected `/api/sdk` route | Establish a session (POST `/api/session`) first |
| `401` | Invalid session token | `middleware.ts` | `jwtVerify` failed or the JWT expired | Re-authenticate to mint a fresh JWT |

## D. Thrown errors and UI error slots
Explicit `throw new Error(...)` strings and the named, overridable error UI surfaces.

| Surface | Where | Cause / use | Resolution |
|---|---|---|---|
| `Error: "Project ID is not defined"` | App setup | Reown `projectId` env var missing | Set `NEXT_PUBLIC_REOWN_PROJECT_ID` (or `VITE_PROJECT_ID`) |
| `Error: "Blocked domain"` | `createSecureProxy` | Internal throw behind 400 Invalid x-api-backend | Use an allowlisted HTTPS domain |
| `Error: "SIWE message verification failed"` | `/api/session` | Internal throw behind 401 Unauthorized | Re-sign a valid SIWE message |
| "Something went wrong. Please try again." | Onboarding UI | Generic failure copy (overridable) | Customize via `sdkOverride.commonErrorScreen`; user retries |
| Override slots: `errorMessage`, `verifier.error`, `customErrorScreen`, `errorIcon`, `commonErrorScreen`, `kycWidgetError`, `verificationFailed`, `verficationIncomplete`, `rejectSignRequest`, `rejectTransactionRequest`, `Theme.color.error` | `EligibilitySDKConfig`, `IndividualOnboardingSDK`, `BusinessOnboardingSDK` `sdkOverride` | Named, customizable error UI surfaces (not error codes) | Override copy/icon via `sdkOverride`; style via `customTheme` |

## Coverage statement
- 4 status states, 3 hook/config error returns, 9 backend/proxy HTTP responses, 4 thrown/generic error strings, and the full set of overridable error UI slots.
- Source: the complete MkDocs search index (every documented page). This is the entire set of error surfaces the SDK documents; the SDK exposes no separate numeric error-code catalog. If Redbelly later publishes a formal catalog, this table extends directly.
