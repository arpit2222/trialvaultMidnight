/**
 * Server-side Midnight wallet singleton.
 *
 * Uses nodeImport() (new Function trick) so webpack never sees or bundles
 * any @midnight-ntwrk packages — Node.js loads them natively as ESM at runtime.
 */

import * as path from "node:path";
import * as fs from "node:fs";
import { nodeImport } from "./dynamic-import";

// Load .env.local before anything else
const envFile = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envFile) && !process.env.MIDNIGHT_DEPLOYER_MNEMONIC) {
  const lines = fs.readFileSync(envFile, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

export const BUILD_DIR = path.resolve(process.cwd(), "contracts/build");

export const INDEXER_HTTP =
  process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL ??
  "https://indexer.preprod.midnight.network/api/v4/graphql";
export const INDEXER_WS = INDEXER_HTTP
  .replace(/^https/, "wss").replace(/^http/, "ws").replace(/\/graphql$/, "/graphql/ws");

const NODE = process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL ?? "https://rpc.preprod.midnight.network";
export const PROOF_SERVER = process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://localhost:6300";

export interface ServerWallet {
  // eslint-disable-next-line
  wallet: any; shieldedSecretKeys: any; dustSecretKey: any; unshieldedKeystore: any; coinPublicKey: string;
}

let walletPromise: Promise<ServerWallet> | null = null;

export function getServerWallet(): Promise<ServerWallet> {
  if (!walletPromise) {
    walletPromise = initWallet().catch((err) => { walletPromise = null; throw err; });
  }
  return walletPromise;
}

async function initWallet(): Promise<ServerWallet> {
  const mnemonic = process.env.MIDNIGHT_DEPLOYER_MNEMONIC;
  if (!mnemonic) throw new Error("MIDNIGHT_DEPLOYER_MNEMONIC not set");

  const { WebSocket } = await nodeImport<typeof import("ws")>("ws");
  (globalThis as Record<string, unknown>).WebSocket = WebSocket;

  const { Buffer } = await nodeImport<typeof import("buffer")>("buffer");
  const { setNetworkId, getNetworkId } = await nodeImport<typeof import("@midnight-ntwrk/midnight-js-network-id")>("@midnight-ntwrk/midnight-js-network-id");
  const ledger = await nodeImport<typeof import("@midnight-ntwrk/ledger-v8")>("@midnight-ntwrk/ledger-v8");
  const { WalletFacade } = await nodeImport<typeof import("@midnight-ntwrk/wallet-sdk-facade")>("@midnight-ntwrk/wallet-sdk-facade");
  const { DustWallet } = await nodeImport<typeof import("@midnight-ntwrk/wallet-sdk-dust-wallet")>("@midnight-ntwrk/wallet-sdk-dust-wallet");
  const { HDWallet, Roles } = await nodeImport<typeof import("@midnight-ntwrk/wallet-sdk-hd")>("@midnight-ntwrk/wallet-sdk-hd");
  const { ShieldedWallet } = await nodeImport<typeof import("@midnight-ntwrk/wallet-sdk-shielded")>("@midnight-ntwrk/wallet-sdk-shielded");
  const { createKeystore, InMemoryTransactionHistoryStorage, PublicKey, UnshieldedWallet } = await nodeImport<typeof import("@midnight-ntwrk/wallet-sdk-unshielded-wallet")>("@midnight-ntwrk/wallet-sdk-unshielded-wallet");

  setNetworkId("preprod");
  const networkId = getNetworkId();

  const { mnemonicToEntropy } = await nodeImport<typeof import("@scure/bip39")>("@scure/bip39");
  const { wordlist } = await nodeImport<{ wordlist: string[] }>("@scure/bip39/wordlists/english.js");
  const seedHex = Buffer.from(mnemonicToEntropy(mnemonic.trim(), wordlist)).toString("hex");

  const hdWallet = HDWallet.fromSeed(Buffer.from(seedHex, "hex"));
  if (hdWallet.type !== "seedOk") throw new Error("Invalid seed");
  const result = hdWallet.hdWallet.selectAccount(0).selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust]).deriveKeysAt(0);
  if (result.type !== "keysDerived") throw new Error("Key derivation failed");
  hdWallet.hdWallet.clear();
  const keys = result.keys;

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], networkId);

  const wallet = await WalletFacade.init({
    configuration: {
      networkId,
      indexerClientConnection: { indexerHttpUrl: INDEXER_HTTP, indexerWsUrl: INDEXER_WS },
      provingServerUrl: new URL(PROOF_SERVER),
      relayURL: new URL(NODE.replace(/^http/, "ws")),
      costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
    } as never,
    shielded: (config: never) => ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (config: never) => UnshieldedWallet(Object.assign({}, config, { txHistoryStorage: new InMemoryTransactionHistoryStorage() }) as never).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: (config: never) => DustWallet(config).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust),
  });

  await wallet.start(shieldedSecretKeys, dustSecretKey);
  await wallet.waitForSyncedState();

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore, coinPublicKey: shieldedSecretKeys.coinPublicKey as string };
}

export async function buildContractProviders(contractDir: string, stateStoreName: string, walletCtx: ServerWallet) {
  const { indexerPublicDataProvider } = await nodeImport<typeof import("@midnight-ntwrk/midnight-js-indexer-public-data-provider")>("@midnight-ntwrk/midnight-js-indexer-public-data-provider");
  const { httpClientProofProvider } = await nodeImport<typeof import("@midnight-ntwrk/midnight-js-http-client-proof-provider")>("@midnight-ntwrk/midnight-js-http-client-proof-provider");
  const { levelPrivateStateProvider } = await nodeImport<typeof import("@midnight-ntwrk/midnight-js-level-private-state-provider")>("@midnight-ntwrk/midnight-js-level-private-state-provider");
  const { NodeZkConfigProvider } = await nodeImport<typeof import("@midnight-ntwrk/midnight-js-node-zk-config-provider")>("@midnight-ntwrk/midnight-js-node-zk-config-provider");

  const zkConfigPath = path.join(BUILD_DIR, contractDir);
  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);
  const walletProvider = {
    getCoinPublicKey: () => walletCtx.shieldedSecretKeys.coinPublicKey as string,
    getEncryptionPublicKey: () => walletCtx.shieldedSecretKeys.encryptionPublicKey as string,
    async balanceTx(tx: unknown, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(tx as never, { shieldedSecretKeys: walletCtx.shieldedSecretKeys, dustSecretKey: walletCtx.dustSecretKey }, { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) });
      const signFn = (payload: Uint8Array) => walletCtx.unshieldedKeystore.signData(payload) as never;
      const signedRecipe = await walletCtx.wallet.signRecipe(recipe, signFn);
      return walletCtx.wallet.finalizeRecipe(signedRecipe);
    },
    submitTx: (tx: unknown) => walletCtx.wallet.submitTransaction(tx as never) as never,
  };

  return {
    privateStateProvider: levelPrivateStateProvider({ privateStateStoreName: stateStoreName, privateStoragePasswordProvider: () => `${stateStoreName}_Tv1!`, accountId: walletCtx.unshieldedKeystore.getBech32Address().asString() as string }),
    publicDataProvider: indexerPublicDataProvider(INDEXER_HTTP, INDEXER_WS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PROOF_SERVER, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}
