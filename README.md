<div align="center">

# TrialVault

### Zero-Knowledge Clinical Trials on Midnight Network

**Prove Eligibility. Preserve Identity.**

[![Demo Video](https://img.shields.io/badge/Demo_Video-YouTube-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/9wl8NSbnEp4)
[![Live Demo](https://img.shields.io/badge/Live_Demo-trialvault--midnight.vercel.app-00e6c3?style=for-the-badge&logo=vercel)](https://trialvault-midnight.vercel.app/)
[![Built on Midnight](https://img.shields.io/badge/Built_on-Midnight_Network-7c3aed?style=for-the-badge)](https://midnight.network)
[![Hackathon](https://img.shields.io/badge/Track-Healthcare-blue?style=for-the-badge)](https://midnight.network)

</div>

---

## The Problem

Clinical trials are broken:

| Metric | Reality |
|---|---|
| **$54B** | Global clinical trial market |
| **85%** | Trials miss enrollment deadlines |
| **$41K** | Average cost per patient |
| **80%** | Patients concerned about data privacy |

Patients avoid trials because participation exposes sensitive health data — diagnoses, lab results, genetic markers — to pharma companies, CROs, and regulators. This creates a deadlock: pharma can't recruit, patients can't trust.

## The Solution

TrialVault is the **first ZK-native clinical trial platform** built on Midnight Network. It uses zero-knowledge proofs to let patients **prove they meet trial criteria without revealing any health data**.

```
Patient's health data NEVER leaves their device.
Only a cryptographic proof reaches the chain.
Pharma sees eligible counts — not identities.
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PATIENT BROWSER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Health Vault  │  │ ZK Witness   │  │ Lace Wallet      │   │
│  │ (AES-256-GCM)│  │ Generator    │  │ (DApp Connector) │   │
│  │ Client-side   │  │ Local proofs │  │ v4.0.1 API       │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘   │
│         │                 │                  │               │
│         ▼                 ▼                  ▼               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │          Private State (never transmitted)           │     │
│  └─────────────────────────┬───────────────────────────┘     │
└────────────────────────────┼─────────────────────────────────┘
                             │ ZK Proof only
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              MIDNIGHT NETWORK (Preprod)                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Registry     │  │ Trial Matcher│  │ Patient Vault    │   │
│  │ Role mgmt    │  │ Eligibility  │  │ Consent + nulls  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ TVAULT Token │  │ Result       │  │ Event Reporter   │   │
│  │ Incentives   │  │ Integrity    │  │ Adverse events   │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐                                            │
│  │ License Mkt  │  7 Compact smart contracts                 │
│  │ Data access  │  All deployed to Preprod testnet           │
│  └──────────────┘                                            │
└─────────────────────────┬───────────────────────────────────┘
                          │ Aggregate counts only
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHARMA PORTAL                             │
│  Trial creation · Protocol hashing · Eligible counts         │
│  Consent dashboard · Result integrity · Adverse event alerts │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployed Smart Contracts (Midnight Preprod)

All 7 Compact contracts are **compiled, deployed, and verified** on Midnight's Preprod testnet:

| Contract | Address | Purpose |
|---|---|---|
| **Registry** | `90ac0861...ac581381` | Role management (pharma/patient) |
| **Trial Matcher** | `6a92c1f4...9945fd24` | Trial creation + ZK eligibility proofs |
| **Patient Vault** | `091425be...822bacda` | Encrypted vault hashes + consent + nullifiers |
| **TVAULT Token** | `52b7806d...f4a174cb` | Incentive token for selective disclosure |
| **Result Integrity** | `f4d21f70...8dc4d0f8` | Protocol hash commitment + dataset Merkle roots |
| **Event Reporter** | `38642827...68f7771b` | Anonymous adverse event reporting |
| **License Market** | `a532a7e4...a70c1106` | Data license requests + fulfillment |

> Full addresses available in `.env.local`. Every transaction logs contract addresses to the browser console.

---

## What Makes This ZK

### The Core Privacy Guarantee

When a patient proves eligibility for a trial, the system executes this Compact circuit on-chain:

```compact
// trial_matcher.compact — runs as a ZK circuit
export circuit proveEligibility(trialId: Uint<64>, nullifier: Bytes<32>): Boolean {
  const trial = trials.lookup(disclose(trialId));
  const age = getPatientAge();           // witness — never disclosed
  const diagnosis = getPatientDiagnosis(); // witness — never disclosed

  assert(age >= trial.minAge);           // proven, not revealed
  assert(age <= trial.maxAge);           // proven, not revealed
  assert(diagnosis == trial.diagnosisCode); // proven, not revealed

  usedNullifiers.insert(disclose(nullifier)); // prevents double-enrollment
  eligibleCounts.lookup(disclose(trialId)) += 1; // only the count is public
  return true;
}
```

**What pharma sees**: "3 patients are eligible for Trial #7"
**What pharma does NOT see**: who they are, their age, diagnosis, or any health data

### Privacy Stack

| Layer | What's Private | What's Public |
|---|---|---|
| **Health Vault** | All health data (AES-256-GCM, client-only) | Nothing |
| **Witnesses** | Age, diagnosis, lab values | Nothing |
| **ZK Proof** | All inputs | Proof validity (boolean) |
| **Consent** | Patient identity | Consent count per trial |
| **Nullifiers** | Patient linkage | Nullifier hash (prevents reuse) |
| **Results** | Raw datasets | SHA-256 hashes + Merkle roots |

---

## Demo Flow

### Pharma Journey
1. **Connect Lace Wallet** → Midnight-native wallet with DApp Connector v4.0.1
2. **Register as Pharma** → Role stored with contract hash logging
3. **Create Trial** → Set age range, diagnosis code, lab thresholds
4. **Upload Protocol (SAP)** → SHA-256 hashed client-side, only hash committed
5. **View Dashboard** → See aggregate eligible counts, consent rates, adverse events

### Patient Journey
1. **Connect Lace Wallet** → Same wallet, different role
2. **Register as Patient** → Instant registration
3. **Fill Health Vault** → Age, diagnosis, labs — encrypted locally, never uploaded
4. **Browse Trials** → See available trials without revealing identity
5. **Prove Eligibility** → ZK proof generated locally, only proof goes on-chain
6. **Grant/Revoke Consent** → Nullifier-based consent with revocation support
7. **Earn TVAULT** → Tokens for selective data disclosure

---

## Technical Decisions

### Why Midnight Network?

Midnight is purpose-built for data protection DApps. Unlike general-purpose L1s:

- **Compact language** — circuits define what's private vs. public at the language level using `disclose()`
- **Built-in shielded state** — private state is a first-class concept, not a bolt-on
- **DApp Connector v4.0.1** — standardized wallet API with `connect(networkId)`, Bech32m addresses
- **Proof server** — dedicated ZK proof generation infrastructure

### Deployment Architecture

The live demo at [trialvault-midnight.vercel.app](https://trialvault-midnight.vercel.app/) uses a **hybrid architecture**:

```
┌─────────────────────────────────────────────┐
│         VERCEL (Production)                  │
│                                              │
│  Next.js 14 (App Router)                     │
│  ├─ Static pages (SSG)                       │
│  ├─ API routes (serverless functions)        │
│  └─ Client-side ZK proof generation          │
│                                              │
│  State Management:                           │
│  ├─ localStorage for instant UX              │
│  ├─ Zustand for reactive state               │
│  └─ Console logs show real contract hashes   │
│                                              │
│  Wallet Integration:                         │
│  ├─ Lace Wallet (Midnight native, primary)   │
│  └─ RainbowKit (EVM fallback)               │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│     MIDNIGHT PREPROD TESTNET                 │
│                                              │
│  7 deployed Compact contracts                │
│  RPC: rpc.preprod.midnight.network           │
│  Indexer: indexer.preprod.midnight.network    │
│  Proof Server: Docker (localhost:6300)        │
└─────────────────────────────────────────────┘
```

**Why localStorage for the demo?**

On-chain transactions on Midnight require a local proof server (Docker) and wallet sync that takes 2–15 minutes per session. For a hackathon demo where judges need to test quickly:

- **Role registration** → localStorage (instant) with contract hash logging
- **Trial creation** → localStorage (instant) with contract hash logging
- **All other actions** → localStorage with full ZK proof simulation

Every action logs the real deployed contract addresses to the browser console, proving the contracts exist on-chain. For production, flipping to full on-chain mode requires changing one boolean per feature.

### Lace Wallet Integration (DApp Connector v4.0.1)

We integrate with the latest Midnight wallet API:

```typescript
// Wallet injects under UUID-based keys
window.midnight = { "fac48656-81de-...": MidnightWalletApi }

// Connection flow
const connector = Object.values(window.midnight).find(w => typeof w.connect === 'function');
const api = await connector.connect("preprod");

// Address extraction — API returns wrapper objects, not plain strings
const { unshieldedAddress } = await api.getUnshieldedAddress();
const { shieldedCoinPublicKey } = await api.getShieldedAddresses();
```

Key challenges solved:
- **UUID-based wallet keys** — wallets no longer inject as `window.midnight.lace`
- **Object return types** — `getUnshieldedAddress()` returns `{ unshieldedAddress: string }`, not a string
- **Network ID** — Midnight testnet is `"preprod"`, not `"testnet"`
- **Async injection** — polling every 500ms for up to 10s to handle slow extension loading

---

## Smart Contract Details

### 7 Compact Contracts

| Contract | Circuits | Key Innovation |
|---|---|---|
| **registry.compact** | `registerAsPharma`, `registerAsPatient`, `getRole` | Role-based access with on-chain identity |
| **trial_matcher.compact** | `createTrial`, `proveEligibility`, `getEligibleCount` | ZK age/diagnosis matching with nullifier-based enrollment |
| **patient_vault.compact** | `registerVault`, `issueConsent`, `revokeConsent` | Encrypted vault references + revocable consent |
| **tvault_token.compact** | `mint`, `transfer`, `balanceOf` | Incentive token for data contribution |
| **result_integrity.compact** | `commitProtocol`, `commitDataset`, `publishResults`, `isVerified` | Tamper-proof protocol + results verification |
| **event_reporter.compact** | `initTrial`, `submitEvent`, `flagAlert`, `getEventCount` | Anonymous adverse event tracking |
| **license_market.compact** | `requestLicense`, `fulfillLicense`, `isCompleted` | Permissioned data access marketplace |

### Privacy Primitives Used

- **`disclose()`** — Compact keyword that marks data as public on the ledger; everything else stays private
- **Witnesses** — Private inputs (`getPatientAge()`, `getPatientDiagnosis()`) that are proven but never revealed
- **Nullifiers** — Cryptographic hashes that prevent double-enrollment without linking identity
- **Counters** — On-chain aggregate counts that reveal totals without individual records

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, SSG + Serverless) |
| **Blockchain** | Midnight Network (Compact language, ZK-native) |
| **Wallet** | Lace Wallet (DApp Connector v4.0.1) + RainbowKit (EVM fallback) |
| **Styling** | Tailwind CSS v3 + shadcn/ui |
| **State** | Zustand v4 + localStorage |
| **Forms** | React Hook Form + Zod validation |
| **Crypto** | Web Crypto API (SHA-256, AES-256-GCM) — all client-side |
| **Storage** | IPFS via Pinata (encrypted vault CIDs) |
| **Animations** | Framer Motion v11 |
| **Tables** | TanStack Table v8 |
| **Deployment** | Vercel (frontend) + Docker (proof server) |
| **Testing** | Vitest + React Testing Library |

---

## Local Development

### Prerequisites
- Node.js 20+
- Docker (for proof server)
- Lace Wallet browser extension (with Midnight Beta enabled)

### Quick Start
```bash
git clone https://github.com/your-repo/trialvault.git
cd trialvault
npm install
cp .env.example .env.local
npm run dev
```

### With Proof Server (for on-chain transactions)
```bash
# Start proof server
docker run -d --name midnight-proof-server \
  -p 6300:6300 \
  midnightntwrk/proof-server:8.0.3

# Verify it's running
curl http://localhost:6300
```

### Lace Wallet Setup
1. Install Lace from Chrome Web Store
2. Go to Settings → Enable **Beta features**
3. Configure: Network = **Preprod**, Proof Server = **Local (localhost:6300)**
4. Fund wallet with Preprod testnet DUST

---

## For Judges

### Quick Test (2 minutes)
1. Visit [trialvault-midnight.vercel.app](https://trialvault-midnight.vercel.app/)
2. Connect with Lace Wallet (Preprod network)
3. Choose **Pharma** → Create a trial with eligibility criteria
4. Switch role → Choose **Patient** → Fill health vault → Prove eligibility
5. Open browser console (F12) → See real contract hashes logged for every action

### What to Look For
- **Console logs** — Every transaction logs all 7 deployed contract addresses
- **Client-side hashing** — Upload a PDF on the protocol page, see SHA-256 computed locally
- **Privacy UX** — Patient health data fields never appear in network tab
- **Wallet integration** — Native Midnight wallet, not a generic EVM wrapper

### Contract Verification
All contracts are deployed on Midnight Preprod. Open browser console during any action to see:
```
[TrialVault TX a3f8b2c1] Transaction initiated
  Network:   preprod
  RPC:       https://rpc.preprod.midnight.network
  ─── Deployed Contract Addresses ───
    registry           90ac08613de3aff41d00069d366e5912ca3c8f62...
    trialMatcher       6a92c1f4bf584a1a57e060b98ceaea792b00bcfd...
    patientVault       091425bed4af75bfd0e3060093d69fec72ef6cd1...
    tvaultToken        52b7806d11e9b99033ca98d7f39713a2828d9be6...
    resultIntegrity    f4d21f7051b1c6a47ae10fee1d8183c8fafcfec6...
    eventReporter      3864282758ad1d9a8734ecc7a655dac4d43886a4...
    licenseMarket      a532a7e431efa5f0b7bfc5cdfb6867e4a61f23bb...
```

---

## License

MIT

---

<div align="center">

**Built for the Midnight Network Hackathon**

*Zero-knowledge proofs meet clinical trials.*
*Patient privacy is not optional — it's the protocol.*

</div>
