/**
 * TrialVault — Contract Deployment Script
 * =========================================
 * Deploys all 7 Compact contracts to Midnight Network testnet using the official
 * @midnight-ntwrk/midnight-js-contracts SDK.
 *
 * ─── PREREQUISITES ──────────────────────────────────────────────────────────
 *
 * 1. Install the Compact compiler binary (NOT on npm — manual download):
 *      https://docs.midnight.network/develop/tutorial/tools
 *    Extract and add to PATH:
 *      chmod +x ~/Downloads/compactc && sudo mv ~/Downloads/compactc /usr/local/bin/compact
 *
 * 2. Compile contracts:
 *      cd frontend && npm run compile
 *    Generates: contracts/build/<name>/{contract.cjs,*.zkir,*.pk,*.vk} etc.
 *
 * 3. Start the ZK proof server (Docker):
 *      docker run -p 6300:6300 ghcr.io/midnight-ntwrk/proof-server:latest
 *
 * 4. Create + fund a deployer wallet:
 *      node scripts/generate-wallet.mjs
 *    Import the mnemonic into Lace Wallet → get unshielded address →
 *    paste at https://faucet.midnight.network
 *    Add to frontend/.env.local: MIDNIGHT_DEPLOYER_MNEMONIC=<24 words>
 *
 * ─── USAGE ──────────────────────────────────────────────────────────────────
 *   npm run deploy               Deploy all (skip already-deployed)
 *   npm run deploy -- --reset    Force re-deploy all
 *   npm run deploy -- --dry-run  Validate artifacts, skip network
 *
 * ─── OUTPUT ─────────────────────────────────────────────────────────────────
 * Writes contracts/deploy/addresses.json after each successful deploy.
 * Copy addresses into frontend/.env.local when done.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

// @midnight-ntwrk SDK imports
import { WalletBuilder } from "@midnight-ntwrk/wallet";
import { NetworkId } from "@midnight-ntwrk/zswap";
import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { ZKConfigProvider } from "@midnight-ntwrk/midnight-js-types";
import type {
  MidnightProviders,
  PrivateStateProvider,
  PublicDataProvider,
  ProofProvider,
  WalletProvider,
  MidnightProvider,
  ZKIR,
  ProverKey,
  VerifierKey,
} from "@midnight-ntwrk/midnight-js-types";
import type { PrivateStateId } from "@midnight-ntwrk/midnight-js-types";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTRACTS_DIR = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(CONTRACTS_DIR, "build");
const ADDRESSES_FILE = path.join(__dirname, "addresses.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AddressMap {
  tvaultToken: string;
  registry: string;
  patientVault: string;
  trialMatcher: string;
  licenseMarket: string;
  resultIntegrity: string;
  eventReporter: string;
}

type ContractKey = keyof AddressMap;

/** What compact compile generates inside contracts/build/<name>/ */
interface CompiledArtifacts {
  /** Path to the contract's CJS module (default export = contract class) */
  contractModule: string;
  /** Directory containing *.zkir, *.pk, *.vk files */
  zkAssetsDir: string;
}

// ---------------------------------------------------------------------------
// Deployment order — respects dependency graph
// ---------------------------------------------------------------------------

const DEPLOY_ORDER: Array<{
  key: ContractKey;
  dir: string;
  hasPrivateState: boolean;
  dependsOn?: ContractKey[];
}> = [
  { key: "tvaultToken", dir: "tvault_token", hasPrivateState: false },
  { key: "registry", dir: "registry", hasPrivateState: false },
  { key: "patientVault", dir: "patient_vault", hasPrivateState: true, dependsOn: ["registry"] },
  { key: "trialMatcher", dir: "trial_matcher", hasPrivateState: false, dependsOn: ["patientVault"] },
  { key: "licenseMarket", dir: "license_market", hasPrivateState: false, dependsOn: ["trialMatcher", "tvaultToken"] },
  { key: "resultIntegrity", dir: "result_integrity", hasPrivateState: false, dependsOn: ["trialMatcher"] },
  { key: "eventReporter", dir: "event_reporter", hasPrivateState: false, dependsOn: ["trialMatcher"] },
];

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const log = (msg: string) => console.log(`[deploy] ${msg}`);
const ok = (msg: string) => console.log(`[deploy] ✓ ${msg}`);
const skip = (msg: string) => console.log(`[deploy] ↩ ${msg}`);
const err = (msg: string) => console.error(`[deploy] ✗ ${msg}`);

// ---------------------------------------------------------------------------
// Address persistence
// ---------------------------------------------------------------------------

function loadAddresses(): AddressMap {
  if (!fs.existsSync(ADDRESSES_FILE)) {
    return { tvaultToken: "", registry: "", patientVault: "", trialMatcher: "", licenseMarket: "", resultIntegrity: "", eventReporter: "" };
  }
  return JSON.parse(fs.readFileSync(ADDRESSES_FILE, "utf-8")) as AddressMap;
}

function saveAddresses(addresses: AddressMap): void {
  fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2));
  log("Addresses saved to contracts/deploy/addresses.json");
}

// ---------------------------------------------------------------------------
// Artifact validation
// ---------------------------------------------------------------------------

function checkArtifacts(contractDir: string): CompiledArtifacts {
  const buildPath = path.join(BUILD_DIR, contractDir);
  if (!fs.existsSync(buildPath)) {
    throw new Error(
      `Compiled artifacts not found for '${contractDir}'.\n` +
      `Expected directory: ${buildPath}\n` +
      `Run 'npm run compile' from frontend/ first.\n` +
      `This requires the 'compact' binary: https://docs.midnight.network/develop/tutorial/tools`
    );
  }

  // compact generates: contract.cjs (or index.cjs), plus ZK assets in a subdirectory
  const contractModule =
    fs.existsSync(path.join(buildPath, "contract.cjs"))
      ? path.join(buildPath, "contract.cjs")
      : fs.existsSync(path.join(buildPath, "index.cjs"))
      ? path.join(buildPath, "index.cjs")
      : (() => { throw new Error(`No contract.cjs or index.cjs found in ${buildPath}`) })();

  return { contractModule, zkAssetsDir: buildPath };
}

// ---------------------------------------------------------------------------
// In-memory private state provider
// ---------------------------------------------------------------------------

class InMemoryPrivateStateProvider implements PrivateStateProvider<PrivateStateId, unknown> {
  private store = new Map<string, unknown>();

  async get(id: PrivateStateId): Promise<unknown | null> {
    return this.store.get(id as string) ?? null;
  }

  async set(id: PrivateStateId, state: unknown): Promise<void> {
    this.store.set(id as string, state);
  }

  async remove(id: PrivateStateId): Promise<void> {
    this.store.delete(id as string);
  }
}

// ---------------------------------------------------------------------------
// Node ZK config provider — reads compiled artifacts from disk
// ---------------------------------------------------------------------------

class NodeZKConfigProvider extends ZKConfigProvider<string> {
  private readonly zkAssetsDir: string;
  constructor(zkAssetsDir: string) {
    super();
    this.zkAssetsDir = zkAssetsDir;
  }

  async getZKIR(circuitId: string): Promise<ZKIR> {
    const filePath = path.join(this.zkAssetsDir, `${circuitId}.zkir`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`ZKIR not found for circuit '${circuitId}': ${filePath}`);
    }
    return fs.readFileSync(filePath) as unknown as ZKIR;
  }

  async getProverKey(circuitId: string): Promise<ProverKey> {
    const filePath = path.join(this.zkAssetsDir, `${circuitId}.pk`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Prover key not found for circuit '${circuitId}': ${filePath}`);
    }
    return fs.readFileSync(filePath) as unknown as ProverKey;
  }

  async getVerifierKey(circuitId: string): Promise<VerifierKey> {
    const filePath = path.join(this.zkAssetsDir, `${circuitId}.vk`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Verifier key not found for circuit '${circuitId}': ${filePath}`);
    }
    return fs.readFileSync(filePath) as unknown as VerifierKey;
  }
}

// ---------------------------------------------------------------------------
// HTTP Proof Provider — delegates to local proof server (Docker)
// ---------------------------------------------------------------------------

class HttpProofProvider implements ProofProvider {
  private readonly proofServerUrl: string;
  constructor(proofServerUrl: string) { this.proofServerUrl = proofServerUrl; }

  async proveTx(unprovenTx: unknown): Promise<unknown> {
    const response = await fetch(`${this.proofServerUrl}/prove`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transaction: unprovenTx }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Proof server error ${response.status}: ${text}`);
    }
    return (await response.json() as { transaction: unknown }).transaction;
  }
}

// ---------------------------------------------------------------------------
// HTTP Public Data Provider — queries Midnight indexer
// ---------------------------------------------------------------------------

class HttpPublicDataProvider implements PublicDataProvider {
  private readonly indexerUrl: string;
  constructor(indexerUrl: string) { this.indexerUrl = indexerUrl; }

  async queryContractState(contractAddress: unknown, _config?: unknown): Promise<unknown | null> {
    const query = `
      query ContractState($address: String!) {
        contract(address: $address) { state }
      }
    `;
    const resp = await fetch(`${this.indexerUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { address: contractAddress } }),
    });
    const data = await resp.json() as { data?: { contract?: { state: unknown } } };
    return data?.data?.contract?.state ?? null;
  }

  async queryZSwapAndContractState(_addr: unknown, _cfg?: unknown): Promise<unknown> {
    throw new Error("queryZSwapAndContractState not implemented for deployment");
  }

  async queryDeployContractState(contractAddress: unknown): Promise<unknown | null> {
    return this.queryContractState(contractAddress);
  }

  async queryUnshieldedBalances(contractAddress: unknown): Promise<unknown | null> {
    const query = `
      query UnshieldedBalance($address: String!) {
        unshieldedBalance(address: $address) { balances }
      }
    `;
    const resp = await fetch(`${this.indexerUrl}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { address: contractAddress } }),
    });
    const data = await resp.json() as { data?: { unshieldedBalance?: unknown } };
    return data?.data?.unshieldedBalance ?? null;
  }

  async watchForContractState(contractAddress: unknown): Promise<unknown> {
    // Poll every 3 seconds until state appears
    const poll = async (): Promise<unknown> => {
      const state = await this.queryContractState(contractAddress);
      if (state !== null) return state;
      await new Promise((r) => setTimeout(r, 3000));
      return poll();
    };
    return poll();
  }

  async watchForUnshieldedBalances(contractAddress: unknown): Promise<unknown> {
    const poll = async (): Promise<unknown> => {
      const bal = await this.queryUnshieldedBalances(contractAddress);
      if (bal !== null) return bal;
      await new Promise((r) => setTimeout(r, 3000));
      return poll();
    };
    return poll();
  }

  async watchForDeployTxData(contractAddress: unknown): Promise<unknown> {
    const query = `
      query DeployTx($address: String!) {
        deployTransaction(contractAddress: $address) { txHash blockNumber }
      }
    `;
    const poll = async (): Promise<unknown> => {
      const resp = await fetch(`${this.indexerUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { address: contractAddress } }),
      });
      const data = await resp.json() as { data?: { deployTransaction?: unknown } };
      if (data?.data?.deployTransaction) return data.data.deployTransaction;
      await new Promise((r) => setTimeout(r, 3000));
      return poll();
    };
    return poll();
  }

  async watchForTxData(txId: unknown): Promise<unknown> {
    const query = `
      query TxData($txId: String!) {
        transaction(id: $txId) { txHash blockNumber }
      }
    `;
    const poll = async (): Promise<unknown> => {
      const resp = await fetch(`${this.indexerUrl}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { txId } }),
      });
      const data = await resp.json() as { data?: { transaction?: unknown } };
      if (data?.data?.transaction) return data.data.transaction;
      await new Promise((r) => setTimeout(r, 3000));
      return poll();
    };
    return poll();
  }

  contractStateObservable(_address: unknown, _config: unknown): unknown {
    throw new Error("contractStateObservable not implemented for deployment");
  }

  unshieldedBalancesObservable(_address: unknown, _config: unknown): unknown {
    throw new Error("unshieldedBalancesObservable not implemented for deployment");
  }
}

// ---------------------------------------------------------------------------
// Mnemonic → hex seed
// ---------------------------------------------------------------------------

function mnemonicToHex(mnemonic: string): string {
  const words = mnemonic.trim().split(/\s+/);
  if (words.length !== 24) {
    throw new Error(`Expected 24-word mnemonic, got ${words.length} words`);
  }
  if (!bip39.validateMnemonic(mnemonic, wordlist)) {
    throw new Error("Invalid mnemonic — check your MIDNIGHT_DEPLOYER_MNEMONIC");
  }
  // WalletBuilder expects BIP39 entropy hex (not the 64-byte PBKDF2 seed)
  const entropy = bip39.mnemonicToEntropy(mnemonic, wordlist);
  return Buffer.from(entropy).toString("hex");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const reset = args.includes("--reset");

  const mnemonic = process.env.MIDNIGHT_DEPLOYER_MNEMONIC ?? "";
  const rpcUrl = process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL ?? "https://rpc.testnet.midnight.network";
  const indexerUrl = process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL ?? "https://indexer.testnet.midnight.network";
  const indexerWsUrl = indexerUrl.replace(/^https?:\/\//, "wss://");
  const proofServerUrl = process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://localhost:6300";

  if (!mnemonic && !dryRun) {
    err("MIDNIGHT_DEPLOYER_MNEMONIC not set.");
    err("Run: node scripts/generate-wallet.mjs to create one.");
    err("Use --dry-run to validate artifacts without deploying.");
    process.exit(1);
  }

  log(`Network: ${rpcUrl}`);
  log(`Indexer: ${indexerUrl}`);
  log(`Proof server: ${proofServerUrl}`);
  log(`Mode: ${dryRun ? "dry-run" : reset ? "force reset" : "incremental"}`);
  console.log();

  // ── Step 1: Validate all compiled artifacts exist ─────────────────────────
  log("Checking compiled artifacts…");
  const artifacts = new Map<string, CompiledArtifacts>();
  for (const contract of DEPLOY_ORDER) {
    try {
      artifacts.set(contract.key, checkArtifacts(contract.dir));
      ok(`Found artifacts for ${contract.dir}`);
    } catch (e) {
      err((e as Error).message);
      process.exit(1);
    }
  }
  console.log();

  if (dryRun) {
    log("Dry-run complete — all artifacts validated. No contracts deployed.");
    return;
  }

  // ── Step 2: Create wallet + providers ─────────────────────────────────────
  log("Building deployer wallet…");
  const seedHex = mnemonicToHex(mnemonic);

  let wallet: Awaited<ReturnType<typeof WalletBuilder.build>>;
  try {
    wallet = await WalletBuilder.build(
      indexerUrl,
      indexerWsUrl,
      proofServerUrl,
      rpcUrl,
      seedHex,
      NetworkId.TestNet,
      "info"
    );
    wallet.start();
    ok("Wallet connected");
  } catch (e) {
    err(`Failed to connect wallet: ${(e as Error).message}`);
    err("Make sure the proof server is running: docker run -p 6300:6300 ghcr.io/midnight-ntwrk/proof-server:latest");
    process.exit(1);
  }

  // ── Step 3: Load addresses and deploy ─────────────────────────────────────
  const addresses = loadAddresses();
  if (reset) {
    for (const c of DEPLOY_ORDER) addresses[c.key] = "";
  }

  for (const contract of DEPLOY_ORDER) {
    if (addresses[contract.key] && !reset) {
      skip(`${contract.key} already at ${addresses[contract.key]}`);
      continue;
    }

    for (const dep of contract.dependsOn ?? []) {
      if (!addresses[dep]) {
        err(`${contract.key} depends on ${dep} which hasn't been deployed yet`);
        process.exit(1);
      }
    }

    const art = artifacts.get(contract.key)!;

    // Build providers for this contract's circuits
    const zkConfigProvider = new NodeZKConfigProvider(art.zkAssetsDir);
    const proofProvider = new HttpProofProvider(proofServerUrl) as unknown as ProofProvider;
    const publicDataProvider = new HttpPublicDataProvider(indexerUrl) as unknown as PublicDataProvider;
    const privateStateProvider = new InMemoryPrivateStateProvider() as unknown as PrivateStateProvider<PrivateStateId, unknown>;

    // Bridge wallet → WalletProvider + MidnightProvider
    const walletProvider: WalletProvider = wallet as unknown as WalletProvider;
    const midnightProvider: MidnightProvider = wallet as unknown as MidnightProvider;

    const providers: MidnightProviders = {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    };

    // Load compiled contract module (generated by compact compiler)
    log(`Deploying ${contract.key} (${contract.dir})…`);
    const compiledModule = await import(art.contractModule) as { default: unknown; Contract?: unknown };
    const ContractClass = compiledModule.default ?? compiledModule.Contract;

    if (!ContractClass) {
      err(`No default export found in ${art.contractModule} — was 'npm run compile' successful?`);
      process.exit(1);
    }

    try {
      const { CompiledContract } = await import("@midnight-ntwrk/compact-js");
      const compiledContract = CompiledContract.make(contract.key, ContractClass as never);

      const deployed = await deployContract(providers as never, {
        compiledContract: compiledContract as never,
        ...(contract.hasPrivateState
          ? { privateStateId: `${contract.key}-state`, initialPrivateState: {} }
          : {}),
      });

      const address = deployed.deployTxData.public.contractAddress as string;
      addresses[contract.key] = address;
      saveAddresses(addresses);
      ok(`${contract.key} deployed at ${address}`);
    } catch (e) {
      err(`Failed to deploy ${contract.key}: ${(e as Error).message}`);
      if ((e as Error).message.includes("proof")) {
        err("Is the proof server running? docker run -p 6300:6300 ghcr.io/midnight-ntwrk/proof-server:latest");
      }
      process.exit(1);
    }
  }

  await wallet.close();
  console.log();
  log("All contracts deployed!");
  log("");
  log("Copy these into frontend/.env.local:");
  for (const [key, value] of Object.entries(addresses)) {
    if (value) log(`  ${envVarName(key as ContractKey)}=${value}`);
  }
  log("");
  log("Then run: npm run dev");
}

function envVarName(key: ContractKey): string {
  const map: Record<ContractKey, string> = {
    tvaultToken:     "NEXT_PUBLIC_TVAULT_TOKEN_ADDRESS",
    registry:        "NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS",
    patientVault:    "NEXT_PUBLIC_PATIENT_VAULT_CONTRACT_ADDRESS",
    trialMatcher:    "NEXT_PUBLIC_TRIAL_MATCHER_CONTRACT_ADDRESS",
    licenseMarket:   "NEXT_PUBLIC_LICENSE_MARKET_CONTRACT_ADDRESS",
    resultIntegrity: "NEXT_PUBLIC_RESULT_INTEGRITY_CONTRACT_ADDRESS",
    eventReporter:   "NEXT_PUBLIC_EVENT_REPORTER_CONTRACT_ADDRESS",
  };
  return map[key];
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
