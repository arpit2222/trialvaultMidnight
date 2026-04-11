"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";

/**
 * ConnectButton mediates wallet access without sharing any health data.
 */
export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, openAccountModal, mounted }) => {
        const ready = mounted;
        if (!ready) {
          return <Button disabled>Connecting...</Button>;
        }
        if (!account || !chain) {
          return <Button onClick={openConnectModal}>Connect Wallet</Button>;
        }
        return (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openChainModal}>
              {chain.name}
            </Button>
            <Button onClick={openAccountModal}>{account.displayName}</Button>
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
