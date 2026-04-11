import { Badge } from "@/components/ui/badge";

/**
 * MerkleVerifier conveys dataset integrity without revealing data.
 */
export function MerkleVerifier({ status }: { status: "verified" | "pending" | "failed" }) {
  if (status === "verified") {
    return <Badge className="bg-emerald-500/20 text-emerald-200">✓ Verified on-chain</Badge>;
  }
  if (status === "failed") {
    return <Badge variant="destructive">✗ Verification failed</Badge>;
  }
  return <Badge variant="secondary">Pending verification</Badge>;
}
