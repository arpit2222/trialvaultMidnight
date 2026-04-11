import type { EncryptedVault, HealthData } from "@/types/patient";
import { sha256Hex } from "@/lib/crypto/hash";

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  if (typeof window === "undefined") return "";
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  if (typeof window === "undefined") return new Uint8Array();
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function deriveAesKey(signature: string, walletAddress: string) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(signature),
    "HKDF",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode(walletAddress.toLowerCase()),
      info: encoder.encode("TrialVault encrypt v1"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts health data locally using AES-GCM.
 * Privacy role: ensures plaintext never leaves the device.
 */
export async function encryptHealthData(
  data: HealthData,
  walletAddress: string,
  walletSignature: string
): Promise<EncryptedVault> {
  const key = await deriveAesKey(walletSignature, walletAddress);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encoder.encode(JSON.stringify(data));
  // .buffer.slice(0) yields a plain ArrayBuffer — required by SubtleCrypto in ES2020 strict mode.
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer.slice(0) as ArrayBuffer },
    key,
    plaintext.buffer.slice(0) as ArrayBuffer
  );
  const keyHash = await sha256Hex(walletSignature);
  return {
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    iv: toBase64(iv),
    keyHash,
  };
}

/**
 * Decrypts locally stored vault ciphertext.
 * Privacy role: decrypts only in-browser with user signature.
 */
export async function decryptHealthData(
  vault: EncryptedVault,
  walletSignature: string,
  walletAddress: string
): Promise<HealthData> {
  const key = await deriveAesKey(walletSignature, walletAddress);
  const iv = fromBase64(vault.iv);
  const ciphertext = fromBase64(vault.ciphertext);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer.slice(0) as ArrayBuffer },
    key,
    ciphertext.buffer.slice(0) as ArrayBuffer
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as HealthData;
}
