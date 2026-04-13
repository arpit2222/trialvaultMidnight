"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { useMidnight } from "@/lib/midnight/context";

const LACE_INSTALL_URL =
  "https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk";

/**
 * ConnectButton shows:
 *  - Lace wallet button always (Midnight-native, primary wallet)
 *    → if Lace is not installed, opens install link
 *  - RainbowKit button (MetaMask / demo mode)
 *
 * Lace is checked reactively since the extension injects
 * window.midnight.mnLace asynchronously after page load.
 */
export function ConnectButton() {
  const {
    hasLace,
    isConnected: laceConnected,
    laceApi,
    isConnecting,
    error,
    connectLaceWallet,
    displayAddress,
    coinPublicKey,
    disconnect,
  } = useMidnight();

  const laceIsActive = Boolean(laceApi);

  const handleLaceClick = () => {
    if (hasLace) {
      void connectLaceWallet();
    } else {
      window.open(LACE_INSTALL_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ── Lace wallet (Midnight native — always visible) ── */}
      {laceIsActive && coinPublicKey ? (
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
          onClick={handleLaceClick}
          className="border-brand-mint/40 text-brand-mint hover:bg-brand-mint/10"
          title={hasLace ? "Connect Lace wallet" : "Install Lace wallet extension"}
        >
          {isConnecting
            ? "Connecting…"
            : hasLace
              ? "Connect Lace"
              : "Install Lace Wallet"}
        </Button>
      )}

      {/* ── Lace error display ── */}
      {error && (
        <p className="text-xs text-red-400 max-w-[300px] truncate" title={error}>
          Lace: {error}
        </p>
      )}

      {/* ── EVM wallet via RainbowKit (demo / fallback mode) ── */}
      <RainbowConnectButton.Custom>
        {({ account, chain, openChainModal, openConnectModal, openAccountModal, mounted }) => {
          if (!mounted) return <Button size="sm" disabled>Loading…</Button>;
          if (!account || !chain) {
            return (
              <Button size="sm" variant="ghost" onClick={openConnectModal}>
                {hasLace ? "Connect MetaMask" : "Connect EVM Wallet"}
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
