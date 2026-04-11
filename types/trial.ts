export type TrialPhase = "Phase I" | "Phase II" | "Phase III" | "Phase IV";
export type TrialStatus = "open" | "closed" | "draft";

export interface TrialCriteria {
  minAge: number;
  maxAge: number;
  diagnosisCode: number;
  labMin1: number;
  labMax1: number;
  labMin2?: number | null;
  labMax2?: number | null;
}

export interface Trial {
  id: bigint;
  name: string;
  description: string;
  phase: TrialPhase;
  indication: string;
  sponsor: string;
  enrollmentTarget: number;
  startDate: string;
  status: TrialStatus;
  protocolHash: string;
  criteria: TrialCriteria;
  eligibleCount: number;
  consentCount: number;
  createdAt: string;
}
