import { Badge } from "@/components/ui/badge";

/**
 * NullifierStatus displays a truncated nullifier to prevent re-identification.
 */
export function NullifierStatus({ nullifier }: { nullifier: string }) {
  const short = `${nullifier.slice(0, 8)}...`;
  return <Badge variant="outline">Nullifier: {short}</Badge>;
}
