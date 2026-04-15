"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/burns", label: "Burn Feed" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070c14]/85 backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-sm font-semibold tracking-[0.16em] text-zinc-100 uppercase">
          ChilizBurn
        </Link>

        <ul className="flex items-center gap-2 text-sm text-zinc-300">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 transition-colors",
                  pathname === item.href
                    ? "bg-rose-500/15 text-rose-300"
                    : "text-zinc-300 hover:bg-white/5 hover:text-zinc-100",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
