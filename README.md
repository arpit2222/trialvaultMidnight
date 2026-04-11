# TrialVault

TrialVault is a zero-knowledge clinical trial platform built on Midnight Network. It lets pharma teams create trials and view eligibility counts without ever seeing patient identities or health data. Patients generate ZK proofs locally and control selective disclosures while earning TVAULT tokens.

## Architecture
```
Patient Browser
  ├─ Local Health Vault (AES-GCM)
  ├─ ZK Proof Generator (Compact)
  └─ Witness Store (localStorage)
        │
        ▼
Midnight Network
  ├─ Trial Matcher Contract
  ├─ Patient Vault Contract
  ├─ Result Integrity Contract
  └─ Event Reporter Contract
        │
        ▼
Pharma Portal
  └─ Aggregate Eligibility + Consent Counts
```

## Prerequisites
- Node.js 20+
- Lace Wallet configured for Midnight testnet
- Midnight testnet DUST tokens

## Setup
```bash
# from repo root
npm install

# create environment file
cp .env.example .env

# compile contracts
npm run compile --workspace=frontend

# deploy contracts
npm run deploy:contracts

# start dev server
npm run dev
```

## Demo Wallets
1. Pharma wallet
   - Create a new Lace wallet for trial creator actions.
   - Fund it with Midnight testnet DUST.
2. Patient wallet
   - Create a separate Lace wallet for patient actions.
   - Fund it with Midnight testnet DUST.

## Demo Flow
1. Connect as Pharma → register role on-chain.
2. Create a trial → commit protocol hash.
3. Connect as Patient → fill vault → save locally.
4. Prove eligibility → enroll → consent token minted.
5. Pharma dashboard updates eligible counts.

## Contract Addresses (placeholder)
- TVAULT Token: TBD
- Registry: TBD
- Patient Vault: TBD
- Trial Matcher: TBD
- License Market: TBD
- Result Integrity: TBD
- Event Reporter: TBD

## Tech Stack
| Layer | Tech |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Wallet | RainbowKit v2 + wagmi v2 + viem v2 |
| ZK / Contracts | Midnight Network (Compact) |
| Storage | IPFS via Pinata |
| State | Zustand v4 |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion v11 |
| Tables | TanStack Table v8 |
| Date | date-fns v3 |
| HTTP | Axios + TanStack Query v5 |
| Testing | Vitest + React Testing Library |

## Hackathon Track
Healthcare
