/**
 * Redbelly DAO: EligibilitySDK Boilerplate
 *
 * Pre-wired React hooks for useHasChainPermission and useBusinessDetails.
 * Use these components as a starting point for any task requiring eligibility checks.
 *
 * Package: @redbellynetwork/eligibility-sdk
 * Docs: https://docs.redbelly.network/pages/eligibility-sdk/
 *
 * Prerequisites:
 *   npm install @redbellynetwork/eligibility-sdk wagmi viem @tanstack/react-query @reown/appkit @reown/appkit-adapter-wagmi
 */

import React from "react";
import { useHasChainPermission } from "@redbellynetwork/eligibility-sdk";

// ============================================================
// INDIVIDUAL ELIGIBILITY CHECK
// Checks if a wallet address has completed KYC (IndividualOnboardingSDK)
// ============================================================

export function IndividualPermissionStatus({ userAddress }) {
  const { data, error, isLoading, refetch } = useHasChainPermission(userAddress);

  if (!userAddress) return <p>No address provided.</p>;
  if (isLoading) return <p>Checking eligibility...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data ? (
        <p>Address {userAddress} is verified and eligible.</p>
      ) : (
        <p>Address {userAddress} is not eligible. KYC required.</p>
      )}
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

// ============================================================
// BUSINESS DETAILS CHECK
// Checks if a wallet is a verified business (BusinessOnboardingSDK)
// Returns: isBusinessUser, businessContractAddress, businessDetails
// businessDetails contains: companyName, identifier, identifierType,
//   incorporatedName, isBeneficialOwner, companyAddress
// ============================================================

import { useBusinessDetails } from "@redbellynetwork/eligibility-sdk";

export function BusinessPermissionStatus({ businessAddress }) {
  const { data, error, isLoading, refetchBusinessIdentifier } = useBusinessDetails(businessAddress);

  if (!businessAddress) return <p>No address provided.</p>;
  if (isLoading) return <p>Checking business status...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data?.isBusinessUser ? (
        <div>
          <p>Verified business at {businessAddress}</p>
          <p>Business contract: {data.businessContractAddress}</p>
          <p>Company address: {data.businessDetails?.companyAddress}</p>
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
// GATED COMPONENT PATTERN
// Wraps any child component with an eligibility gate.
// Renders children only if the address is eligible.
// ============================================================

export function EligibilityGate({ userAddress, fallback, children }) {
  const { data, isLoading } = useHasChainPermission(userAddress);

  if (isLoading) return <p>Verifying...</p>;
  if (!data) return fallback || <p>Access restricted. KYC verification required.</p>;
  return children;
}

/**
 * Usage example:
 *
 * <EligibilityGate
 *   userAddress={connectedWalletAddress}
 *   fallback={<KYCPromptComponent />}
 * >
 *   <ProtectedFeature />
 * </EligibilityGate>
 */
