"use client";

import { useAccount } from "wagmi";

/**
 * WalletStatus communicates connection state without exposing private data.
 */
export function WalletStatus() {
  const { address, isConnected } = useAccount();
  return (
    <div className="text-xs text-muted-foreground">
      {isConnected ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}` : "Wallet not connected"}
    </div>
  );
}
