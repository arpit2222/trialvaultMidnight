import { Badge } from "@/components/ui/badge";

/**
 * ProofSuccess confirms proof generation without exposing witness values.
 */
export function ProofSuccess() {
  return <Badge className="bg-emerald-500/20 text-emerald-200">✓ Proof generated</Badge>;
}
