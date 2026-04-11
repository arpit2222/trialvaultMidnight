"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTrials } from "@/hooks/useTrials";

const THRESHOLD = 5; // auto-alert threshold: >5 events triggers contract alert

// Demo adverse event counts per trial ID (in production: read from event_reporter.compact)
const DEMO_EVENT_COUNTS: Record<string, { count: number; severity: number }> = {
  "1": { count: 3, severity: 2 },
  "2": { count: 8, severity: 4 },
  "3": { count: 1, severity: 1 },
};

function statusForTrial(trialId: string) {
  const events = DEMO_EVENT_COUNTS[trialId];
  if (!events) return { label: "No data", variant: "secondary" as const, alertFired: false };
  if (events.count > THRESHOLD) return { label: "Alert", variant: "destructive" as const, alertFired: true };
  if (events.count >= 3) return { label: "Warning", variant: "outline" as const, alertFired: false };
  return { label: "Safe", variant: "secondary" as const, alertFired: false };
}

/**
 * PharmaAdverseEventsPage shows uncensorable on-chain alerts.
 * Privacy role: shows only aggregate event counts, no patient identities.
 */
export default function PharmaAdverseEventsPage() {
  const { trials } = useTrials();
  const alertTrials = trials.filter(
    (t) => statusForTrial(t.id.toString()).alertFired
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Adverse Events</h1>

      <Card className="border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">All trials summary</h2>
        <div className="space-y-3">
          {trials.length === 0 && (
            <p className="text-sm text-muted-foreground">No trials found.</p>
          )}
          {trials.map((trial) => {
            const events = DEMO_EVENT_COUNTS[trial.id.toString()];
            const { label, variant } = statusForTrial(trial.id.toString());
            return (
              <div
                key={trial.id.toString()}
                className="flex items-center justify-between rounded-md border border-white/5 bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{trial.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {events
                      ? `${events.count} events · avg severity ${events.severity}/5`
                      : "No events reported"}
                  </p>
                </div>
                <Badge variant={variant}>{label}</Badge>
              </div>
            );
          })}
        </div>
      </Card>

      {alertTrials.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Active Alerts</h2>
          {alertTrials.map((trial) => (
            <Card
              key={trial.id.toString()}
              className="border-red-500/30 bg-red-500/10 p-5 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Badge variant="destructive">ALERT</Badge>
                <p className="text-sm font-semibold text-red-100">{trial.name}</p>
              </div>
              <p className="text-sm text-red-200">
                Threshold of {THRESHOLD} adverse events exceeded.{" "}
                {DEMO_EVENT_COUNTS[trial.id.toString()]?.count} events reported
                with average severity {DEMO_EVENT_COUNTS[trial.id.toString()]?.severity}/5.
              </p>
              <p className="rounded border border-red-500/20 bg-red-900/20 px-3 py-2 text-xs text-red-300">
                This alert was fired automatically by the smart contract
                (event_reporter.compact · checkThreshold). It cannot be suppressed
                or removed by the trial sponsor.
              </p>
            </Card>
          ))}
        </div>
      )}

      {alertTrials.length === 0 && trials.length > 0 && (
        <Card className="border-white/10 bg-white/5 p-5">
          <p className="text-sm text-emerald-300">
            ✓ No threshold alerts active. All trials within safety bounds.
          </p>
        </Card>
      )}
    </div>
  );
}
