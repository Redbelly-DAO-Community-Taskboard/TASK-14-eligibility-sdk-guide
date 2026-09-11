# EligibilitySDK · Integration Patterns and Decision Tree

Which SDK pieces to combine depends on what your dApp needs: gate by individual KYC, gate by business KYB, onboard new users, or verify a one-off proof. This document gives the decision tree (visual diagram in [`decision-tree.png`](diagram/decision-tree.png)) and the recommended pattern for each path.

## Decision tree

![EligibilitySDK integration decision tree](diagram/decision-tree.png)

The Mermaid source (`decision-tree.mmd`) is included so the diagram is reproducible.

## The four building blocks

| Block | Import | Use when |
|---|---|---|
| `useHasChainPermission(address)` | hook | You only need to READ whether a wallet passed individual KYC |
| `useBusinessDetails(address)` | hook | You need business (KYB) status and company details |
| `IndividualOnboarding` / `BusinessOnboardingSdk` | widget | The user has NOT onboarded and you want to run KYC/KYB in-app |
| `EligibilityWidget` and backend verifier | widget and server | You need a fresh zero-knowledge PROOF of a specific credential (e.g. AML passed), verified server-side |

## Patterns

### Pattern A · Read-only gate (most common, lightest)
Gate a feature by existing on-chain permission. No backend.
```
WalletProvider -> EligibilitySDKProvider -> useHasChainPermission -> EligibilityGate
```
Use when your contract already enforces permission and the frontend just needs to show or hide UI.

### Pattern B · Onboard then gate
If the wallet is not eligible, launch onboarding, then re-check.
```
useHasChainPermission == false  ->  <IndividualOnboarding>  ->  refetch()  ->  gate opens
```

### Pattern C · Business gate
```
useBusinessDetails -> if !isBusinessUser -> <BusinessOnboardingSdk> (deploys Business Identifier) -> refetchBusinessIdentifier()
```

### Pattern D · Proof verification (highest assurance)
For actions that need a fresh, specific credential proof (not just chain permission), use the widget plus the backend verifier.
```
<EligibilityWidget queryHandler/authStatusHandler>
   -> POST /auth-request (server builds scope)
   -> wallet submits ZK proof -> POST /callback -> verifier.fullVerify
   -> GET /status/:sessionId -> onSuccess({ proof })
```
Combine D with A when you want both a durable on-chain permission AND a per-session proof.

## Choosing quickly
- Only hiding UI by KYC status? Pattern A.
- Need to bring users through KYC/KYB? B or C.
- Need cryptographic proof of a specific credential for a sensitive action? D.
- Business dApp? C (plus D for sensitive actions).
