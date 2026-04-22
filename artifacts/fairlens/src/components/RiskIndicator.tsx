import React from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, Shield } from "lucide-react";

export function RiskIndicator() {
  const [location, setLocation] = useLocation();

  let status: "HIGH" | "MOD" | "LOW" = "LOW";
  
  if (location === "/" || location === "/simulator") status = "HIGH";
  if (location === "/analyzer") status = "HIGH";
  if (location === "/report") status = "MOD"; // Post-debiasing, let's say it's moderate or low. Requirement says MOD for report.

  return (
    <div 
      className="cursor-pointer transition-transform hover:scale-105 active:scale-95" 
      onClick={() => setLocation("/report")}
      title="View Compliance Report"
    >
      {status === "HIGH" && (
        <Badge variant="destructive" className="gap-1.5 py-1 px-3 shadow-sm border-destructive/50">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span className="font-semibold tracking-wider text-[10px] uppercase hidden sm:inline">System Risk:</span>
          <span className="font-bold">HIGH</span>
        </Badge>
      )}
      {status === "MOD" && (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1.5 py-1 px-3 shadow-sm">
          <Shield className="h-3.5 w-3.5" />
          <span className="font-semibold tracking-wider text-[10px] uppercase hidden sm:inline">System Risk:</span>
          <span className="font-bold">MODERATE</span>
        </Badge>
      )}
      {status === "LOW" && (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 gap-1.5 py-1 px-3 shadow-sm">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="font-semibold tracking-wider text-[10px] uppercase hidden sm:inline">System Risk:</span>
          <span className="font-bold">LOW</span>
        </Badge>
      )}
    </div>
  );
}
