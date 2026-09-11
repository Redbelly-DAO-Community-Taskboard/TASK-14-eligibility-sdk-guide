// app/api/sdk/route.ts  ·  Secure server-side proxy for the EligibilitySDK.
//
// Keeps AVERER_API_KEY server-only: the browser sets the provider config
// { proxyUrl: "/api/sdk" } and never sees the key. The proxy injects the key,
// validates the target against an allowlist, rate-limits, and forwards.
import { createSecureProxy } from "@redbellynetwork/eligibility-sdk/server";

const proxy = createSecureProxy({
  apiKey: process.env.AVERER_API_KEY!,            // server-only secret
  allowedDomains: ["idp.staging.redbelly.network", "idp.averer.co"],
  rateLimit: { limit: 60, windowMs: 60_000 },     // 60 req/min/IP
  blockedIps: [],
});

// The proxy handles header validation (x-api-backend), domain allowlisting,
// 400/403/429 responses, and key injection. Export both verbs.
export const GET = proxy;
export const POST = proxy;
