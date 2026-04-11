import { Badge } from "@/components/ui/badge";

/**
 * PaymentSummary shows proposed TVAULT payment without exposing health data.
 */
export function PaymentSummary({ amount }: { amount: number }) {
  return <Badge variant="outline">Payment offered: {amount} TVAULT</Badge>;
}
