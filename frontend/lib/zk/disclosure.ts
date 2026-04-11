import type { PatientWitnesses } from "@/types/patient";
import type { DisclosureFields, DisclosureProof } from "@/types/zk";
import { sha256Hex } from "@/lib/crypto/hash";

function decadeRange(age: number): string {
  const start = Math.floor(age / 10) * 10;
  return `${start}-${start + 10}`;
}

function diagnosisCategory(code: number): string {
  const group = Math.floor(code / 100);
  return `ICD-${group}xx`;
}

function labQuartile(value: number): string {
  const quartile = Math.min(4, Math.max(1, Math.ceil(value / 25)));
  return `Q${quartile}`;
}

/**
 * Generates a selective disclosure proof locally.
 * Privacy role: reveals only user-approved ranges.
 */
export async function generateDisclosureProof(params: {
  witnesses: PatientWitnesses;
  fieldsToDisclose: DisclosureFields;
  licenseId: bigint;
  paymentAmount: bigint;
}): Promise<DisclosureProof> {
  const { witnesses, fieldsToDisclose, licenseId, paymentAmount } = params;
  const disclosed: Record<string, string | number> = {};

  if (fieldsToDisclose.age && witnesses.age !== null) {
    disclosed.age = decadeRange(witnesses.age);
  }

  if (fieldsToDisclose.diagnosis && witnesses.diagnosisCode !== null) {
    disclosed.diagnosis = diagnosisCategory(witnesses.diagnosisCode);
  }

  if (fieldsToDisclose.lab1 && witnesses.labValue1 !== null) {
    disclosed.lab1 = labQuartile(witnesses.labValue1);
  }

  if (fieldsToDisclose.lab2 && witnesses.labValue2 !== null) {
    disclosed.lab2 = labQuartile(witnesses.labValue2);
  }

  const proof = await sha256Hex(
    JSON.stringify({ disclosed, licenseId: licenseId.toString(), paymentAmount: paymentAmount.toString() })
  );

  return {
    proof,
    disclosed,
    licenseId,
    paymentAmount,
  };
}
