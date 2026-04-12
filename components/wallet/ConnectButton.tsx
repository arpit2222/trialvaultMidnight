"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { useMidnight } from "@/lib/midnight/context";

/**
 * ConnectButton shows:
 *  - Lace wallet button when detected (Midnight-native, on-chain mode)
 *  - RainbowKit button always (MetaMask / demo mode)
 *
 * Both can be used independently. Lace is shown only after the extension
 * has had a chance to inject window.midnight.mnLace (checked reactively).
 */
export function ConnectButton() {
  const {
    hasLace,
    isConnected: laceConnected,
    laceApi,
    isConnecting,
    connectLaceWallet,
    displayAddress,
    coinPublicKey,
    disconnect,
  } = useMidnight();

  const laceIsActive = Boolean(laceApi);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ── Lace wallet (Midnight native) ── */}
      {hasLace && (
        laceIsActive && coinPublicKey ? (
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-mono border-brand-mint/40 text-brand-mint"
            onClick={disconnect}
            title="Disconnect Lace"
          >
            Lace: {coinPublicKey.slice(0, 6)}…{coinPublicKey.slice(-4)}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={isConnecting}
            onClick={() => void connectLaceWallet()}
            className="border-brand-mint/40 text-brand-mint hover:bg-brand-mint/10"
          >
            {isConnecting ? "Connecting…" : "Connect Lace"}
          </Button>
        )
      )}

      {/* ── EVM wallet via RainbowKit (always available, demo mode) ── */}
      <RainbowConnectButton.Custom>
        {({ account, chain, openChainModal, openConnectModal, openAccountModal, mounted }) => {
          if (!mounted) return <Button size="sm" disabled>Loading…</Button>;
          if (!account || !chain) {
            return (
              <Button size="sm" onClick={openConnectModal}>
                {hasLace ? "Connect MetaMask" : "Connect Wallet"}
              </Button>
            );
          }
          return (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={openChainModal}>
                {chain.name}
              </Button>
              <Button size="sm" onClick={openAccountModal}>
                {account.displayName}
              </Button>
            </div>
          );
        }}
      </RainbowConnectButton.Custom>
    </div>
  );
}
