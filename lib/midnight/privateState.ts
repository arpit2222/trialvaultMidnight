import type { PrivateStateProvider, PrivateStateId } from "@midnight-ntwrk/midnight-js-types";
import type { ContractAddress, SigningKey } from "@midnight-ntwrk/compact-runtime";

function addrToKey(address: ContractAddress): string {
  if (typeof address === "string") return address;
  return Buffer.from(address as Uint8Array).toString("hex");
}

/**
 * In-memory PrivateStateProvider for browser use.
 *
 * State is lost on page reload — sufficient for demo.
 * For production persistence, replace with an IndexedDB-backed implementation.
 */
export class MemoryPrivateStateProvider<
  PSI extends PrivateStateId = PrivateStateId,
  PS = unknown,
> implements PrivateStateProvider<PSI, PS>
{
  private contractAddr = "";
  private readonly states = new Map<string, PS>();
  private readonly signingKeys = new Map<string, SigningKey>();

  private stateKey(id: PSI): string {
    return `${this.contractAddr}::${String(id)}`;
  }

  setContractAddress(address: ContractAddress): void {
    this.contractAddr = addrToKey(address);
  }

  async set(id: PSI, state: PS): Promise<void> {
    this.states.set(this.stateKey(id), state);
  }

  async get(id: PSI): Promise<PS | null> {
    return this.states.get(this.stateKey(id)) ?? null;
  }

  async remove(id: PSI): Promise<void> {
    this.states.delete(this.stateKey(id));
  }

  async clear(): Promise<void> {
    const prefix = `${this.contractAddr}::`;
    for (const key of [...this.states.keys()]) {
      if (key.startsWith(prefix)) this.states.delete(key);
    }
  }

  async setSigningKey(address: ContractAddress, signingKey: SigningKey): Promise<void> {
    this.signingKeys.set(addrToKey(address), signingKey);
  }

  async getSigningKey(address: ContractAddress): Promise<SigningKey | null> {
    return this.signingKeys.get(addrToKey(address)) ?? null;
  }

  async removeSigningKey(address: ContractAddress): Promise<void> {
    this.signingKeys.delete(addrToKey(address));
  }

  async clearSigningKeys(): Promise<void> {
    this.signingKeys.clear();
  }

  // Export/import not needed for demo — throw to surface unexpected calls
  async exportPrivateStates(): Promise<never> {
    throw new Error("MemoryPrivateStateProvider: exportPrivateStates not supported");
  }

  async importPrivateStates(): Promise<never> {
    throw new Error("MemoryPrivateStateProvider: importPrivateStates not supported");
  }

  async exportSigningKeys(): Promise<never> {
    throw new Error("MemoryPrivateStateProvider: exportSigningKeys not supported");
  }

  async importSigningKeys(): Promise<never> {
    throw new Error("MemoryPrivateStateProvider: importSigningKeys not supported");
  }
}
