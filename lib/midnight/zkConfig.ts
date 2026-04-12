import { ZKConfigProvider } from "@midnight-ntwrk/midnight-js-types";
import type { ProverKey, VerifierKey, ZKIR } from "@midnight-ntwrk/midnight-js-types";

/**
 * Fetches ZK artifacts over HTTP from Next.js API routes at
 *   /api/zk/{contractDir}/{circuitId}/{prover|verifier|zkir}
 *
 * Used in the browser where filesystem access is unavailable.
 */
export class FetchZkConfigProvider<K extends string = string> extends ZKConfigProvider<K> {
  constructor(
    private readonly contractDir: string,
    private readonly baseUrl: string = "",
  ) {
    super();
  }

  private async fetchBinary(
    circuitId: K,
    type: "prover" | "verifier" | "zkir",
  ): Promise<Uint8Array> {
    const url = `${this.baseUrl}/api/zk/${this.contractDir}/${circuitId}/${type}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`ZK artifact fetch failed: ${url} → ${resp.status} ${resp.statusText}`);
    }
    return new Uint8Array(await resp.arrayBuffer());
  }

  async getProverKey(circuitId: K): Promise<ProverKey> {
    return this.fetchBinary(circuitId, "prover") as Promise<ProverKey>;
  }

  async getVerifierKey(circuitId: K): Promise<VerifierKey> {
    return this.fetchBinary(circuitId, "verifier") as Promise<VerifierKey>;
  }

  async getZKIR(circuitId: K): Promise<ZKIR> {
    return this.fetchBinary(circuitId, "zkir") as Promise<ZKIR>;
  }
}
