"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import {
  connectLace,
  isLaceAvailable,
  coinPublicKeyToUserId,
  evmAddressToUserId,
  type LaceAPI,
} from "./lace";

export interface MidnightWallet {
  /** Whether connected to Lace or wagmi wallet */
  isConnected: boolean;
  /** Whether Lace wallet is available in this browser */
  hasLace: boolean;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Error message if connection failed */
  error: string | null;
  /** Lace API (null if using EVM fallback) */
  laceApi: LaceAPI | null;
  /** Hex coin public key from Lace (null if no Lace) */
  coinPublicKey: string | null;
  /** Hex encryption public key from Lace (null if no Lace) */
  encryptionPublicKey: string | null;
  /**
   * 32-byte userId for on-chain identity.
   * Derived from coinPublicKey (Lace) or EVM address (fallback).
   */
  userId: Uint8Array | null;
  /** Human-readable address string for display */
  displayAddress: string | null;

  connectLaceWallet(): Promise<void>;
  disconnect(): void;
}

const MidnightContext = createContext<MidnightWallet | null>(null);

export function MidnightProvider({ children }: { children: ReactNode }) {
  const { address: evmAddress, isConnected: evmConnected } = useAccount();

  const [laceApi, setLaceApi] = useState<LaceAPI | null>(null);
  const [coinPublicKey, setCoinPublicKey] = useState<string | null>(null);
  const [encPubKey, setEncPubKey] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive userId: Lace coinPublicKey takes priority over EVM address
  const userId: Uint8Array | null = coinPublicKey
    ? coinPublicKeyToUserId(coinPublicKey)
    : evmAddress
      ? evmAddressToUserId(evmAddress)
      : null;

  const displayAddress: string | null = coinPublicKey
    ? `${coinPublicKey.slice(0, 8)}…${coinPublicKey.slice(-6)}`
    : evmAddress ?? null;

  const isConnected = Boolean(laceApi) || evmConnected;

  // hasLace must be reactive — the Lace extension injects window.midnight.mnLace
  // asynchronously after page load, so a synchronous check at render time returns false.
  // Poll every 500ms for up to 10 seconds to cover slow extension injection.
  const [hasLace, setHasLace] = useState(false);
  useEffect(() => {
    if (hasLace) return; // already detected, no need to poll
    let interval: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const check = () => {
      if (isLaceAvailable()) {
        console.log("[TrialVault] Lace wallet detected");
        setHasLace(true);
        if (interval) clearInterval(interval);
        if (timeout) clearTimeout(timeout);
      }
    };
    check();
    interval = setInterval(check, 500);
    timeout = setTimeout(() => {
      if (interval) clearInterval(interval);
      console.warn("[TrialVault] Lace detection timed out after 10s. window.midnight =", typeof window !== "undefined" ? window.midnight : "N/A");
    }, 10_000);
    return () => { if (interval) clearInterval(interval); if (timeout) clearTimeout(timeout); };
  }, [hasLace]);

  const connectLaceWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { api, coinPublicKey: cpk, encryptionPublicKey: epk } = await connectLace();
      setLaceApi(api);
      setCoinPublicKey(cpk);
      setEncPubKey(epk);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setLaceApi(null);
    setCoinPublicKey(null);
    setEncPubKey(null);
    setError(null);
  }, []);


  return (
    <MidnightContext.Provider
      value={{
        isConnected,
        hasLace,
        isConnecting,
        error,
        laceApi,
        coinPublicKey,
        encryptionPublicKey: encPubKey,
        userId,
        displayAddress,
        connectLaceWallet,
        disconnect,
      }}
    >
      {children}
    </MidnightContext.Provider>
  );
}

export function useMidnight(): MidnightWallet {
  const ctx = useContext(MidnightContext);
  if (!ctx) throw new Error("useMidnight must be used within MidnightProvider");
  return ctx;
}
