"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract } from "wagmi";
import { toast } from "sonner";
import { runTxStatus } from "@/lib/tx";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useRole } from "@/hooks/useRole";
import { useRoleStore } from "@/store/roleStore";
import { contractAddresses, registryAbi } from "@/lib/midnight/contracts";
import { setDemoRole, isDemoMode } from "@/lib/demo/roleService";
import type { DemoRole } from "@/lib/demo/roleService";

/**
 * RoleGate enforces role-based access.
 *
 * States handled:
 *   no wallet       → show ConnectButton
 *   loading         → show spinner
 *   unregistered    → show role selection cards
 *   wrong role      → redirect to correct portal
 *   correct role    → render children
 */
export function RoleGate({
  requiredRole,
  children,
}: {
  requiredRole: "pharma" | "patient";
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { role, isLoading } = useRole();
  const { setRole } = useRoleStore();
  const { writeContractAsync } = useWriteContract();
  const [isRegistering, setIsRegistering] = useState(false);

  // Redirect once role is known and doesn't match this portal.
  useEffect(() => {
    if (!role || role === "unregistered") return;
    if (role !== requiredRole) {
      router.replace(role === "pharma" ? "/pharma" : "/patient");
    }
  }, [role, requiredRole, router]);

  // ── No wallet ──────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <h2 className="text-2xl font-semibold text-white">Connect your wallet to continue</h2>
        <p className="text-sm text-muted-foreground">
          Use Lace Wallet (Midnight native) or MetaMask
        </p>
        <ConnectButton />
      </div>
    );
  }

  // ── Loading role ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Checking role…</p>
      </div>
    );
  }

  // ── Unregistered — show role selection ────────────────────────────────────
  if (role === "unregistered" || role === null) {
    const options: { role: DemoRole; title: string; desc: string }[] = [
      {
        role: "pharma",
        title: "I'm a Trial Creator (Pharma)",
        desc: "Create trials, commit protocol hashes on-chain, and view aggregate eligible counts only.",
      },
      {
        role: "patient",
        title: "I'm a Patient",
        desc: "Prove eligibility via ZK proof, consent to trials, and earn TVAULT from selective disclosure.",
      },
    ];

    async function register(selectedRole: DemoRole) {
      if (!address) return;
      setIsRegistering(true);
      try {
        if (isDemoMode()) {
          // Demo mode: persist role locally, simulate tx feedback.
          await runTxStatus();
          setDemoRole(address, selectedRole);
          setRole(selectedRole);
          toast.success(`Registered as ${selectedRole}`);
          router.replace(selectedRole === "pharma" ? "/pharma" : "/patient");
        } else {
          // Production: register on registry.compact.
          await runTxStatus();
          await writeContractAsync({
            address: contractAddresses.registry as `0x${string}`,
            abi: registryAbi,
            functionName: selectedRole === "pharma" ? "registerAsPharma" : "registerAsPatient",
          });
          toast.success("Role registered on-chain");
        }
      } catch {
        toast.error("Registration failed — check console for details");
      } finally {
        setIsRegistering(false);
      }
    }

    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-widest text-brand-mint">Welcome to TrialVault</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Select your role</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This is recorded on-chain and cannot be changed later.
            {isDemoMode() && (
              <span className="ml-1 text-amber-300">(Demo mode — stored locally)</span>
            )}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {options.map((option) => (
            <Card key={option.role} className="border border-white/10 bg-white/5 p-6 space-y-4">
              <h3 className="text-xl font-semibold text-white">{option.title}</h3>
              <p className="text-sm text-muted-foreground">{option.desc}</p>
              <Button
                className="w-full"
                disabled={isRegistering}
                onClick={() => void register(option.role)}
              >
                {isRegistering ? "Registering…" : `Continue as ${option.role}`}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Wrong portal — redirect in progress ───────────────────────────────────
  if (role !== requiredRole) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Redirecting…</p>
      </div>
    );
  }

  // ── Correct role — render portal ──────────────────────────────────────────
  return <>{children}</>;
}
