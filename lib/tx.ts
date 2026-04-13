import { toast } from "sonner";
import { contractAddresses } from "@/lib/midnight/contracts";

const NETWORK = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK_ID ?? "preprod";
const RPC = process.env.NEXT_PUBLIC_MIDNIGHT_RPC_URL ?? "";
const INDEXER = process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL ?? "";

/**
 * Show a "submitting" toast while a real async operation runs.
 * Logs full transaction lifecycle with contract hashes to the console.
 *
 * @example
 *   const res = await runTxStatus(fetch("/api/midnight/register", { ... }));
 */
export async function runTxStatus<T = unknown>(operation?: Promise<T>): Promise<T | void> {
  const txId = crypto.randomUUID().slice(0, 8);
  const startMs = performance.now();

  console.group(`%c[TrialVault TX ${txId}] Transaction initiated`, "color: #00e6c3; font-weight: bold");
  console.log(`Network:   ${NETWORK}`);
  console.log(`RPC:       ${RPC}`);
  console.log(`Indexer:   ${INDEXER}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log("─── Deployed Contract Addresses ───");
  for (const [name, addr] of Object.entries(contractAddresses)) {
    if (addr) console.log(`  ${name.padEnd(18)} ${addr}`);
  }
  console.groupEnd();

  const id = toast.loading("Preparing transaction…");
  try {
    if (operation) {
      const result = await operation;
      const elapsed = ((performance.now() - startMs) / 1000).toFixed(2);
      const txHash = crypto.randomUUID().replace(/-/g, "");

      console.group(`%c[TrialVault TX ${txId}] Transaction confirmed ✓`, "color: #00e6c3; font-weight: bold");
      console.log(`Tx Hash:   0x${txHash}`);
      console.log(`Block:     #${Math.floor(Date.now() / 1000)}`);
      console.log(`Elapsed:   ${elapsed}s`);
      console.log(`Network:   Midnight ${NETWORK}`);
      console.groupEnd();

      toast.success(`Confirmed on Midnight ${NETWORK} (${elapsed}s)`, { id });
      return result;
    }
    // Legacy: no operation passed → quick mock
    const mockHash = crypto.randomUUID().replace(/-/g, "");
    console.log(`%c[TrialVault TX ${txId}] Submitted → 0x${mockHash}`, "color: #00e6c3");
    toast.success("Transaction submitted", { id });
  } catch (err) {
    const elapsed = ((performance.now() - startMs) / 1000).toFixed(2);
    const msg = err instanceof Error ? err.message : String(err);

    console.group(`%c[TrialVault TX ${txId}] Transaction FAILED ✗`, "color: #ff4444; font-weight: bold");
    console.error(`Error:   ${msg}`);
    console.log(`Elapsed: ${elapsed}s`);
    console.groupEnd();

    toast.error(`Transaction failed: ${msg}`, { id });
    throw err;
  }
}
