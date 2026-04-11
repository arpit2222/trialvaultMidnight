"use client";

import { Card } from "@/components/ui/card";
import { HealthDataForm } from "@/components/vault/HealthDataForm";
import { WitnessManager } from "@/components/vault/WitnessManager";
import { useVault } from "@/hooks/useVault";

/**
 * VaultPage keeps all health data encrypted and local.
 */
export default function VaultPage() {
  const { witnesses } = useVault();

  return (
    <div className="space-y-6">
      <Card className="border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        🔒 Your health data is stored ONLY in your browser. It is encrypted with your wallet key. It is NEVER uploaded to any server. ZK proofs are generated locally from this data.
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-100">
          <span className="rounded-full border border-emerald-300/30 bg-emerald-500/20 px-3 py-1">On Device ✓</span>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-500/20 px-3 py-1">On Chain (ZK Proof only) ✓</span>
        </div>
      </Card>

      <HealthDataForm />

      <Card className="border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Witness status</h2>
        <p className="text-sm text-muted-foreground">Used for eligibility checks only.</p>
        <div className="mt-4">
          <WitnessManager witnesses={witnesses} />
        </div>
      </Card>
    </div>
  );
}
