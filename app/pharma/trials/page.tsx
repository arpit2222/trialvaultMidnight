"use client";

import Link from "next/link";
import { useTrials } from "@/hooks/useTrials";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * PharmaTrialsPage lists trials with only aggregate visibility.
 */
export default function PharmaTrialsPage() {
  const { trials, isLoading } = useTrials();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading trials...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">All trials</h1>
      <div className="grid gap-4">
        {trials.map((trial) => (
          <Card key={trial.id.toString()} className="border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{trial.name}</h3>
                <p className="text-sm text-muted-foreground">{trial.indication}</p>
              </div>
              <Button asChild variant="outline">
                <Link href={`/pharma/trials/${trial.id.toString()}`}>Open</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
