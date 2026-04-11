"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, Home, PlusCircle, ShieldAlert } from "lucide-react";

const items = [
  { href: "/pharma", label: "Dashboard", icon: Home },
  { href: "/pharma/create-trial", label: "Create Trial", icon: PlusCircle },
  { href: "/pharma/trials", label: "Trials", icon: FileText },
  { href: "/pharma/adverse-events", label: "Adverse Events", icon: ShieldAlert },
];

/**
 * PharmaSidebar keeps navigation local without exposing any patient data.
 */
export function PharmaSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden h-full w-64 flex-col border-r border-white/10 bg-background/90 p-6 lg:flex">
      <div className="mb-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">Trial Creator</div>
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
