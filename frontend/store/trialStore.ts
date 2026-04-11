import { create } from "zustand";
import type { Trial } from "@/types/trial";

export interface TrialStore {
  trials: Trial[];
  setTrials: (trials: Trial[]) => void;
  updateTrial: (trial: Trial) => void;
}

export const useTrialStore = create<TrialStore>((set) => ({
  trials: [],
  setTrials: (trials) => set({ trials }),
  updateTrial: (trial) =>
    set((state) => ({
      trials: state.trials.map((item) => (item.id === trial.id ? trial : item)),
    })),
}));
