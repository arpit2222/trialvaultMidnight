import { toast } from "sonner";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runTxStatus() {
  toast("Preparing transaction...");
  await delay(400);
  toast("Waiting for wallet confirmation...");
  await delay(600);
  toast("Transaction submitted. Waiting for confirmation...");
  await delay(800);
  const block = Math.floor(Math.random() * 100000);
  toast.success(`✓ Confirmed — Block #${block}`);
}
