#!/usr/bin/env node
/**
 * TrialVault — Midnight Wallet Generator
 * ======================================
 * Generates a fresh BIP39 mnemonic (24 words) for the Midnight testnet deployer wallet.
 *
 * Usage:
 *   node frontend/scripts/generate-wallet.mjs
 *
 * After running:
 *   1. Copy the mnemonic into frontend/.env.local as MIDNIGHT_DEPLOYER_MNEMONIC
 *   2. Copy the address and paste it into: https://faucet.midnight.network
 *   3. Wait ~1 min for tNIGHT tokens (auto-converted to DUST gas tokens)
 *   4. Then run: npm run deploy (from frontend/)
 *
 * SECURITY: Never commit .env.local. The mnemonic is shown once — save it somewhere safe.
 */

import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

// Generate a fresh 24-word mnemonic (256 bits of entropy)
const mnemonic = bip39.generateMnemonic(wordlist, 256);
const entropyBytes = bip39.mnemonicToEntropy(mnemonic, wordlist);
const seedHex = Buffer.from(entropyBytes).toString("hex");

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║          TrialVault — Midnight Testnet Wallet                ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

console.log("✅ NEW WALLET GENERATED\n");
console.log("24-word mnemonic (SAVE THIS SECURELY — shown only once):");
console.log("─────────────────────────────────────────────────────────");
console.log(`  ${mnemonic}`);
console.log("─────────────────────────────────────────────────────────\n");

console.log("Seed (hex-encoded entropy for MIDNIGHT_DEPLOYER_MNEMONIC):");
console.log(`  ${seedHex}\n`);

console.log("📋 NEXT STEPS:");
console.log("  1. Add to frontend/.env.local:");
console.log(`     MIDNIGHT_DEPLOYER_MNEMONIC=${mnemonic}`);
console.log("");
console.log("  2. To get your wallet address and fund it:");
console.log("     - Install Lace Wallet from https://docs.midnight.network/develop/tutorial/tools");
console.log("     - Import using the mnemonic above");
console.log("     - Copy your unshielded address from Lace");
console.log("     - Get tNIGHT tokens from: https://faucet.midnight.network");
console.log("");
console.log("  3. Once funded, compile contracts (requires compact binary):");
console.log("     npm run compile");
console.log("");
console.log("  4. Start the proof server (requires Docker):");
console.log("     docker run -p 6300:6300 ghcr.io/midnight-ntwrk/proof-server:latest");
console.log("");
console.log("  5. Deploy:");
console.log("     npm run deploy");
console.log("");
console.log("  OR for quick hackathon demo (no wallet/deploy needed):");
console.log("     npm run dev  ← runs in demo mode with localStorage\n");
