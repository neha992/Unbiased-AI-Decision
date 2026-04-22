import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell, ReferenceLine } from "recharts";
import { CheckCircle2, ArrowRight, ShieldCheck, Download } from "lucide-react";
import { ChartAnalyzer } from "@/components/ChartAnalyzer";

function AnimatedNumber({ value, isFloat = false }: { value: number, isFloat?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setCount(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span>{isFloat ? count.toFixed(2) : Math.round(count)}</span>;
}

export default function Report() {
  const [, setLocation] = useLocation();

  const [featBeforeSelected, setFeatBeforeSelected] = useState<string | null>(null);
  const [featAfterSelected, setFeatAfterSelected] = useState<string | null>(null);

  const approvalData = [
    { name: "Male", Before: 78, After: 72 },
    { name: "Female", Before: 51, After: 65 },
  ];

  const featureDataBefore = [
    { name: "Gender", importance: 32, fill: "hsl(var(--destructive))" },
    { name: "Income", importance: 24, fill: "hsl(var(--muted-foreground))" },
    { name: "Credit Score", importance: 18, fill: "hsl(var(--muted-foreground))" },
    { name: "Employment", importance: 12, fill: "hsl(var(--muted-foreground))" },
    { name: "Dependents", importance: 8, fill: "hsl(var(--muted-foreground))" },
    { name: "Age", importance: 6, fill: "hsl(var(--destructive))" },
  ];

  const featureDataAfter = [
    { name: "Credit Score", importance: 28, fill: "hsl(var(--primary))" },
    { name: "Income", importance: 24, fill: "hsl(var(--primary))" },
    { name: "Employment", importance: 20, fill: "hsl(var(--primary))" },
    { name: "Dependents", importance: 14, fill: "hsl(var(--primary))" },
    { name: "Age", importance: 9, fill: "hsl(var(--amber-500))" },
    { name: "Gender", importance: 5, fill: "hsl(var(--green-500))" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-6 w-6 text-green-500" />
            <h1 className="text-3xl font-bold tracking-tight">Before vs After Debiasing Report</h1>
          </div>
          <p className="text-muted-foreground">Comprehensive audit of model fairness improvements.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => setLocation("/")} className="flex-1 md:flex-none">
            Back to Dashboard
          </Button>
          <Button className="gap-2 flex-1 md:flex-none">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          <Tabs defaultValue="after" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="before">Before Debiasing</TabsTrigger>
                <TabsTrigger value="after">After Debiasing</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="before" className="mt-0 outline-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard title="Fairness Score" val={61} status="red" />
                <MetricCard title="Bias Rate" val={43} isPercent status="red" />
                <MetricCard title="Demographic Parity Diff." val={0.24} isFloat status="red" />
                <MetricCard title="Equal Opportunity Diff." val={0.27} isFloat status="red" />
                <MetricCard title="Disparate Impact Ratio" val={0.65} isFloat status="red" subLabel="Fails 80% rule" />
                <MetricCard title="Compliance Score" val={38} status="red" subLabel="High Risk" />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="after" className="mt-0 outline-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard title="Fairness Score" val={87} status="green" />
                <MetricCard title="Bias Rate" val={19} isPercent status="amber" />
                <MetricCard title="Demographic Parity Diff." val={0.09} isFloat status="green" subLabel="Fair" />
                <MetricCard title="Equal Opportunity Diff." val={0.11} isFloat status="amber" subLabel="Slight Bias" />
                <MetricCard title="Disparate Impact Ratio" val={0.82} isFloat status="green" subLabel="Pass — 80% rule" />
                <MetricCard title="Compliance Score" val={80} status="green" subLabel="Compliant" />
              </motion.div>
            </TabsContent>
          </Tabs>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Approval Rate by Gender</CardTitle>
                <CardDescription>Comparison of approval outcomes</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={approvalData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="Before" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="After" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex justify-between items-center">
                  <span>Accuracy Tradeoff</span>
                  <Badge variant="outline" className="font-normal text-muted-foreground">minor accuracy tradeoff</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-[280px] flex-col gap-6">
                <div className="flex items-center gap-8 w-full justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider">Before</p>
                    <p className="text-5xl font-bold text-foreground opacity-50">84%</p>
                  </div>
                  <ArrowRight className="h-8 w-8 text-muted-foreground/30" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider">After</p>
                    <p className="text-5xl font-bold text-primary">82%</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-[250px]">
                  A 2% drop in raw accuracy allowed for a 26-point increase in Fairness Score.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Bias Drivers (Feature Importance)</CardTitle>
              <CardDescription>How the model makes decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="h-[280px]">
                    <ChartAnalyzer 
                      title="Before (Importance)" 
                      data={featureDataBefore} 
                      dataKey="importance"
                      selectedBar={featBeforeSelected}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={featureDataBefore} margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                          <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                          <Bar 
                            dataKey="importance" 
                            radius={[0, 4, 4, 0]}
                            onClick={(data) => setFeatBeforeSelected(data.name)}
                            className="cursor-pointer"
                          >
                            {featureDataBefore.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.fill} 
                                opacity={featBeforeSelected && featBeforeSelected !== entry.name ? 0.3 : 1}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartAnalyzer>
                  </div>
                </div>
                <div>
                  <div className="h-[280px]">
                    <ChartAnalyzer 
                      title="After (Importance)" 
                      data={featureDataAfter} 
                      dataKey="importance"
                      selectedBar={featAfterSelected}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={featureDataAfter} margin={{ top: 0, right: 10, left: 30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                          <RechartsTooltip cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                          <Bar 
                            dataKey="importance" 
                            radius={[0, 4, 4, 0]}
                            onClick={(data) => setFeatAfterSelected(data.name)}
                            className="cursor-pointer"
                          >
                            {featureDataAfter.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.fill} 
                                opacity={featAfterSelected && featAfterSelected !== entry.name ? 0.3 : 1}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartAnalyzer>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col items-center text-center">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 mb-2 text-sm font-normal py-1">
                  Reduced reliance on protected attributes
                </Badge>
                <p className="text-xs text-muted-foreground">Indirect correlations may still exist, but explicit bias is mitigated.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-green-500/20 bg-green-500/5 shadow-sm">
            <CardHeader className="pb-3 border-b border-green-500/10">
              <CardTitle className="text-base text-green-700 dark:text-green-400">Debiasing Applied</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-sm font-medium text-foreground">Reduced reliance on protected attributes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-sm font-medium text-foreground">Reweighted training data</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-sm font-medium text-foreground">Balanced dataset distribution</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Next Steps</h4>
              <p className="text-sm text-foreground mb-4">Deploy this optimized model to production to ensure fair lending practices.</p>
              <Button className="w-full">Deploy Model</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, val, status, subLabel, isPercent = false, isFloat = false }: { title: string, val: number, status: 'red' | 'amber' | 'green', subLabel?: string, isPercent?: boolean, isFloat?: boolean }) {
  const statusColors = {
    red: "text-destructive bg-destructive/10 border-destructive/20",
    amber: "text-amber-600 dark:text-amber-500 bg-amber-500/10 border-amber-500/20",
    green: "text-green-600 dark:text-green-500 bg-green-500/10 border-green-500/20",
  };
  const statusTextColors = {
    red: "text-destructive",
    amber: "text-amber-600 dark:text-amber-500",
    green: "text-green-600 dark:text-green-500",
  };

  return (
    <Card className="shadow-sm border-0 bg-card/50">
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground mb-2 line-clamp-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold ${statusTextColors[status]}`}>
            <AnimatedNumber value={val} isFloat={isFloat} />
          </span>
          {isPercent && <span className={`font-semibold ${statusTextColors[status]}`}>%</span>}
        </div>
        {subLabel && (
          <div className="mt-2">
            <Badge variant="outline" className={`font-normal text-xs py-0 ${statusColors[status]}`}>
              {subLabel}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}