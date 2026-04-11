"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { EncryptedVault, PatientWitnesses } from "@/types/patient";

export interface WitnessStore {
  witnesses: PatientWitnesses;
  encryptedVault: EncryptedVault | null;
  isVaultReady: boolean;
  setWitnesses: (w: Partial<PatientWitnesses>) => void;
  setEncryptedVault: (vault: EncryptedVault | null) => void;
  clearWitnesses: () => void;
}

const emptyWitnesses: PatientWitnesses = {
  age: null,
  diagnosisCode: null,
  labValue1: null,
  labValue2: null,
  nullifierSecret: null,
};

/** Serialised store shape stored in localStorage (nullifierSecret as number[]). */
interface PersistedWitnesses extends Omit<PatientWitnesses, "nullifierSecret"> {
  nullifierSecret: number[] | null;
}

interface PersistedWitnessStore {
  witnesses: PersistedWitnesses;
  encryptedVault: EncryptedVault | null;
  isVaultReady: boolean;
}

export const useWitnessStore = create<WitnessStore>()(
  persist(
    (set) => ({
      witnesses: emptyWitnesses,
      encryptedVault: null,
      isVaultReady: false,

      setWitnesses: (w) =>
        set((state) => {
          const merged: PatientWitnesses = { ...state.witnesses, ...w };
          return {
            witnesses: merged,
            isVaultReady:
              merged.age !== null &&
              merged.diagnosisCode !== null &&
              merged.labValue1 !== null &&
              merged.nullifierSecret !== null,
          };
        }),

      setEncryptedVault: (vault) => set({ encryptedVault: vault }),

      clearWitnesses: () =>
        set({ witnesses: emptyWitnesses, encryptedVault: null, isVaultReady: false }),
    }),
    {
      name: "trialvault-witness-store",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            }
      ),

      /**
       * Convert Uint8Array → number[] before JSON serialisation.
       * Cast to WitnessStore required because PersistedWitnessStore.witnesses.nullifierSecret
       * is number[] but WitnessStore.witnesses.nullifierSecret is Uint8Array.
       */
      partialize: (state): WitnessStore =>
        ({
          witnesses: {
            ...state.witnesses,
            nullifierSecret: state.witnesses.nullifierSecret
              ? Array.from(state.witnesses.nullifierSecret)
              : null,
          },
          encryptedVault: state.encryptedVault,
          isVaultReady: state.isVaultReady,
        }) as unknown as WitnessStore,

      /** Restore number[] → Uint8Array on hydration. */
      merge: (persistedRaw, current) => {
        const persisted = persistedRaw as PersistedWitnessStore;
        return {
          ...current,
          witnesses: {
            ...persisted.witnesses,
            nullifierSecret: Array.isArray(persisted.witnesses?.nullifierSecret)
              ? new Uint8Array(persisted.witnesses.nullifierSecret)
              : null,
          },
          encryptedVault: persisted.encryptedVault ?? null,
          isVaultReady: persisted.isVaultReady ?? false,
        };
      },
    }
  )
);
