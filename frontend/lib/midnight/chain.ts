import { defineChain } from "viem";

export const midnightTestnet = defineChain({
  id: 300,
  name: "Midnight Testnet",
  nativeCurrency: { name: "DUST", symbol: "DUST", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL ?? "https://rpc.testnet.midnight.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Midnight Explorer",
      url: "https://explorer.testnet.midnight.network",
    },
  },
  testnet: true,
});
