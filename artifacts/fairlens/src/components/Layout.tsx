import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShieldCheck, HelpCircle } from "lucide-react";
import { InsightCoach } from "./InsightCoach";
import { CommandMenu } from "./CommandMenu";
import { RiskIndicator } from "./RiskIndicator";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Button } from "./ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/simulator", label: "Simulator" },
    { href: "/analyzer", label: "Analyzer" },
    { href: "/copilot", label: "Copilot" },
    { href: "/upload", label: "Upload Dataset" },
    { href: "/pipeline", label: "Pipeline" },
    { href: "/report", label: "Report" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg tracking-tight">FairLens AI</span>
            </div>
            <RiskIndicator />
          </div>
          
          <nav className="hidden lg:flex items-center gap-1">
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

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShortcutsOpen(true)} title="Keyboard Shortcuts">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </Button>
            <div className="hidden sm:flex text-xs text-muted-foreground bg-muted px-2 py-1 rounded border">
              Cmd+K
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>

      <footer className="border-t border-border mt-auto">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center text-sm text-muted-foreground">
          <p>FairLens AI — Hackathon Demo</p>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-foreground transition-colors" onClick={() => setShortcutsOpen(true)}>Shortcuts</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </footer>

      {/* Global Features */}
      <InsightCoach />
      <CommandMenu />
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
