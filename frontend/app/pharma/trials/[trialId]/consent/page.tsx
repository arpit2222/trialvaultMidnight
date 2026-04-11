import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * PharmaConsentPage visualizes aggregate consent data only.
 */
export default function PharmaConsentPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        TrialVault cannot show you who consented. This is a feature, not a limitation.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Consents overview</h2>
          <div className="mt-4 flex items-center justify-center">
            <div className="h-40 w-40 rounded-full border-[12px] border-brand-mint/60 border-t-brand-blue/80" />
          </div>
          <div className="mt-4 text-sm text-muted-foreground">Consented 72 · Pending 40 · Revoked 8</div>
        </Card>
        <Card className="border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Consents over time</h2>
          <div className="mt-4 h-40 rounded-md bg-gradient-to-r from-brand-blue/40 to-brand-mint/40" />
        </Card>
      </div>

      <Button variant="outline">Download Aggregate Demographics Report</Button>
    </div>
  );
}
