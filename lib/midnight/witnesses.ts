import { differenceInYears } from "date-fns";
import type { HealthData, PatientWitnesses } from "@/types/patient";

const diagnosisMap: Record<string, number> = {
  diabetes: 250,
  hypertension: 401,
  cancer: 140,
  asthma: 493,
  "chronic kidney disease": 585,
  "heart failure": 428,
  depression: 311,
  obesity: 278,
};

const labPriority = ["HbA1c", "Glucose", "BP Systolic", "BP Diastolic", "Cholesterol Total", "LDL", "HDL", "eGFR", "Creatinine", "ALT", "AST"];

export function computeWitnesses(data: HealthData): PatientWitnesses {
  const age = differenceInYears(new Date(), new Date(data.dateOfBirth));
  const diagnosisCode = diagnosisMap[data.primaryDiagnosis.toLowerCase()] ?? 0;

  const sortedLabs = [...data.labValues].sort(
    (a, b) => labPriority.indexOf(a.name) - labPriority.indexOf(b.name)
  );
  const labValue1 = sortedLabs[0]?.value ?? null;
  const labValue2 = sortedLabs[1]?.value ?? null;

  return {
    age: Number.isFinite(age) ? age : null,
    diagnosisCode,
    labValue1,
    labValue2,
    nullifierSecret: null,
  };
}
