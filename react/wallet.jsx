// Wallet stack: Reown AppKit + Wagmi adapter for Redbelly Testnet (chain 153).
// The EligibilitySDK reads on-chain state through wagmi, so this must wrap the app
// ABOVE EligibilitySDKProvider.
//
// Env: NEXT_PUBLIC_REOWN_PROJECT_ID (from cloud.reown.com)
import React from "react";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { redbellyTestnet } from "./redbelly-chain";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID; // required
if (!projectId) throw new Error("Project ID is not defined"); // matches the SDK's documented error

const networks = [redbellyTestnet];

const wagmiAdapter = new WagmiAdapter({ projectId, networks });

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: "Redbelly dApp",
    description: "EligibilitySDK integration",
    url: "https://example.com",
    icons: ["https://example.com/icon.png"],
  },
});

const queryClient = new QueryClient();

export function WalletProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
