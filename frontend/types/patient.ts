export interface LabValue {
  name: string;
  value: number;
  unit: string;
  date: string;
}

export interface HealthData {
  dateOfBirth: string;
  primaryDiagnosis: string;
  secondaryDiagnosis?: string | null;
  labValues: LabValue[];
  medications?: string | null;
  biologicalSex: "female" | "male" | "intersex" | "other" | "prefer_not";
}

export interface EncryptedVault {
  ciphertext: string;
  iv: string;
  keyHash: string;
}

export interface PatientWitnesses {
  age: number | null;
  diagnosisCode: number | null;
  labValue1: number | null;
  labValue2: number | null;
  nullifierSecret: Uint8Array | null;
}
