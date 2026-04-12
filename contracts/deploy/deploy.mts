/**
 * TrialVault — Contract Deployment Script
 * =========================================
 * Deploys all 7 Compact contracts to Midnight Preprod network.
 * Based on the official create-mn-app template pattern.
 *
 * Usage:
 *   npx tsx contracts/deploy/deploy.ts
 *   npx tsx contracts/deploy/deploy.ts --reset   (re-deploy all)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Load .env.local before anything else
const envFile = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

import { WebSocket } from 'ws';
import * as Rx from 'rxjs';
import { Buffer } from 'buffer';

import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId, getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { unshieldedToken } from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import { createKeystore, InMemoryTransactionHistoryStorage, PublicKey, UnshieldedWallet } from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import { CompiledContract } from '@midnight-ntwrk/compact-js';

// Enable WebSocket for GraphQL subscriptions
// @ts-expect-error required for wallet sync
globalThis.WebSocket = WebSocket;

setNetworkId('preprod');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONFIG = {
  indexer: process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: (process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL || 'https://indexer.preprod.midnight.network/api/v4/graphql')
    .replace(/^https/, 'wss').replace(/^http/, 'ws').replace(/\/graphql$/, '/graphql/ws'),
  node: process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL || 'https://rpc.preprod.midnight.network',
  proofServer: process.env.MIDNIGHT_PROOF_SERVER_URL || 'http://127.0.0.1:6300',
  faucetUrl: 'https://faucet.preprod.midnight.network/',
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BUILD_DIR = path.resolve(__dirname, '..', 'build');
const ADDRESSES_FILE = path.join(__dirname, 'addresses.json');

// ---------------------------------------------------------------------------
// Contracts to deploy in dependency order
// ---------------------------------------------------------------------------

const CONTRACTS = [
  { key: 'tvaultToken',     dir: 'tvault_token',    privateState: false, witnesses: null },
  { key: 'registry',        dir: 'registry',         privateState: false, witnesses: null },
  { key: 'patientVault',    dir: 'patient_vault',    privateState: true,  witnesses: null },
  { key: 'trialMatcher',    dir: 'trial_matcher',    privateState: false, witnesses: {
    getPatientAge:      (ctx: any) => [ctx.privateState, 0n],
    getPatientDiagnosis:(ctx: any) => [ctx.privateState, 0n],
  }},
  { key: 'licenseMarket',   dir: 'license_market',   privateState: false, witnesses: null },
  { key: 'resultIntegrity', dir: 'result_integrity', privateState: false, witnesses: null },
  { key: 'eventReporter',   dir: 'event_reporter',   privateState: false, witnesses: null },
] as const;

type ContractKey = typeof CONTRACTS[number]['key'];

// ---------------------------------------------------------------------------
// Addresses persistence
// ---------------------------------------------------------------------------

function loadAddresses(): Record<ContractKey, string> {
  if (!fs.existsSync(ADDRESSES_FILE)) {
    return Object.fromEntries(CONTRACTS.map(c => [c.key, ''])) as Record<ContractKey, string>;
  }
  return JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf-8'));
}

function saveAddresses(addresses: Record<ContractKey, string>): void {
  fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2));
}

// ---------------------------------------------------------------------------
// Wallet helpers
// ---------------------------------------------------------------------------

function deriveKeys(seed: string) {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
  if (hdWallet.type !== 'seedOk') throw new Error('Invalid seed');
  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (result.type !== 'keysDerived') throw new Error('Key derivation failed');
  hdWallet.hdWallet.clear();
  return result.keys;
}

async function createWallet(seed: string) {
  const keys = deriveKeys(seed);
  const networkId = getNetworkId();
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);

  const walletConfig = {
    networkId,
    indexerClientConnection: { indexerHttpUrl: CONFIG.indexer, indexerWsUrl: CONFIG.indexerWS },
    provingServerUrl: new URL(CONFIG.proofServer),
    relayURL: new URL(CONFIG.node.replace(/^http/, 'ws')),
    costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
  };

  const wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: (config) => ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (config) => UnshieldedWallet({
      ...config,
      txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    }).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (config) => DustWallet(config).startWithSecretKey(
      dustSecretKey,
      ledger.LedgerParameters.initialParameters().dust,
    ),
  });
  await wallet.start(shieldedSecretKeys, dustSecretKey);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

async function createProviders(walletCtx: Awaited<ReturnType<typeof createWallet>>, zkConfigPath: string, stateStoreName: string) {
  const state = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter(s => s.isSynced)));

  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signFn = (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload);
      const signedRecipe = await walletCtx.wallet.signRecipe(recipe, signFn);
      return walletCtx.wallet.finalizeRecipe(signedRecipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider({ privateStateStoreName: stateStoreName, walletProvider, privateStoragePasswordProvider: () => `${stateStoreName}_Tv1!`, accountId: walletCtx.unshieldedKeystore.getBech32Address().asString() }),
    publicDataProvider: indexerPublicDataProvider(CONFIG.indexer, CONFIG.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(CONFIG.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

// ---------------------------------------------------------------------------
// Proof server check
// ---------------------------------------------------------------------------

async function waitForProofServer(maxAttempts = 20, delayMs = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fetch(CONFIG.proofServer, { method: 'GET', signal: AbortSignal.timeout(3000) });
      return true;
    } catch (err: any) {
      const code = err?.cause?.code || err?.code || '';
      if (code !== 'ECONNREFUSED' && code !== 'UND_ERR_CONNECT_TIMEOUT') return true;
    }
    if (attempt < maxAttempts) {
      process.stdout.write(`\r  Waiting for proof server... (${attempt}/${maxAttempts})   `);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Deploy single contract
// ---------------------------------------------------------------------------

async function deployOne(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
  contractDef: typeof CONTRACTS[number],
): Promise<string> {
  const zkConfigPath = path.join(BUILD_DIR, contractDef.dir);
  const contractModulePath = path.join(zkConfigPath, 'contract', 'index.js');

  if (!fs.existsSync(contractModulePath)) {
    throw new Error(`Contract not compiled: ${contractModulePath}\nRun: npm run compile`);
  }

  const ContractModule = await import(pathToFileURL(contractModulePath).href);

  const compiledContract = CompiledContract.make(contractDef.key, ContractModule.Contract).pipe(
    contractDef.witnesses ? CompiledContract.withWitnesses(contractDef.witnesses) : CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkConfigPath),
  );

  const providers = await createProviders(walletCtx, zkConfigPath, `${contractDef.key}-state`);

  const deployOptions: any = { compiledContract };
  if (contractDef.privateState) {
    deployOptions.privateStateId = `${contractDef.key}State`;
    deployOptions.initialPrivateState = {};
  }

  const MAX_RETRIES = 8;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const deployed = await deployContract(providers, deployOptions);
      return deployed.deployTxData.public.contractAddress as string;
    } catch (err: any) {
      const msg = `${err?.message || ''} ${err?.cause?.message || ''}`;
      if (msg.includes('Not enough Dust') && attempt < MAX_RETRIES) {
        const state = await Rx.firstValueFrom(walletCtx.wallet.state().pipe(Rx.filter(s => s.isSynced)));
        console.log(`\n  ⏳ DUST: ${state.dust.balance(new Date()).toLocaleString()} — retrying in 15s (${attempt}/${MAX_RETRIES})`);
        await new Promise(r => setTimeout(r, 15000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Not enough DUST after all retries. Run npm run deploy again in a few minutes.');
}

// ---------------------------------------------------------------------------
// Mnemonic → hex seed
// ---------------------------------------------------------------------------

async function mnemonicToSeedHex(mnemonic: string): Promise<string> {
  const { mnemonicToEntropy } = await import('@scure/bip39');
  const { wordlist } = await import('@scure/bip39/wordlists/english.js');
  const entropy = mnemonicToEntropy(mnemonic.trim(), wordlist);
  return Buffer.from(entropy).toString('hex');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const reset = process.argv.includes('--reset');

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        TrialVault — Deploy to Midnight Preprod               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const mnemonic = process.env.MIDNIGHT_DEPLOYER_MNEMONIC ?? '';
  if (!mnemonic) {
    console.error('❌ MIDNIGHT_DEPLOYER_MNEMONIC not set in .env.local\n');
    process.exit(1);
  }

  const seedHex = await mnemonicToSeedHex(mnemonic);

  // Check proof server
  console.log('  Checking proof server at', CONFIG.proofServer, '...');
  const proofReady = await waitForProofServer();
  if (!proofReady) {
    console.error('\n❌ Proof server not responding.');
    console.error('   Start it: docker run -p 6300:6300 midnightntwrk/proof-server:8.0.3 midnight-proof-server -v\n');
    process.exit(1);
  }
  console.log('  ✓ Proof server ready\n');

  // Create wallet
  console.log('  Connecting wallet to Preprod...');
  const walletCtx = await createWallet(seedHex);

  console.log('  Syncing (this can take 2-5 minutes on first run)...');
  // Log every state emission
  const progressSub = walletCtx.wallet.state().pipe(
    Rx.throttleTime(5000),
  ).subscribe((s: any) => {
    const sh = s?.shielded?.state?.progress;
    const du = s?.dust?.state?.progress;
    const un = s?.unshielded?.progress;
    process.stdout.write(
      `\r  isSynced=${s.isSynced} sh=[${sh?.appliedIndex}/${sh?.sourceIndex}] du=[${du?.appliedIndex}/${du?.sourceIndex}] un=[${un?.appliedId}/${un?.highestTransactionId}]    `
    );
  });

  let state: any;
  try {
    state = await walletCtx.wallet.waitForSyncedState();
  } finally {
    progressSub.unsubscribe();
  }
  process.stdout.write('\n');
  const address = walletCtx.unshieldedKeystore.getBech32Address();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`  Address: ${address}`);
  console.log(`  tNight:  ${balance.toLocaleString()}`);

  if (balance === 0n) {
    console.error(`\n❌ Wallet has no tNight. Fund at: ${CONFIG.faucetUrl}`);
    await walletCtx.wallet.stop();
    process.exit(1);
  }

  // Register for DUST if needed
  const dustBalance = state.dust.balance(new Date());
  if (dustBalance === 0n) {
    console.log('\n  Registering for DUST generation...');
    const nightUtxos = state.unshielded.availableCoins.filter((c: any) => !c.meta?.registeredForDustGeneration);
    if (nightUtxos.length > 0) {
      const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
        nightUtxos,
        walletCtx.unshieldedKeystore.getPublicKey(),
        (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload),
      );
      await walletCtx.wallet.submitTransaction(await walletCtx.wallet.finalizeRecipe(recipe));
    }
    console.log('  Waiting for DUST...');
    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter(s => s.isSynced),
        Rx.filter(s => s.dust.balance(new Date()) > 0n),
      )
    );
    console.log('  ✓ DUST ready');
  } else {
    console.log(`  DUST:    ${dustBalance.toLocaleString()}`);
  }

  // Deploy contracts
  const addresses = loadAddresses();
  if (reset) for (const c of CONTRACTS) addresses[c.key] = '';

  console.log('\n──────────────────────────────────────────────────────────────');
  console.log('  Deploying 7 contracts...');
  console.log('──────────────────────────────────────────────────────────────\n');

  for (const contract of CONTRACTS) {
    if (addresses[contract.key] && !reset) {
      console.log(`  ↩  ${contract.key}: ${addresses[contract.key]}`);
      continue;
    }
    process.stdout.write(`  Deploying ${contract.key}...`);
    const addr = await deployOne(walletCtx, contract);
    addresses[contract.key] = addr;
    saveAddresses(addresses);
    console.log(` ✓\n     ${addr}\n`);
  }

  await walletCtx.wallet.stop();

  // Print env vars
  const envMap: Record<ContractKey, string> = {
    tvaultToken:     'NEXT_PUBLIC_TVAULT_TOKEN_ADDRESS',
    registry:        'NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS',
    patientVault:    'NEXT_PUBLIC_PATIENT_VAULT_CONTRACT_ADDRESS',
    trialMatcher:    'NEXT_PUBLIC_TRIAL_MATCHER_CONTRACT_ADDRESS',
    licenseMarket:   'NEXT_PUBLIC_LICENSE_MARKET_CONTRACT_ADDRESS',
    resultIntegrity: 'NEXT_PUBLIC_RESULT_INTEGRITY_CONTRACT_ADDRESS',
    eventReporter:   'NEXT_PUBLIC_EVENT_REPORTER_CONTRACT_ADDRESS',
  };

  console.log('──────────────────────────────────────────────────────────────');
  console.log('  ✅ All contracts deployed!\n');
  console.log('  Add to .env.local:\n');
  for (const c of CONTRACTS) {
    if (addresses[c.key]) console.log(`  ${envMap[c.key]}=${addresses[c.key]}`);
  }
  console.log('\n  Then run: npm run dev\n');
}

main().catch(err => {
  console.error('\n❌ Deployment failed:');
  console.error(err?.message || JSON.stringify(err) || String(err));
  if (err?.cause) console.error('  cause:', err.cause?.message || JSON.stringify(err.cause));
  if (err?.stack) console.error(err.stack);
  process.exit(1);
});
