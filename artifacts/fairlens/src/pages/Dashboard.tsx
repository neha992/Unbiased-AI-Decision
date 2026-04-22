import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { AlertTriangle, Play, MessageSquare, Info } from "lucide-react";
import { ChartAnalyzer } from "@/components/ChartAnalyzer";

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setCount(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span>{count}</span>;
}

export default function Dashboard() {
  const [chartThreshold, setChartThreshold] = useState(50);
  const [selectedBar, setSelectedBar] = useState<string | null>(null);

  const chartData = [
    { name: "Male", approvalRate: 78, fill: "hsl(var(--primary))" },
    { name: "Female", approvalRate: 51, fill: "hsl(var(--destructive))" },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-2 border-destructive/20 shadow-lg overflow-hidden">
          <div className="bg-destructive/10 px-6 py-3 border-b border-destructive/20 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-semibold text-destructive">High Risk Bias Detected</span>
          </div>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Fairness Score</h2>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-7xl font-bold tracking-tighter text-foreground">
                    <AnimatedCounter value={61} />
                  </span>
                  <span className="text-2xl text-muted-foreground font-medium">/ 100</span>
                </div>
                <p className="text-lg text-foreground mb-6 font-medium">
                  Female approval rate is significantly lower than male applicants.
                </p>
                
                <div className="bg-amber-500/15 border border-amber-500/30 rounded-lg p-4 mb-8 text-amber-900 dark:text-amber-200 flex gap-3 items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">Bias Alert</p>
                    <p className="text-sm">Female applicants are approved 65% as often as male applicants (Violation Detected)</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/simulator">
                    <Button size="lg" className="w-full sm:w-auto font-semibold gap-2">
                      <Play className="h-4 w-4" fill="currentColor" />
                      Prove Bias Live
                    </Button>
                  </Link>
                  <Link href="/copilot">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto font-semibold gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Ask Bias Copilot
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ChartAnalyzer
                  title="Approval Rate by Gender"
                  data={chartData}
                  dataKey="approvalRate"
                  threshold={chartThreshold}
                  onThresholdChange={setChartThreshold}
                  selectedBar={selectedBar}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--foreground))', fontWeight: 500 }} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} />
                      <ReferenceLine x={chartThreshold} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ position: 'top', value: 'Threshold', fill: 'hsl(var(--primary))', fontSize: 10 }} />
                      <Bar 
                        dataKey="approvalRate" 
                        radius={[0, 4, 4, 0]} 
                        animationDuration={1500}
                        onClick={(data) => setSelectedBar(data.name)}
                        className="cursor-pointer"
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill} 
                            opacity={selectedBar && selectedBar !== entry.name ? 0.3 : 1}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartAnalyzer>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <MetricCard 
          title="Demographic Parity Diff." 
          value="0.24" 
          status="danger"
          tooltip="Overall approval should be similar across groups. >0.1 indicates bias."
        />
        <MetricCard 
          title="Equal Opportunity Diff." 
          value="0.27" 
          status="danger"
          tooltip="Qualified applicants should be treated equally regardless of group. >0.1 indicates bias."
        />
        <MetricCard 
          title="Disparate Impact Ratio" 
          value="0.65" 
          status="danger"
          tooltip="Checks if one group is unfairly disadvantaged. Fails the 80% rule (<0.8)."
        />
        <MetricCard 
          title="Compliance Score" 
          value="38" 
          status="danger"
          subtext="High Risk"
          tooltip="Overall regulatory compliance score based on multiple fairness metrics."
        />
      </motion.div>
    </div>
  );
}

function MetricCard({ title, value, status, subtext, tooltip }: { title: string, value: string, status: "danger" | "warning" | "success", subtext?: string, tooltip: string }) {
  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${status === 'danger' ? 'bg-destructive' : status === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`} />
      <CardContent className="p-4 sm:p-5 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-medium text-muted-foreground leading-tight">{title}</p>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3 text-muted-foreground/50" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <p className={`text-2xl font-bold ${status === 'danger' ? 'text-destructive' : ''}`}>{value}</p>
          {subtext && <p className="text-xs font-medium mt-1 text-destructive uppercase tracking-wider">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
