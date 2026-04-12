import { useEffect, useRef } from "react";
import { useRoleStore } from "@/store/roleStore";
import { useMidnight } from "@/lib/midnight/context";
import { getDemoRole, isDemoMode } from "@/lib/demo/roleService";

/**
 * useRole — resolves the connected wallet's registered role.
 *
 * Production (contracts deployed):
 *   Fetches role from /api/midnight/role using the user's userId
 *   (derived from Lace coinPublicKey or EVM address).
 *
 * Demo mode (no registry contract address set):
 *   Reads from localStorage.
 */
export function useRole() {
  const { userId, isConnected, displayAddress, hasLace, laceApi } = useMidnight();
  const { role, isLoading, setRole, setLoading } = useRoleStore();
  const lastUserIdRef = useRef<string | null>(null);

  // Only query the on-chain registry when Lace wallet is actually connected.
  // MetaMask/demo users always read from localStorage.
  const useLaceOnChain = Boolean(hasLace && laceApi);

  useEffect(() => {
    if (!isConnected || !userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    const userIdHex = Array.from(userId)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Skip if userId hasn't changed
    if (lastUserIdRef.current === userIdHex) return;
    lastUserIdRef.current = userIdHex;

    // ── Demo / EVM mode: read from localStorage ────────────────────────────
    if (!useLaceOnChain || isDemoMode()) {
      const stored = displayAddress ? getDemoRole(displayAddress) : null;
      setRole(stored ?? "unregistered");
      setLoading(false);
      return;
    }

    // ── Lace + production: query registry.compact via API ─────────────────
    setLoading(true);
    fetch(`/api/midnight/role?userId=${userIdHex}`)
      .then((r) => r.json())
      .then((data: { role: number; source?: string }) => {
        const r = data.role;
        if (r === 1) setRole("pharma");
        else if (r === 2) setRole("patient");
        else setRole("unregistered");
      })
      .catch(() => setRole("unregistered"))
      .finally(() => setLoading(false));
  }, [isConnected, userId, displayAddress, useLaceOnChain, setRole, setLoading]);

  return { role, isLoading };
}
