"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsentCard } from "@/components/consent/ConsentCard";
import { DisclosureRequest } from "@/components/disclosure/DisclosureRequest";
import { Card } from "@/components/ui/card";
import { useConsent } from "@/hooks/useConsent";

/**
 * ConsentPage manages consent tokens without exposing identities.
 */
export default function ConsentPage() {
  const { consents, revokeConsent } = useConsent();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Consent management</h1>
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="revoked">Revoked</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        {(["active", "pending", "revoked", "all"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
            {consents
              .filter((c) => (tab === "all" ? true : c.status === tab))
              .map((consent) => (
                <ConsentCard key={consent.trialId} consent={consent} onRevoke={revokeConsent} />
              ))}
          </TabsContent>
        ))}
      </Tabs>

      <Card className="border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Disclosure requests</h2>
        <p className="text-sm text-muted-foreground">Acme Pharma requests access to selected fields.</p>
        <div className="mt-4">
          <DisclosureRequest onApprove={() => undefined} />
        </div>
      </Card>
    </div>
  );
}
