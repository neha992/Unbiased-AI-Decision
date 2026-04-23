import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  ShieldCheck, 
  HelpCircle, 
  LayoutDashboard, 
  Workflow, 
  BarChart3, 
  Sliders, 
  Sparkles, 
  Upload, 
  FileText,
  LogOut,
  Search,
  Bell,
  Menu,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { InsightCoach } from "./InsightCoach";
import { CommandMenu } from "./CommandMenu";
import { RiskIndicator } from "./RiskIndicator";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Progress } from "./ui/progress";

const navGroups = [
  {
    label: "WORKSPACE",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pipeline", label: "Pipeline", icon: Workflow },
      { href: "/analyzer", label: "Analyzer", icon: BarChart3 },
      { href: "/simulator", label: "Simulator", icon: Sliders },
      { href: "/copilot", label: "Copilot", icon: Sparkles },
    ],
  },
  {
    label: "DATA",
    items: [
      { href: "/upload", label: "Upload Dataset", icon: Upload },
      { href: "/report", label: "Report", icon: FileText },
    ],
  },
];

function SidebarContent({ isMobile, closeMobile }: { isMobile?: boolean; closeMobile?: () => void }) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("equify_auth");
    setLocation("/login");
    if (closeMobile) closeMobile();
  };

  return (
    <div className="relative flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border overflow-hidden">
      {/* Ambient gradient layer */}
      <div className="pointer-events-none absolute inset-0 opacity-90"
           style={{ backgroundImage: "radial-gradient(at 100% 0%, hsl(232 70% 30% / 0.45) 0px, transparent 50%), radial-gradient(at 0% 100%, hsl(38 92% 50% / 0.18) 0px, transparent 45%)" }} />
      <div className="pointer-events-none absolute inset-0 bg-grid-dots-dark opacity-40" />

      {/* Brand */}
      <div className="relative p-5 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/40 blur-lg rounded-xl" />
          <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-xl flex items-center justify-center shadow-glow-amber">
            <ShieldCheck className="h-5 w-5 text-amber-950" />
          </div>
        </div>
        <div>
          <div className="font-extrabold text-xl tracking-tight leading-none">Equify</div>
          <div className="text-[10px] text-amber-300/80 uppercase tracking-[0.18em] font-semibold mt-1">Fairness Intelligence</div>
        </div>
      </div>

      {/* New Audit */}
      <div className="relative px-4 pb-3">
        <Button
          className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-amber-950 font-semibold shadow-glow-amber group"
          onClick={() => {
            setLocation("/upload");
            if (closeMobile) closeMobile();
          }}
        >
          <Sparkles className="h-4 w-4 mr-1.5 transition-transform group-hover:rotate-12" />
          New Audit
        </Button>
      </div>

      {/* Nav */}
      <div className="relative flex-1 overflow-y-auto py-3">
        {navGroups.map((group, i) => (
          <div key={i} className="mb-5 px-3">
            <h4 className="px-2 mb-2 text-[10px] font-bold text-amber-300/60 tracking-[0.18em]">
              {group.label}
            </h4>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      onClick={closeMobile}
                      className={`group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all relative ${
                        isActive
                          ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-white shadow-[inset_0_0_0_1px_hsl(38_92%_50%_/_0.25)]"
                          : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-amber-500 rounded-r-md shadow-[0_0_10px_hsl(38_92%_50%_/_0.7)]" />
                      )}
                      <item.icon className={`h-4 w-4 transition-colors ${isActive ? "text-amber-400" : "text-sidebar-foreground/50 group-hover:text-amber-300"}`} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="relative p-4 mt-auto border-t border-white/10 space-y-3">
        <div className="rounded-xl p-3 glass-dark">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-semibold text-white">Acme Bank</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-amber-500/30">Pro</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-sidebar-foreground/70 mb-2">
            <span>Audits used</span>
            <span className="font-mono font-semibold text-white/90">7 / 25</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all" style={{ width: `${(7 / 25) * 100}%` }} />
          </div>
        </div>

        <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-white hover:bg-white/5" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const getPageTitle = () => {
    const flatItems = navGroups.flatMap(g => g.items);
    const match = flatItems.find(i => i.href === location);
    return match ? match.label : "Equify";
  };

  const handleLogout = () => {
    localStorage.removeItem("equify_auth");
    setLocation("/login");
  };

  return (
    <div className="min-h-[100dvh] flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-[260px] flex-shrink-0 fixed inset-y-0 left-0 z-20">
        <SidebarContent />
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-10 h-16 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b border-border/70 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden -ml-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[260px] border-r-0">
                <SidebarContent isMobile closeMobile={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            
            <h1 className="font-semibold text-lg hidden sm:block">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div 
              className="hidden md:flex items-center gap-2 bg-muted/50 border border-border rounded-md px-3 py-1.5 text-sm text-muted-foreground w-64 cursor-text hover:bg-muted/80 transition-colors"
              onClick={() => {
                // Dispatch Cmd+K to open CommandMenu
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
              }}
            >
              <Search className="h-4 w-4" />
              <span>Search anything...</span>
              <div className="ml-auto flex gap-1">
                <kbd className="bg-background border px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">⌘</kbd>
                <kbd className="bg-background border px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">K</kbd>
              </div>
            </div>

            <RiskIndicator />

            <Button variant="ghost" size="icon" onClick={() => setShortcutsOpen(true)} title="Keyboard Shortcuts" className="hidden sm:flex">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
            </Button>

            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border border-background"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1">
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">DU</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Demo User</p>
                    <p className="text-xs leading-none text-muted-foreground">demo@equify.ai</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global Features */}
      <InsightCoach />
      <CommandMenu />
      <KeyboardShortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
