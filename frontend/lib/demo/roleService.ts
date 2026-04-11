"use client";

/**
 * Demo-mode role persistence layer.
 *
 * Privacy role: stores only the public role (pharma | patient), never health data.
 * In production this is replaced by on-chain reads via registry.compact.
 * Using localStorage lets roles persist across page refreshes without a deployed contract.
 */

export type DemoRole = "pharma" | "patient";

const STORAGE_KEY = "trialvault:roles:v1";

type RoleMap = Record<string, DemoRole>;

function readMap(): RoleMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RoleMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: RoleMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Return the stored role for a wallet address, or null if unregistered. */
export function getDemoRole(address: string): DemoRole | null {
  const map = readMap();
  return map[address.toLowerCase()] ?? null;
}

/** Persist a role for a wallet address. */
export function setDemoRole(address: string, role: DemoRole): void {
  const map = readMap();
  map[address.toLowerCase()] = role;
  writeMap(map);
}

/** Remove a stored role (e.g. on wallet disconnect). */
export function clearDemoRole(address: string): void {
  const map = readMap();
  delete map[address.toLowerCase()];
  writeMap(map);
}

/** True when no registry contract is deployed (demo mode active). */
export function isDemoMode(): boolean {
  return !process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS;
}
