import { create } from "zustand";

export type RoleType = "pharma" | "patient" | "unregistered" | null;

export interface RoleStore {
  role: RoleType;
  isLoading: boolean;
  setRole: (role: RoleType) => void;
  setLoading: (loading: boolean) => void;
}

export const useRoleStore = create<RoleStore>((set) => ({
  role: null,
  isLoading: true,
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
