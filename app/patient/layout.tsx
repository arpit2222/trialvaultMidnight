"use client";

import { RoleGate } from "@/components/wallet/RoleGate";
import { PatientSidebar } from "@/components/layout/PatientSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Activity, ClipboardCheck, DollarSign, Home, ShieldAlert, Vault } from "lucide-react";

/**
 * PatientLayout keeps health data client-side and enforces role access.
 */
export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const items = [
    { href: "/patient", label: "Home", icon: Home },
    { href: "/patient/vault", label: "Vault", icon: Vault },
    { href: "/patient/trials", label: "Trials", icon: Activity },
    { href: "/patient/consent", label: "Consent", icon: ClipboardCheck },
    { href: "/patient/earnings", label: "Earnings", icon: DollarSign },
    { href: "/patient/report", label: "Report", icon: ShieldAlert },
  ];

  return (
    <RoleGate requiredRole="patient">
      <div className="min-h-screen bg-brand-navy text-white">
        <Navbar />
        <div className="flex">
          <PatientSidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
        <MobileNav items={items} />
      </div>
    </RoleGate>
  );
}
