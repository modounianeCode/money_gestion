"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Landmark,
  Upload,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/epargne", label: "Épargne", icon: PiggyBank },
  { href: "/dettes", label: "Dettes", icon: Landmark },
  { href: "/import", label: "Import PDF", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-zinc-200 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-zinc-950">
      <Link href="/dashboard" className="mb-4 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white">
          M
        </span>
        <span className="font-bold">Money Gestion</span>
      </Link>
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-emerald-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
      <p className="mt-auto px-2 text-xs text-zinc-400">FCFA • Neon • V1</p>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 bg-white p-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium",
              active ? "bg-emerald-600 text-white" : "text-zinc-600 dark:text-zinc-300"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
