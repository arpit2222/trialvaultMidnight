"use client";

import { RoleGate } from "@/components/wallet/RoleGate";
import { PharmaSidebar } from "@/components/layout/PharmaSidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { FileText, Home, PlusCircle, ShieldAlert } from "lucide-react";

/**
 * PharmaLayout gates access without exposing patient data.
 */
export default function PharmaLayout({ children }: { children: React.ReactNode }) {
  const items = [
    { href: "/pharma", label: "Home", icon: Home },
    { href: "/pharma/create-trial", label: "Create", icon: PlusCircle },
    { href: "/pharma/trials", label: "Trials", icon: FileText },
    { href: "/pharma/adverse-events", label: "Alerts", icon: ShieldAlert },
  ];

  return (
    <RoleGate requiredRole="pharma">
      <div className="min-h-screen bg-brand-navy text-white">
        <Navbar />
        <div className="flex">
          <PharmaSidebar />
          <main className="flex-1 p-6">{children}</main>
        </div>
        <MobileNav items={items} />
      </div>
    </RoleGate>
  );
}
