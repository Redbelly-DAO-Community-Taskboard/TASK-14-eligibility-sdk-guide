// app/provider.tsx  ·  Client-only wrapper for the EligibilitySDK in App Router.
// The provider is client-only, so dynamic-import it with { ssr: false } and use
// proxyUrl (not a client apiKey).
"use client";
import dynamic from "next/dynamic";
import { WalletProvider } from "../lib/wallet"; // the wagmi/AppKit provider

const EligibilitySDKProvider = dynamic(
  () => import("@redbellynetwork/eligibility-sdk").then((m) => m.EligibilitySDKProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <EligibilitySDKProvider config={{ network: "testnet", proxyUrl: "/api/sdk" }}>
        {children}
      </EligibilitySDKProvider>
    </WalletProvider>
  );
}
