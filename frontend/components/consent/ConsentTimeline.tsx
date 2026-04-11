"use client";

import { Badge } from "@/components/ui/badge";

/**
 * ConsentTimeline displays aggregate events without exposing identities.
 */
export function ConsentTimeline() {
  const events = [
    { date: "2026-03-12", label: "Consent issued" },
    { date: "2026-03-28", label: "Disclosure approved" },
    { date: "2026-04-02", label: "Consent active" },
  ];
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.date} className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline">{event.date}</Badge>
          {event.label}
        </div>
      ))}
    </div>
  );
}
