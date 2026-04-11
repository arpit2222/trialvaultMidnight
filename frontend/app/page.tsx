"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useRole } from "@/hooks/useRole";

/**
 * HomePage introduces TrialVault without collecting any user data.
 *
 * - Not connected → show marketing page with ConnectButton
 * - Connected + role known → redirect to correct portal
 * - Connected + unregistered → show role selection (via RoleGate on portal page)
 */
export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { role, isLoading } = useRole();

  // Auto-redirect once role is resolved.
  useEffect(() => {
    if (!isConnected || isLoading) return;
    if (role === "pharma") router.replace("/pharma");
    else if (role === "patient") router.replace("/patient");
    // unregistered → stay here, let them connect and then pick a role via /pharma or /patient
  }, [isConnected, isLoading, role, router]);

  return (
    <div className="min-h-screen bg-brand-navy text-white">
      <Navbar />
      <main>
        <section className="relative overflow-hidden px-6 py-20">
          <div className="absolute inset-0 grid-bg opacity-70" aria-hidden />
          <div className="relative mx-auto max-w-6xl">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-mint">Zero-knowledge clinical trials</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
              TrialVault — Prove Eligibility. Preserve Identity.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-slate-200">
              The first ZK-native clinical trial platform on Midnight Network.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {isConnected ? (
                isLoading ? (
                  <p className="text-sm text-muted-foreground animate-pulse">Loading your dashboard…</p>
                ) : role === "unregistered" || role === null ? (
                  <>
                    <Button
                      className="bg-brand-blue text-white hover:bg-brand-blue/90"
                      onClick={() => router.push("/pharma")}
                    >
                      Continue as Pharma →
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                      onClick={() => router.push("/patient")}
                    >
                      Continue as Patient →
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground animate-pulse">Redirecting to dashboard…</p>
                )
              ) : (
                <>
                  <ConnectButton />
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to get started
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            {[
              { value: "$54B", label: "Market size" },
              { value: "85%", label: "Trials miss deadlines" },
              { value: "$41K", label: "Per patient cost" },
            ].map((stat) => (
              <Card key={stat.label} className="border-white/10 bg-white/5 p-6">
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-2xl font-semibold">How it works</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Patient proves eligibility",
                  body: "Health data stays encrypted on device; witnesses never leave the browser.",
                },
                {
                  title: "Zero-knowledge proof",
                  body: "Proofs confirm criteria without revealing age, diagnosis, or labs.",
                },
                {
                  title: "Pharma sees counts only",
                  body: "Trial creators view eligible pool sizes with no patient identity exposure.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{item.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-black/30 p-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-2xl font-semibold">Your health data NEVER leaves your device</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                  TrialVault generates ZK proofs locally. Only the proof and aggregated counts
                  reach the chain. No plaintext, no uploads, no hidden analytics.
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-white">Data flow</p>
                <ul className="mt-3 space-y-2">
                  <li>Private: Health data → Encrypted vault → Local witnesses</li>
                  <li>Public: ZK proof → Eligible count → Consent token</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>Built on Midnight Network</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-brand-mint underline-offset-4 hover:underline"
          >
            GitHub · TrialVault
          </a>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Hackathon</span>
        </div>
      </footer>
    </div>
  );
}
