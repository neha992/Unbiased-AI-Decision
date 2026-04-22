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
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="p-4 flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg flex items-center justify-center">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="font-bold text-xl tracking-wide leading-none">Equify</div>
          <div className="text-[10px] text-sidebar-foreground/70 uppercase tracking-wider font-semibold mt-0.5">Fairness Intelligence</div>
        </div>
      </div>

      {/* New Audit */}
      <div className="px-4 py-2">
        <Button 
          className="w-full bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold"
          onClick={() => {
            setLocation("/upload");
            if (closeMobile) closeMobile();
          }}
        >
          + New Audit
        </Button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group, i) => (
          <div key={i} className="mb-6 px-3">
            <h4 className="px-2 mb-2 text-xs font-semibold text-sidebar-foreground/50 tracking-wider">
              {group.label}
            </h4>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      onClick={closeMobile}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors relative ${
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l-md" />
                      )}
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 mt-auto border-t border-sidebar-border space-y-4">
        <div className="bg-sidebar-accent/50 p-3 rounded-lg border border-sidebar-border">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold">Acme Bank</span>
            <span className="text-[10px] bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase">Pro</span>
          </div>
          <div className="flex justify-between items-center text-xs text-sidebar-foreground/70 mb-2">
            <span>Audits used</span>
            <span>7 / 25</span>
          </div>
          <Progress value={(7 / 25) * 100} className="h-1.5 bg-sidebar-border" />
        </div>
        
        <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={handleLogout}>
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
        <header className="sticky top-0 z-10 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border flex items-center justify-between px-4 sm:px-6">
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
