import { useMemo } from "react";
import { useTrialStore } from "@/store/trialStore";
import { useWitnessStore } from "@/store/witnessStore";

export function useEligibility(trialId: bigint) {
  const { trials } = useTrialStore();
  const { witnesses, isVaultReady } = useWitnessStore();

  const trial = trials.find((item) => item.id === trialId);

  const result = useMemo(() => {
    if (!trial) return { isEligible: null, isChecking: false };
    if (!isVaultReady) return { isEligible: null, isChecking: false };

    const criteria = trial.criteria;
    const age = witnesses.age ?? 0;
    const diagnosis = witnesses.diagnosisCode ?? 0;
    const lab1 = witnesses.labValue1 ?? 0;

    const eligible =
      age >= criteria.minAge &&
      age <= criteria.maxAge &&
      diagnosis === criteria.diagnosisCode &&
      lab1 >= criteria.labMin1 &&
      lab1 <= criteria.labMax1;

    return { isEligible: eligible, isChecking: false };
  }, [trial, isVaultReady, witnesses]);

  return result;
}
