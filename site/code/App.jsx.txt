// Full React 18 wiring: wallet provider -> EligibilitySDKProvider -> components.
import React from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { EligibilitySDKProvider } from "@redbellynetwork/eligibility-sdk";
import { WalletProvider } from "./wallet";
import {
  IndividualPermissionStatus,
  BusinessPermissionStatus,
  EligibilityGate,
  IndividualOnboardingLauncher,
  EligibilityCheck,
} from "./EligibilityComponents";

function Dapp() {
  const { address, isConnected } = useAppKitAccount();
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1>Redbelly EligibilitySDK demo</h1>
      {/* Reown's connect button (web component registered by createAppKit) */}
      <appkit-button />

      <h2>Individual eligibility</h2>
      <IndividualPermissionStatus userAddress={address} />
      <IndividualOnboardingLauncher />

      <h2>Business status</h2>
      <BusinessPermissionStatus businessAddress={address} />

      <h2>Gated feature</h2>
      <EligibilityGate userAddress={address} fallback={<p>Complete KYC to unlock.</p>}>
        <p>Protected content visible only to eligible wallets.</p>
      </EligibilityGate>

      <h2>Proof check (widget)</h2>
      <EligibilityCheck onVerified={(d) => console.log("verified", d)} />

      {!isConnected && <p>Connect your wallet to begin.</p>}
    </main>
  );
}

export default function App() {
  return (
    <WalletProvider>
      {/* In the browser, prefer proxyUrl over a client-side apiKey (see nextjs/). */}
      <EligibilitySDKProvider config={{ network: "testnet", proxyUrl: "/api/sdk" }}>
        <Dapp />
      </EligibilitySDKProvider>
    </WalletProvider>
  );
}
