"use client";

/**
 * Demo-mode trial persistence layer.
 *
 * Privacy role: stores only public trial metadata (no patient data).
 * In production this is replaced by on-chain reads via Midnight indexer.
 * Using localStorage lets pharma-created trials appear immediately in the
 * patient portal without a running backend.
 */

import type { Trial } from "@/types/trial";

const STORAGE_KEY = "trialvault:trials:v1";

// Seed trials shown on first load. Represent realistic Phase II/III studies.
const SEED_TRIALS: Trial[] = [
  {
    id: 1n,
    name: "GLP-1 Metabolic Study",
    description:
      "Evaluating metabolic markers and HbA1c control in adults with uncontrolled Type 2 Diabetes on standard-of-care therapy.",
    phase: "Phase II",
    indication: "Type 2 Diabetes",
    sponsor: "Nova Bio",
    enrollmentTarget: 240,
    startDate: "2026-05-01",
    status: "open",
    protocolHash:
      "0x7f3ba1c2e84d59f01b3c8a7d4e6b2f5c9d1e3a7b0c4f8d2e6a9b3c5f7d1e4a8",
    criteria: {
      minAge: 30,
      maxAge: 65,
      diagnosisCode: 250,
      labMin1: 6,
      labMax1: 9,
    },
    eligibleCount: 128,
    consentCount: 72,
    createdAt: "2026-04-01",
  },
  {
    id: 2n,
    name: "Hypertension Outcomes Trial",
    description:
      "Monitoring 24-hour ambulatory blood pressure control with a novel ARB therapy versus amlodipine standard care.",
    phase: "Phase III",
    indication: "Hypertension",
    sponsor: "Acme Pharma",
    enrollmentTarget: 520,
    startDate: "2026-06-10",
    status: "open",
    protocolHash:
      "0x5a12b8c3d4e1f6a9b2c7d8e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3",
    criteria: {
      minAge: 40,
      maxAge: 75,
      diagnosisCode: 401,
      labMin1: 120,
      labMax1: 160,
    },
    eligibleCount: 212,
    consentCount: 110,
    createdAt: "2026-03-22",
  },
  {
    id: 3n,
    name: "CKD Progression HALT Study",
    description:
      "Phase II study of SGLT2 inhibitor therapy for slowing progression of chronic kidney disease in non-diabetic patients.",
    phase: "Phase II",
    indication: "Chronic Kidney Disease",
    sponsor: "Nephro Therapeutics",
    enrollmentTarget: 180,
    startDate: "2026-07-15",
    status: "open",
    protocolHash:
      "0x9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e",
    criteria: {
      minAge: 35,
      maxAge: 70,
      diagnosisCode: 585,
      labMin1: 15,
      labMax1: 60,
    },
    eligibleCount: 87,
    consentCount: 34,
    createdAt: "2026-04-05",
  },
];

/** Serialise BigInt fields to strings so JSON.stringify works. */
function serialiseTrial(trial: Trial): Record<string, unknown> {
  return { ...trial, id: trial.id.toString() };
}

/** Restore string IDs back to BigInt after JSON.parse. */
function deserialiseTrial(raw: Record<string, unknown>): Trial {
  return { ...(raw as Omit<Trial, "id">), id: BigInt(raw.id as string) };
}

function readStorage(): Trial[] {
  if (typeof window === "undefined") return SEED_TRIALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_TRIALS;
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return parsed.map(deserialiseTrial);
  } catch {
    return SEED_TRIALS;
  }
}

function writeStorage(trials: Trial[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(trials.map(serialiseTrial))
  );
}

/** Return all trials, seeding localStorage on first call. */
export function getTrials(): Trial[] {
  const trials = readStorage();
  // Persist seed data on first load so future reads are consistent.
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeStorage(trials);
  }
  return trials;
}

export interface CreateTrialInput {
  name: string;
  description: string;
  phase: Trial["phase"];
  indication: string;
  sponsor: string;
  enrollmentTarget: number;
  startDate: string;
  protocolHash: string;
  criteria: Trial["criteria"];
}

/**
 * Persist a new trial and return the assigned on-chain ID.
 * In production: submits createTrial() to trial_matcher.compact, returns trialId.
 */
export function createTrial(input: CreateTrialInput): Trial {
  const trials = readStorage();
  const maxId = trials.reduce(
    (max, t) => (t.id > max ? t.id : max),
    0n
  );
  const newTrial: Trial = {
    id: maxId + 1n,
    name: input.name,
    description: input.description,
    phase: input.phase,
    indication: input.indication,
    sponsor: input.sponsor,
    enrollmentTarget: input.enrollmentTarget,
    startDate: input.startDate,
    status: "open",
    protocolHash: input.protocolHash || "0xpending",
    criteria: input.criteria,
    eligibleCount: 0,
    consentCount: 0,
    createdAt: new Date().toISOString().split("T")[0] as string,
  };
  writeStorage([...trials, newTrial]);
  return newTrial;
}

/**
 * Increment eligible count after a patient proves eligibility on-chain.
 * In production: read directly from trial_matcher.compact getEligibleCount().
 */
export function incrementEligibleCount(trialId: bigint): void {
  const trials = readStorage();
  writeStorage(
    trials.map((t) =>
      t.id === trialId ? { ...t, eligibleCount: t.eligibleCount + 1 } : t
    )
  );
}

/**
 * Increment or decrement consent count after patient enrols/revokes.
 */
export function updateConsentCount(trialId: bigint, delta: 1 | -1): void {
  const trials = readStorage();
  writeStorage(
    trials.map((t) =>
      t.id === trialId
        ? { ...t, consentCount: Math.max(0, t.consentCount + delta) }
        : t
    )
  );
}

/** Get a single trial by ID. */
export function getTrialById(trialId: bigint): Trial | undefined {
  return readStorage().find((t) => t.id === trialId);
}
