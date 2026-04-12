"use client";

import { useMidnight } from "@/lib/midnight/context";

/**
 * WalletStatus communicates connection state without exposing private data.
 */
export function WalletStatus() {
  const { isConnected, displayAddress } = useMidnight();
  return (
    <div className="text-xs text-muted-foreground">
      {isConnected && displayAddress
        ? `Connected: ${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
        : "Wallet not connected"}
    </div>
  );
}
