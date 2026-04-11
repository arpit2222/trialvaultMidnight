import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";
import { http } from "viem";
import { midnightTestnet } from "@/lib/midnight/chain";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
const rpcUrl =
  process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL ?? "https://rpc.testnet.midnight.network";

/**
 * Wallet list. WalletConnect is included only when a real projectId is set;
 * otherwise injected wallets (Lace, MetaMask) work without a projectId.
 */
const wallets = projectId
  ? [injectedWallet, metaMaskWallet, walletConnectWallet]
  : [injectedWallet, metaMaskWallet];

const connectors = connectorsForWallets(
  [{ groupName: "Midnight Network", wallets }],
  {
    appName: "TrialVault",
    // Use the real projectId when available; "trialvault-demo" is a non-empty
    // placeholder that satisfies RainbowKit's presence check without enabling
    // WalletConnect (since walletConnectWallet is excluded above).
    projectId: projectId || "trialvault-demo",
  }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [midnightTestnet],
  transports: {
    [midnightTestnet.id]: http(rpcUrl),
  },
  ssr: true,
});
