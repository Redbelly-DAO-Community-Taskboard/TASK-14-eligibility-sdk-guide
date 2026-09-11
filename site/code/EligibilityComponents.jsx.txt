/**
 * Redbelly EligibilitySDK · React 18 components
 *
 * Extends the official Redbelly DAO boilerplate
 * (Redbelly-DAO-Community-Taskboard/resources/eligibility-sdk-boilerplate)
 * with the widget embeds and a complete, drop-in set of patterns.
 *
 * Package: @redbellynetwork/eligibility-sdk
 * Docs: https://docs.redbelly.network/pages/eligibility-sdk/
 *
 * Must be rendered inside <EligibilitySDKProvider> (see App.jsx), which itself
 * must be inside the wallet provider (see wallet.jsx).
 */
import React, { useState } from "react";
import {
  useHasChainPermission,
  useBusinessDetails,
  EligibilityWidget,
  IndividualOnboarding,
  BusinessOnboardingSdk,
} from "@redbellynetwork/eligibility-sdk";

// ============================================================
// 1. INDIVIDUAL ELIGIBILITY CHECK  (useHasChainPermission)
// True if the wallet has completed individual KYC (IndividualOnboarding).
// ============================================================
export function IndividualPermissionStatus({ userAddress }) {
  const { data, error, isLoading, refetch } = useHasChainPermission(userAddress);

  if (!userAddress) return <p>Connect a wallet to check eligibility.</p>;
  if (isLoading) return <p>Checking eligibility...</p>;
  if (error) return <p role="alert">Error: {error.message} <button onClick={refetch}>Retry</button></p>;

  return (
    <div>
      {data
        ? <p>Address {userAddress} is verified and eligible.</p>
        : <p>Address {userAddress} is not eligible. KYC required.</p>}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

// ============================================================
// 2. BUSINESS DETAILS CHECK  (useBusinessDetails)
// Returns isBusinessUser, businessContractAddress, and businessDetails
// (companyName, identifier, identifierType, incorporatedName,
//  isBeneficialOwner, companyAddress). Note: the refetch is named
// refetchBusinessIdentifier (not refetch).
// ============================================================
export function BusinessPermissionStatus({ businessAddress }) {
  const { data, error, isLoading, refetchBusinessIdentifier } = useBusinessDetails(businessAddress);

  if (!businessAddress) return <p>Connect a wallet to check business status.</p>;
  if (isLoading) return <p>Checking business status...</p>;
  if (error) return <p role="alert">Error: {error.message} <button onClick={refetchBusinessIdentifier}>Retry</button></p>;

  return (
    <div>
      {data?.isBusinessUser ? (
        <div>
          <p>Verified business at {businessAddress}</p>
          <p>Business contract: {data.businessContractAddress}</p>
          <p>Company: {data.businessDetails?.companyName}</p>
          <pre>{JSON.stringify(data.businessDetails, null, 2)}</pre>
        </div>
      ) : (
        <p>Address {businessAddress} is not a verified business.</p>
      )}
      <button onClick={refetchBusinessIdentifier}>Refresh</button>
    </div>
  );
}

// ============================================================
// 3. GATE PATTERN
// Render children only if the address is eligible; otherwise a fallback.
// ============================================================
export function EligibilityGate({ userAddress, fallback, children }) {
  const { data, isLoading, error } = useHasChainPermission(userAddress);
  if (isLoading) return <p>Verifying...</p>;
  if (error) return fallback || <p>Could not verify eligibility. Try again.</p>;
  if (!data) return fallback || <p>Access restricted. KYC verification required.</p>;
  return children;
}

// ============================================================
// 4. ONBOARDING LAUNCHERS  (write on-chain permission)
// IndividualOnboarding = KYC. BusinessOnboardingSdk = KYB (also deploys a
// Business Identifier contract). Both take only optional customTheme/sdkOverride.
// ============================================================
export function IndividualOnboardingLauncher({ theme, copy }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Start KYC</button>
      {open && <IndividualOnboarding customTheme={theme} sdkOverride={copy} />}
    </div>
  );
}

export function BusinessOnboardingLauncher({ isConnected, copy }) {
  if (!isConnected) return <p>Connect a wallet to begin business onboarding.</p>;
  return (
    <BusinessOnboardingSdk
      sdkOverride={copy || { verificationSuccess: { nextButton: <a href="/dashboard">Continue</a> } }}
    />
  );
}

// ============================================================
// 5. ELIGIBILITY WIDGET  (drives a ZK-proof request -> backend verify)
// queryHandler hits your POST /auth-request; authStatusHandler polls
// GET /status/:sessionId. onSuccess gets { userDID, sessionId, proof, status }.
// ============================================================
export function EligibilityCheck({ onVerified }) {
  return (
    <EligibilityWidget
      onSuccess={(data) => onVerified?.(data)}
      config={{
        queryHandler: async () => {
          const r = await fetch("/auth-request", { method: "POST" });
          if (!r.ok) throw new Error(`auth-request failed: ${r.status}`);
          return r.json(); // { sessionId, request }
        },
        authStatusHandler: async (sessionId) => {
          const r = await fetch(`/status/${sessionId}`);
          if (!r.ok) throw new Error(`status failed: ${r.status}`);
          return r.json(); // { status, proof?, error? }
        },
      }}
    />
  );
}

/**
 * Gate usage:
 *
 * <EligibilityGate userAddress={address} fallback={<IndividualOnboardingLauncher />}>
 *   <ProtectedFeature />
 * </EligibilityGate>
 */
