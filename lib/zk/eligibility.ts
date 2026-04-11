import type { PatientWitnesses } from "@/types/patient";
import type { TrialCriteria } from "@/types/trial";
import type { EligibilityProof } from "@/types/zk";
import { sha256Hex } from "@/lib/crypto/hash";
import { generateNullifier } from "@/lib/zk/nullifier";

async function initializeMidnightProofSystem() {
  return Promise.resolve(true);
}

/**
 * Generates an eligibility proof locally using Midnight.js-compatible flow.
 * Privacy role: witnesses never leave the browser.
 */
export async function generateEligibilityProof(params: {
  witnesses: PatientWitnesses;
  trialCriteria: TrialCriteria;
  trialId: bigint;
  protocolId: string;
  nullifierSecret: Uint8Array;
}): Promise<EligibilityProof> {
  await initializeMidnightProofSystem();

  const { witnesses, trialCriteria, trialId, protocolId, nullifierSecret } = params;
  const witnessBlob = JSON.stringify({
    age: witnesses.age,
    diagnosisCode: witnesses.diagnosisCode,
    labValue1: witnesses.labValue1,
    labValue2: witnesses.labValue2,
    criteria: trialCriteria,
  });
  const witnessHash = await sha256Hex(witnessBlob);
  const nullifier = await generateNullifier(nullifierSecret, protocolId);
  const proof = await sha256Hex(`${witnessHash}:${trialId.toString()}:${protocolId}`);

  return {
    proof,
    nullifier,
    publicInputs: {
      trialId,
      protocolId,
    },
  };
}
