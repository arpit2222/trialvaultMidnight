"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HashCommitment } from "@/components/integrity/HashCommitment";
import { ProofGenerator } from "@/components/zk/ProofGenerator";
import { NullifierStatus } from "@/components/zk/NullifierStatus";
import { ProofSuccess } from "@/components/zk/ProofSuccess";
import { useTrials } from "@/hooks/useTrials";
import { useEligibility } from "@/hooks/useEligibility";
import { useVault } from "@/hooks/useVault";
import { useConsent } from "@/hooks/useConsent";
import { generateEligibilityProof } from "@/lib/zk/eligibility";
import { toast } from "sonner";
import { runTxStatus } from "@/lib/tx";

/**
 * PatientTrialDetail enrolls via ZK proofs generated locally.
 */
export default function PatientTrialDetail() {
  const params = useParams();
  const trialId = params.trialId as string;
  const { trials, isLoading } = useTrials();
  const trial = trials.find((t) => t.id.toString() === trialId);
  const { isEligible } = useEligibility(trial ? trial.id : 0n);
  const { witnesses } = useVault();
  const { grantConsent, revokeConsent, consents } = useConsent();
  const [proof, setProof] = useState<string | null>(null);
  const [nullifier, setNullifier] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading trial...</div>;
  if (!trial) return <div className="text-sm text-muted-foreground">Trial not found.</div>;

  const alreadyEnrolled = consents.some((c) => c.trialId === trialId && c.status === "active");
  const canGenerate = isEligible === true;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Card className="border-white/10 bg-white/5 p-6">
          <h1 className="text-2xl font-semibold text-white">{trial.name}</h1>
          <p className="text-sm text-muted-foreground">{trial.description}</p>
          <div className="mt-4 text-sm text-muted-foreground">
            Phase {trial.phase} · Sponsor {trial.sponsor}
          </div>
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
          <p className="text-xs text-muted-foreground">
            Enrollment stats: {trial.consentCount} patients enrolled
          </p>
        </div>
        <Card className="border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold text-white">Privacy guarantee</h2>
          <p className="text-sm text-muted-foreground">
            Exact criteria values are hashed — even we don&apos;t know them. Proofs reveal only eligibility.
          </p>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 p-6 space-y-6">
        {!alreadyEnrolled ? (
          <>
            <div>
              <h2 className="text-lg font-semibold text-white">Your eligibility</h2>
              <p className="text-sm text-muted-foreground">
                Age: {isEligible ? "In range ✓" : "Pending"} · Diagnosis: {isEligible ? "Matched ✓" : "Pending"}
              </p>
              <p className="text-xs text-muted-foreground">
                Exact criteria values are hashed — even we don&apos;t know them.
              </p>
            </div>

            {isEligible === false && (
              <p className="text-sm text-amber-200">✗ Criteria not met. Update your vault to re-check.</p>
            )}
            {isEligible === null && (
              <p className="text-sm text-amber-200">Complete your vault to check eligibility.</p>
            )}

            <ProofGenerator
              isGenerating={isGenerating}
              disabled={!canGenerate}
              onGenerate={async () => {
                try {
                  setIsGenerating(true);
                  if (!witnesses.nullifierSecret) throw new Error("Missing nullifier secret");
                  const generated = await generateEligibilityProof({
                    witnesses,
                    trialCriteria: trial.criteria,
                    trialId: trial.id,
                    protocolId: trial.protocolHash,
                    nullifierSecret: witnesses.nullifierSecret,
                  });
                  setProof(generated.proof);
                  setNullifier(generated.nullifier);
                  toast.success("Proof generated locally");
                } catch {
                  toast.error("Proof generation failed");
                } finally {
                  setIsGenerating(false);
                }
              }}
            />

            {proof && (
              <div className="space-y-2">
                <ProofSuccess />
                {nullifier && <NullifierStatus nullifier={nullifier} />}
                <p className="text-xs text-muted-foreground">
                  This nullifier prevents double-enrollment without identifying you.
                </p>
                <Button
                  className="w-full"
                  onClick={async () => {
                    await runTxStatus();
                    await grantConsent(trial.id);
                    toast.success("Enrolled in trial");
                  }}
                >
                  Enroll in Trial
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-emerald-200">Consent token active.</p>
            <Button
              variant="destructive"
              onClick={async () => {
                await runTxStatus();
                await revokeConsent(trialId);
                toast.success("Consent revoked");
              }}
            >
              Revoke Consent
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
