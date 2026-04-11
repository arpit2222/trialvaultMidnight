import { useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { contractAddresses, registryAbi } from "@/lib/midnight/contracts";
import { useRoleStore } from "@/store/roleStore";
import { getDemoRole, isDemoMode } from "@/lib/demo/roleService";

/**
 * useRole — resolves the connected wallet's registered role.
 *
 * Demo mode (no registry contract deployed):
 *   Reads role from localStorage via roleService. No on-chain call is made.
 *
 * Production mode (registry contract deployed):
 *   Reads role from registry.compact via wagmi useReadContract.
 */
export function useRole() {
  const { address } = useAccount();
  const { role, isLoading, setRole, setLoading } = useRoleStore();

  // On-chain read — only runs when a registry contract address is configured.
  const { data, isLoading: isReading } = useReadContract({
    address: contractAddresses.registry as `0x${string}`,
    abi: registryAbi,
    functionName: "getRole",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && contractAddresses.registry && !isDemoMode()),
    },
  });

  useEffect(() => {
    if (!address) {
      setRole(null);
      setLoading(false);
      return;
    }

    // ── Demo mode ──────────────────────────────────────────────────────────
    if (isDemoMode()) {
      const stored = getDemoRole(address);
      setRole(stored ?? "unregistered");
      setLoading(false);
      return;
    }

    // ── Production mode ────────────────────────────────────────────────────
    setLoading(isReading);
    if (data === undefined) return;

    const roleValue = Number(data);
    if (roleValue === 1) setRole("pharma");
    else if (roleValue === 2) setRole("patient");
    else setRole("unregistered");
    setLoading(false);
  }, [address, data, isReading, setRole, setLoading]);

  return { role, isLoading };
}
