import React from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/simulator", label: "Simulator" },
    { href: "/copilot", label: "Copilot" },
    { href: "/upload", label: "Upload Dataset" },
    { href: "/report", label: "Report" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">FairLens AI</span>
            <span className="hidden md:inline-block ml-4 text-sm text-muted-foreground border-l pl-4 border-border">
              Detect, Prove & Fix Bias in 30 Seconds
            </span>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent/10 hover:text-accent-foreground cursor-pointer ${
                    location === link.href
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>FairLens AI — Hackathon Demo</p>
        </div>
      </footer>
    </div>
  );
}
