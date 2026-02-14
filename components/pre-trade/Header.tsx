"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LineChart, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";

const NAV_LINKS = [
  { label: "Dashboard", href: "/" },
  { label: "Pre-Trade Analysis", href: "/analysis" },
  { label: "Trade Journal", href: "/journal" },
  { label: "Settings", href: "/settings" },
];


function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative flex items-center justify-center h-7 w-7 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}

export function Header() {
  const pathname = usePathname();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-12 bg-background border-b border-border px-4 gap-6 flex items-center">
        {/* <div className="container mx-auto p-4 flex items-center"> */}
        {/* Logo / brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-foreground shrink-0"
        >
          <LineChart className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold tracking-wider uppercase">
            TradeLog
          </span>
        </Link>

        <Separator orientation="vertical" className="h-4" />

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-1.5 rounded-sm text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle — pushed to the right */}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Spacer so page content clears the fixed header */}
      <div className="h-12" />
    </>
  );
}
