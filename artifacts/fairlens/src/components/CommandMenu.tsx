import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator,
  CommandShortcut
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  Play, 
  Activity, 
  MessageSquare, 
  FileSpreadsheet, 
  BarChart, 
  Search,
  Wrench,
  RotateCcw
} from "lucide-react";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      {/* Required by radux dialog for accessibility */}
      <DialogTitle className="sr-only">Command Palette</DialogTitle>
      
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runAction(() => setLocation("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => setLocation("/simulator"))}>
            <Play className="mr-2 h-4 w-4" />
            <span>Simulator</span>
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => setLocation("/analyzer"))}>
            <Activity className="mr-2 h-4 w-4" />
            <span>Analyzer</span>
            <CommandShortcut>G A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => setLocation("/copilot"))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Copilot</span>
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => setLocation("/upload"))}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <span>Upload Dataset</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => setLocation("/report"))}>
            <BarChart className="mr-2 h-4 w-4" />
            <span>Report</span>
            <CommandShortcut>G R</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runAction(() => {
             toast({ title: "Analysis Started", description: "Running full dataset audit in background." });
          })}>
            <Search className="mr-2 h-4 w-4" />
            <span>Run Analysis</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => {
             setLocation("/report");
             toast({ title: "Fix Applied", description: "Navigated to post-debiasing report." });
          })}>
            <Wrench className="mr-2 h-4 w-4" />
            <span>Apply Fix</span>
          </CommandItem>
          <CommandItem onSelect={() => runAction(() => {
             setLocation("/");
             toast({ title: "Demo Reset", description: "All settings restored to default." });
          })}>
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Reset Demo</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
