// Redbelly Testnet chain definition (chain 153).
// The working RPC is governors.testnet.redbelly.network (verified: eth_chainId = 0x99).
// The older rpc-testnet.redbelly.network endpoint does not currently resolve.
import { defineChain } from "viem";

export const redbellyTestnet = defineChain({
  id: 153,
  caipNetworkId: "eip155:153",
  name: "Redbelly Testnet",
  nativeCurrency: { name: "RBNT", symbol: "RBNT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://governors.testnet.redbelly.network"] },
  },
  blockExplorers: {
    default: { name: "Routescan", url: "https://redbelly.testnet.routescan.io" },
  },
  testnet: true,
});
