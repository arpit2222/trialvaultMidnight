"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EligibilityBadge } from "@/components/trials/EligibilityBadge";
import { useEligibility } from "@/hooks/useEligibility";
import { useWitnessStore } from "@/store/witnessStore";
import type { Trial } from "@/types/trial";

/**
 * TrialCard renders trial summaries while keeping eligibility checks local.
 */
export function TrialCard({ trial }: { trial: Trial }) {
  const { isEligible } = useEligibility(trial.id);
  const { isVaultReady } = useWitnessStore();

  const status = !isVaultReady
    ? "missing"
    : isEligible === null
      ? "checking"
      : isEligible
        ? "eligible"
        : "ineligible";

  return (
    <Card className="border-white/10 bg-white/5 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{trial.name}</h3>
          <p className="text-sm text-muted-foreground">{trial.sponsor}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{trial.phase}</Badge>
          <Badge variant="secondary">{trial.status}</Badge>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{trial.indication}</p>
      <div className="mt-4">
        <EligibilityBadge status={status} />
      </div>
      <Button asChild className="mt-5 w-full">
        <Link href={`/patient/trials/${trial.id.toString()}`}>View & Enroll</Link>
      </Button>
      <p className="mt-3 text-xs text-muted-foreground">
        Eligibility checks are performed locally using your device data.
      </p>
    </Card>
  );
}
