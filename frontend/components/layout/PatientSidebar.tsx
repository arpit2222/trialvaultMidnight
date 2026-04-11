"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Activity, ClipboardCheck, DollarSign, Home, ShieldAlert, Vault } from "lucide-react";

const items = [
  { href: "/patient", label: "Dashboard", icon: Home },
  { href: "/patient/vault", label: "Health Vault", icon: Vault },
  { href: "/patient/trials", label: "Trials", icon: Activity },
  { href: "/patient/consent", label: "Consents", icon: ClipboardCheck },
  { href: "/patient/earnings", label: "Earnings", icon: DollarSign },
  { href: "/patient/report", label: "Report Event", icon: ShieldAlert },
];

/**
 * PatientSidebar navigates without exposing health data to the UI state.
 */
export function PatientSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden h-full w-64 flex-col border-r border-white/10 bg-background/90 p-6 lg:flex">
      <div className="mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">Patient Portal</div>
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-white/5",
                pathname === item.href && "bg-white/10 text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
