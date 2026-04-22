import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

export function KeyboardShortcuts({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    let lastKey = "";
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      
      if (lastKey === "g") {
        if (key === "d") setLocation("/");
        if (key === "s") setLocation("/simulator");
        if (key === "a") setLocation("/analyzer");
        if (key === "c") setLocation("/copilot");
        if (key === "r") setLocation("/report");
        lastKey = "";
        clearTimeout(timeout);
        return;
      }

      if (key === "g") {
        lastKey = "g";
        timeout = setTimeout(() => { lastKey = ""; }, 1000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setLocation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="font-semibold text-muted-foreground">Command Palette</div>
            <div className="flex gap-1 justify-end"><kbd className="bg-muted px-2 py-1 rounded border shadow-sm">Cmd</kbd> + <kbd className="bg-muted px-2 py-1 rounded border shadow-sm">K</kbd></div>
            
            <div className="col-span-2 border-t my-2" />
            
            <div className="font-semibold text-muted-foreground">Go to Dashboard</div>
            <div className="flex gap-1 justify-end"><kbd className="bg-muted px-2 py-1 rounded border shadow-sm">G</kbd> then <kbd className="bg-muted px-2 py-1 rounded border shadow-sm">D</kbd></div>
            
            <div className="font-semibold text-muted-foreground">Go to Simulator</div>
            <div className="flex gap-1 justify-end"><kbd className="bg-muted px-2 py-1 rounded border shadow-sm">G</kbd> then <kbd className="bg-muted px-2 py-1 rounded border shadow-sm">S</kbd></div>
            
            <div className="font-semibold text-muted-foreground">Go to Analyzer</div>
            <div className="flex gap-1 justify-end"><kbd className="bg-muted px-2 py-1 rounded border shadow-sm">G</kbd> then <kbd className="bg-muted px-2 py-1 rounded border shadow-sm">A</kbd></div>
            
            <div className="font-semibold text-muted-foreground">Go to Copilot</div>
            <div className="flex gap-1 justify-end"><kbd className="bg-muted px-2 py-1 rounded border shadow-sm">G</kbd> then <kbd className="bg-muted px-2 py-1 rounded border shadow-sm">C</kbd></div>

            <div className="font-semibold text-muted-foreground">Go to Report</div>
            <div className="flex gap-1 justify-end"><kbd className="bg-muted px-2 py-1 rounded border shadow-sm">G</kbd> then <kbd className="bg-muted px-2 py-1 rounded border shadow-sm">R</kbd></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
