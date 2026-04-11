import { Badge } from "@/components/ui/badge";

/**
 * EligibilityBadge shows client-side eligibility without revealing criteria values.
 */
export function EligibilityBadge({
  status,
}: {
  status: "eligible" | "ineligible" | "missing" | "checking";
}) {
  if (status === "checking") {
    return <Badge variant="secondary">Checking eligibility...</Badge>;
  }
  if (status === "missing") {
    return <Badge variant="outline">Complete your vault to check</Badge>;
  }
  if (status === "eligible") {
    return <Badge className="bg-emerald-500/20 text-emerald-200">✓ You may be eligible</Badge>;
  }
  return <Badge variant="secondary">✗ Criteria not met</Badge>;
}
