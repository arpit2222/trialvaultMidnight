"use client";

/**
 * Lace DApp Connector types and utilities.
 *
 * Lace wallet (midnight extension) injects window.midnight.mnLace.
 * https://docs.midnight.network/develop/tutorial/using-lace-wallet
 */

export interface LaceDAppConnector {
  apiVersion: string;
  name: string;
  icon: string;
  enable(): Promise<LaceAPI>;
  isEnabled(): Promise<boolean>;
}

export interface LaceAPI {
  coinPublicKey(): Promise<string>;
  encryptionPublicKey(): Promise<string>;
  balanceAndProveTransaction(
    serializedUnprovenTx: Uint8Array,
    zkConfigProvider: unknown,
  ): Promise<Uint8Array>;
  submitTransaction(serializedTx: Uint8Array): Promise<string>;
  state(): Promise<{ coinPublicKey: string; encryptionPublicKey: string }>;
}

declare global {
  interface Window {
    midnight?: {
      mnLace?: LaceDAppConnector;
    };
  }
}

export function getLaceConnector(): LaceDAppConnector | null {
  if (typeof window === "undefined") return null;
  return window.midnight?.mnLace ?? null;
}

export function isLaceAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.midnight?.mnLace);
}

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
  const api = await connector.enable();
  const [coinPublicKey, encryptionPublicKey] = await Promise.all([
    api.coinPublicKey(),
    api.encryptionPublicKey(),
  ]);
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
 * Convert a hex coin public key string to a 32-byte Uint8Array.
 */
export function coinPublicKeyToUserId(coinPublicKey: string): Uint8Array {
  const hex = coinPublicKey.replace(/^0x/, "");
  const bytes = new Uint8Array(32);
  for (let i = 0; i < Math.min(32, hex.length / 2); i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
