"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VaultStatus } from "@/components/vault/VaultStatus";
import { useVault } from "@/hooks/useVault";
import { useTrials } from "@/hooks/useTrials";
import { useConsent } from "@/hooks/useConsent";
import { useEarnings } from "@/hooks/useEarnings";

/**
 * PatientDashboard summarizes local vault status without identity data.
 */
export default function PatientDashboard() {
  const { isVaultReady } = useVault();
  const { trials } = useTrials();
  const { consents } = useConsent();
  const { total } = useEarnings();

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Privacy-first access. No identity required.</p>
        <div className="mt-4">
          <VaultStatus active={isVaultReady} />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/5 p-4">
          <p className="text-xs text-muted-foreground">Eligible trials</p>
          <p className="text-2xl font-semibold text-white">{trials.length}</p>
        </Card>
        <Card className="border-white/10 bg-white/5 p-4">
          <p className="text-xs text-muted-foreground">Active consents</p>
          <p className="text-2xl font-semibold text-white">{consents.length}</p>
        </Card>
        <Card className="border-white/10 bg-white/5 p-4">
          <p className="text-xs text-muted-foreground">TVAULT earned</p>
          <p className="text-2xl font-semibold text-white">{total}</p>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Recent activity</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          <li>Consent issued for GLP-1 Metabolic Study</li>
          <li>Disclosure approved — 120 TVAULT credited</li>
          <li>Vault updated locally</li>
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/patient/trials">Check Eligibility</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/patient/earnings">View Earnings</Link>
        </Button>
      </div>
    </div>
  );
}
