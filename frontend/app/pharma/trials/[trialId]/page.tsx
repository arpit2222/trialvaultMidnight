"use client";

import { useParams } from "next/navigation";
import { useTrials } from "@/hooks/useTrials";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PoolCountDisplay } from "@/components/trials/PoolCountDisplay";
import { HashCommitment } from "@/components/integrity/HashCommitment";
import Link from "next/link";

/**
 * PharmaTrialDetail shows only aggregate trial stats and commitments.
 */
export default function PharmaTrialDetail() {
  const params = useParams();
  const trialId = params.trialId as string;
  const { trials, isLoading } = useTrials();
  const trial = trials.find((t) => t.id.toString() === trialId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading trial...</div>;
  }
  if (!trial) {
    return <div className="text-sm text-muted-foreground">Trial not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">{trial.name}</h1>
          <p className="text-sm text-muted-foreground">{trial.indication}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{trial.phase}</Badge>
          <Badge variant="secondary">{trial.status}</Badge>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5 p-6">
        <p className="text-xs text-muted-foreground">Eligible patient count</p>
        <PoolCountDisplay count={trial.eligibleCount} />
      </Card>

      <div className="space-y-2">
        <HashCommitment label="Protocol hash" hash={trial.protocolHash} />
        <a
          href="https://explorer.testnet.midnight.network"
          className="text-sm text-brand-mint underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          View on Midnight Explorer
        </a>
      </div>

      <Card className="border-white/10 bg-white/5 p-6">
        <p className="text-sm font-semibold text-white">Timeline</p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Created → {trial.createdAt}</li>
          <li>Protocol committed → pending</li>
          <li>Enrollment open → scheduled</li>
          <li>Closed → pending</li>
          <li>Results → pending</li>
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={`/pharma/trials/${trial.id.toString()}/consent`}>View Consent Status</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/pharma/trials/${trial.id.toString()}/results`}>
            Commit Dataset & Publish Results
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/pharma/adverse-events">View Adverse Events</Link>
        </Button>
      </div>
    </div>
  );
}
