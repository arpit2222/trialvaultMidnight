import { useBlockNumber, useWaitForTransactionReceipt } from "wagmi";

/**
 * useNewBlocks — returns the latest block number.
 * watch is intentionally DISABLED to prevent continuous RPC polling against
 * Midnight testnet (which causes 40+ failed requests in demo mode).
 * Refetch manually or on user action instead.
 */
export function useNewBlocks() {
  return useBlockNumber({ watch: false });
}

export function useTxReceipt(hash?: `0x${string}`) {
  return useWaitForTransactionReceipt({ hash, query: { enabled: Boolean(hash) } });
}
