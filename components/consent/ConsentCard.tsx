"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ConsentRecord } from "@/hooks/useConsent";

/**
 * ConsentCard summarizes consent status without patient identity.
 */
export function ConsentCard({
  consent,
  onRevoke,
}: {
  consent: ConsentRecord;
  onRevoke: (trialId: string) => void;
}) {
  return (
    <Card className="border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Trial ID</p>
          <h3 className="text-lg font-semibold text-white">{consent.trialId}</h3>
        </div>
        <Badge variant={consent.status === "active" ? "default" : "secondary"}>
          {consent.status}
        </Badge>
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        Token hash: {consent.tokenHash.slice(0, 10)}...
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Consented {consent.consentedAt}</span>
        <Button variant="outline" onClick={() => onRevoke(consent.trialId)}>
          Revoke
        </Button>
      </div>
    </Card>
  );
}
