"use client";

/**
 * Midnight DApp Connector v4.0.1 integration.
 *
 * Wallets inject into window.midnight.{walletId} (UUID-based keys).
 * https://docs.midnight.network/develop/reference/midnight-api/dapp-connector
 */

/* ─── Initial API (before connection) ──────────────────────────────────── */

export interface MidnightInitialAPI {
  apiVersion: string;
  name: string;
  icon: string;
  rdns?: string;
  connect(networkId: string): Promise<LaceAPI>;
}

/* ─── Connected API (after .connect()) ─────────────────────────────────── */

export interface LaceAPI {
  getConnectionStatus(): Promise<{ networkId: string }>;
  getConfiguration(): Promise<{
    indexerUri?: string;
    nodeUri?: string;
    proofServerUri?: string;
  }>;
  getShieldedAddresses(): Promise<{
    shieldedAddress: string;
    shieldedCoinPublicKey: string;
    shieldedEncryptionPublicKey: string;
  }>;
  getUnshieldedAddress(): Promise<{ unshieldedAddress: string }>;
  getDustAddress(): Promise<{ dustAddress: string }>;
  getShieldedBalances(): Promise<Record<string, bigint>>;
  getUnshieldedBalances(): Promise<Record<string, bigint>>;
  getDustBalance(): Promise<{ balance: bigint; cap: bigint }>;
  makeTransfer(outputs: unknown[]): Promise<unknown>;
  balanceSealedTransaction(tx: string, options?: { payFees?: boolean }): Promise<{ tx: string }>;
  balanceUnsealedTransaction(tx: string, options?: { payFees?: boolean }): Promise<{ tx: string }>;
  submitTransaction(tx: unknown): Promise<string>;
  signData?(data: Uint8Array): Promise<Uint8Array>;
}

declare global {
  interface Window {
    midnight?: Record<string, MidnightInitialAPI>;
  }
}

/* ─── Discovery ────────────────────────────────────────────────────────── */

/**
 * Find the first available Midnight wallet connector from window.midnight.
 * Wallets register under UUID-based keys (e.g. "f55ac5d6-...").
 */
export function getLaceConnector(): MidnightInitialAPI | null {
  if (typeof window === "undefined" || !window.midnight) return null;
  for (const w of Object.values(window.midnight)) {
    if (w && typeof w === "object" && typeof w.connect === "function") {
      return w;
    }
  }
  return null;
}

export function isLaceAvailable(): boolean {
  return getLaceConnector() !== null;
}

/* ─── Connection ───────────────────────────────────────────────────────── */

export async function connectLace(): Promise<{
  api: LaceAPI;
  coinPublicKey: string;
  encryptionPublicKey: string;
}> {
  const connector = getLaceConnector();
  if (!connector) {
    throw new Error(
      "Lace wallet not found. Please install the Lace extension with Midnight support.",
    );
  }

  // The DApp connector API requires a network ID string.
  // Midnight testnet is "testnet"; production will be "mainnet".
  const networkId = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK_ID ?? "preprod";
  console.log(`[TrialVault] Connecting to Lace (${connector.name} v${connector.apiVersion}) on "${networkId}"…`);

  const api = await connector.connect(networkId);

  const status = await api.getConnectionStatus();
  console.log("[TrialVault] Connected, network:", status.networkId);

  // Extract wallet identity from address methods.
  // v4.0.1 API returns wrapper objects, not plain strings.
  const { unshieldedAddress } = await api.getUnshieldedAddress();
  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } = await api.getShieldedAddresses();

  // Use shieldedCoinPublicKey as primary identity (matches old coinPublicKey usage)
  const coinPublicKey = shieldedCoinPublicKey || unshieldedAddress;
  const encryptionPublicKey = shieldedEncryptionPublicKey || "";

  console.log("[TrialVault] Wallet address:", coinPublicKey, "unshielded:", unshieldedAddress);
  return { api, coinPublicKey, encryptionPublicKey };
}

/**
 * Derive a stable 32-byte userId from an EVM address (for demo/fallback mode).
 * EVM addresses are 20 bytes — pad to 32 by zeroing the prefix.
 */
export function evmAddressToUserId(address: string): Uint8Array {
  const hex = address.replace(/^0x/, "").toLowerCase();
  const bytes = new Uint8Array(32);
  // place 20-byte EVM address in lower 20 bytes
  for (let i = 0; i < 20; i++) {
    bytes[12 + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert a wallet address (Bech32m like "mn_addr1..." or hex) to a 32-byte userId.
 * For Bech32m addresses, we hash the string to get a stable 32-byte identifier.
 * For hex strings (legacy), we decode directly.
 */
export function coinPublicKeyToUserId(coinPublicKey: string): Uint8Array {
  // If it looks like hex (0x prefix or all hex chars), decode directly
  const stripped = coinPublicKey.replace(/^0x/, "");
  if (/^[0-9a-fA-F]+$/.test(stripped) && stripped.length >= 40) {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < Math.min(32, stripped.length / 2); i++) {
      bytes[i] = parseInt(stripped.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }
  // For Bech32m addresses (mn_addr1...), hash to 32 bytes using simple FNV-like spread
  const bytes = new Uint8Array(32);
  const encoder = new TextEncoder();
  const encoded = encoder.encode(coinPublicKey);
  for (let i = 0; i < encoded.length; i++) {
    bytes[i % 32] ^= encoded[i];
    // Mix bits
    bytes[(i + 1) % 32] = (bytes[(i + 1) % 32] + encoded[i]) & 0xff;
  }
  return bytes;
}
