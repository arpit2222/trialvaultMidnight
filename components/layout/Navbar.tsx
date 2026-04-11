"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useThemeMode } from "@/components/layout/RootProviders";

/**
 * Navbar exposes wallet connectivity without revealing any user health data.
 */
export function Navbar() {
  const { mode, toggle } = useThemeMode();

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-background/80 px-6 py-4 backdrop-blur">
      <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
        TrialVault
      </Link>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={toggle} aria-label="Toggle theme">
          {mode === "dark" ? "Light mode" : "Dark mode"}
        </Button>
        <ConnectButton />
      </div>
    </header>
  );
}
