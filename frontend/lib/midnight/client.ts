export interface MidnightClientConfig {
  rpcUrl: string;
  indexerUrl: string;
}

export interface MidnightClient {
  rpcUrl: string;
  indexerUrl: string;
  callRpc: (method: string, params?: unknown[]) => Promise<unknown>;
}

export function createMidnightClient(config?: Partial<MidnightClientConfig>): MidnightClient {
  const rpcUrl =
    config?.rpcUrl ??
    process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL ??
    "https://rpc.testnet.midnight.network";
  const indexerUrl = config?.indexerUrl ?? process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL ?? "";

  return {
    rpcUrl,
    indexerUrl,
    async callRpc(method: string, params: unknown[] = []) {
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      });
      if (!response.ok) {
        throw new Error("Midnight RPC request failed");
      }
      const data = (await response.json()) as { result?: unknown; error?: { message: string } };
      if (data.error) {
        throw new Error(data.error.message);
      }
      return data.result;
    },
  };
}
