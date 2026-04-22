import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { BarChart2, ChevronRight, ChevronLeft, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";

export interface ChartData {
  name: string;
  [key: string]: string | number;
}

interface ChartAnalyzerProps {
  children: React.ReactNode;
  data: ChartData[];
  dataKey: string;
  title: string;
  threshold?: number;
  onThresholdChange?: (val: number) => void;
  selectedBar?: string | null;
  onBarClick?: (name: string) => void;
  orientation?: "vertical" | "horizontal";
}

export function ChartAnalyzer({
  children,
  data,
  dataKey,
  title,
  threshold,
  onThresholdChange,
  selectedBar,
  onBarClick,
  orientation = "horizontal"
}: ChartAnalyzerProps) {
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const values = data.map(d => Number(d[dataKey]) || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const spread = max - min;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    let severity: "OK" | "Warning" | "Critical" = "OK";
    if (spread > 20) severity = "Critical";
    else if (spread > 10) severity = "Warning";

    const maxItem = data.find(d => Number(d[dataKey]) === max);
    const minItem = data.find(d => Number(d[dataKey]) === min);

    return { max, min, spread, avg, severity, maxItem, minItem };
  }, [data, dataKey]);

  const insight = useMemo(() => {
    if (!stats) return "No data available.";
    if (stats.spread === 0) return "All groups perform equally.";
    return `${stats.minItem?.name} is ${stats.spread.toFixed(1)} points lower than ${stats.maxItem?.name} — ${stats.severity === 'Critical' ? 'this is a significant disparity.' : 'monitor this gap.'}`;
  }, [stats]);

  const selectedItem = useMemo(() => {
    if (!selectedBar) return null;
    return data.find(d => d.name === selectedBar);
  }, [selectedBar, data]);

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden border rounded-xl bg-card">
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 relative p-4 flex flex-col min-w-0">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{title}</h3>
             <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 z-10" onClick={() => setExpanded(!expanded)}>
               <BarChart2 className="h-4 w-4" />
               {expanded ? "Hide Analyzer" : "Analyzer"}
             </Button>
          </div>
          <div className="flex-1 min-h-0 relative">
             {/* Chart Wrapper - pass click handler down via cloneElement if possible, but easier to handle in parent or let user pass it. For now we assume children handles clicks and calls onBarClick via a wrapper or we just don't strictly inject it. The parent should pass onClick to Recharts Bar */}
             {children}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l bg-muted/20 flex flex-col shrink-0"
            >
              <div className="p-4 border-b bg-muted/40 font-semibold text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Analyzer
              </div>
              
              <div className="p-4 space-y-6 overflow-y-auto flex-1">
                {/* Insight */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-muted-foreground">Live Insight</div>
                  <div className="text-sm bg-primary/5 text-primary-foreground border border-primary/20 rounded-md p-3 leading-snug">
                    {insight}
                  </div>
                </div>

                {/* Stats */}
                {stats && (
                  <div className="space-y-3">
                     <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase text-muted-foreground">Statistics</div>
                        <Badge variant="outline" className={`text-[10px] py-0 h-5 ${stats.severity === 'Critical' ? 'bg-destructive/10 text-destructive border-destructive/20' : stats.severity === 'Warning' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-green-500/10 text-green-600 border-green-500/20'}`}>
                          {stats.severity} SPREAD
                        </Badge>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                       <div className="bg-background border rounded p-2 text-center">
                         <div className="text-[10px] text-muted-foreground uppercase">Min</div>
                         <div className="font-semibold text-sm">{stats.min.toFixed(1)}</div>
                       </div>
                       <div className="bg-background border rounded p-2 text-center">
                         <div className="text-[10px] text-muted-foreground uppercase">Max</div>
                         <div className="font-semibold text-sm">{stats.max.toFixed(1)}</div>
                       </div>
                       <div className="bg-background border rounded p-2 text-center">
                         <div className="text-[10px] text-muted-foreground uppercase">Average</div>
                         <div className="font-semibold text-sm">{stats.avg.toFixed(1)}</div>
                       </div>
                       <div className="bg-background border rounded p-2 text-center">
                         <div className="text-[10px] text-muted-foreground uppercase">Spread</div>
                         <div className="font-semibold text-sm text-destructive">{stats.spread.toFixed(1)}</div>
                       </div>
                     </div>
                  </div>
                )}

                {/* Threshold */}
                {onThresholdChange && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase text-muted-foreground flex justify-between">
                      <span>Threshold</span>
                      <span>{threshold}%</span>
                    </div>
                    <Slider
                      value={[threshold || 0]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(v) => onThresholdChange(v[0])}
                    />
                    <div className="text-xs text-muted-foreground">
                      {data.filter(d => Number(d[dataKey]) >= (threshold || 0)).length} above, {data.filter(d => Number(d[dataKey]) < (threshold || 0)).length} below
                    </div>
                  </div>
                )}

                {/* Selected Bar Detail */}
                {selectedItem && (
                  <div className="space-y-2 pt-4 border-t">
                    <div className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between">
                      <span>Selected: {selectedItem.name}</span>
                      <Badge variant="secondary" className="text-[10px]">Pinned</Badge>
                    </div>
                    <div className="bg-background border rounded-md p-3 space-y-2">
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-muted-foreground">Value</span>
                         <span className="font-semibold text-sm">{selectedItem[dataKey]}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-xs text-muted-foreground">Deviation</span>
                         <span className="font-semibold text-sm text-amber-600">
                           {stats ? (Number(selectedItem[dataKey]) - stats.avg).toFixed(1) : 0}
                         </span>
                      </div>
                    </div>
                  </div>
                )}
                {!selectedItem && (
                  <div className="pt-4 border-t text-xs text-muted-foreground text-center italic">
                    Click a bar to pin details
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
