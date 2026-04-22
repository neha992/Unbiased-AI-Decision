import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Brush, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Activity, AlertTriangle, TrendingUp, Info, Settings2 } from "lucide-react";

export default function Analyzer() {
  const [showSensitiveOnly, setShowSensitiveOnly] = useState(false);
  const [fairnessWeight, setFairnessWeight] = useState(50); // 0 = pure accuracy, 100 = pure fairness

  // --- HEATMAP DATA ---
  const heatmapData = [
    { gender: "Male", rates: [62, 81, 84, 79], sizes: [1200, 3400, 2800, 1500] },
    { gender: "Female", rates: [41, 55, 58, 49], sizes: [1100, 3100, 2600, 1400] }
  ];
  const ageGroups = ["18-25", "26-35", "36-50", "51+"];

  // --- TIMELINE DATA ---
  const driftData = [
    { month: "Jan", score: 42 }, { month: "Feb", score: 45 }, { month: "Mar", score: 48 },
    { month: "Apr", score: 51 }, { month: "May", score: 53 }, { month: "Jun", score: 55 },
    { month: "Jul", score: 58 }, { month: "Aug", score: 56 }, { month: "Sep", score: 59 },
    { month: "Oct", score: 61 }, { month: "Nov", score: 60 }, { month: "Dec", score: 61 },
    { month: "Jan (Est)", score: 70, isForecast: true }, { month: "Feb (Est)", score: 78, isForecast: true }, { month: "Mar (Est)", score: 87, isForecast: true }
  ];

  // --- CORRELATION DATA ---
  const features = ["gender", "age", "income", "credit_score", "employment", "dependents"];
  const correlations = [
    [1.00, -0.05,  0.32,  0.08, -0.10,  0.15],
    [-0.05, 1.00,  0.45,  0.12,  0.62,  0.20],
    [0.32,  0.45,  1.00,  0.55,  0.40,  0.10],
    [0.08,  0.12,  0.55,  1.00,  0.25,  0.05],
    [-0.10, 0.62,  0.40,  0.25,  1.00,  0.15],
    [0.15,  0.20,  0.10,  0.05,  0.15,  1.00]
  ];
  const sensitiveFeatures = ["gender", "age"];

  const getHeatmapColor = (rate: number) => {
    if (rate >= 75) return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
    if (rate >= 55) return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30";
    return "bg-destructive/20 text-destructive border-destructive/30";
  };

  const getCorrelationColor = (val: number) => {
    if (val === 1) return "bg-muted text-muted-foreground"; // diagonal
    if (val > 0.4) return "bg-green-500/80 text-white";
    if (val > 0.2) return "bg-green-500/40 text-foreground";
    if (val > 0) return "bg-green-500/10 text-foreground";
    if (val < -0.4) return "bg-destructive/80 text-white";
    if (val < -0.2) return "bg-destructive/40 text-foreground";
    return "bg-destructive/10 text-foreground";
  };

  // --- SCENARIO PLAYGROUND INTERPOLATION ---
  // Endpoints: at 0 (pure accuracy) -> Fairness 61, Accuracy 0.84, Bias 43%
  //            at 100 (pure fairness) -> Fairness 92, Accuracy 0.78, Bias 8%
  const t = fairnessWeight / 100;
  const currentFairness = Math.round(61 + t * (92 - 61));
  const currentAccuracy = (0.84 + t * (0.78 - 0.84)).toFixed(3);
  const currentBias = Math.round(43 + t * (8 - 43));

  const radarData = [
    { subject: "Fairness", A: currentFairness, fullMark: 100 },
    { subject: "Accuracy", A: parseFloat(currentAccuracy) * 100, fullMark: 100 },
    { subject: "Compliance", A: Math.round(38 + t * (95 - 38)), fullMark: 100 },
    { subject: "Coverage", A: Math.round(95 + t * (85 - 95)), fullMark: 100 }
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intersectional Bias Analyzer</h1>
          <p className="text-muted-foreground mt-1">Deep dive into cross-sectional disparities and model drift.</p>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* A. HEATMAP */}
        <Card className="shadow-sm border-primary/10 overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/20 pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Approval Rate Heatmap
            </CardTitle>
            <CardDescription>Approval rates by Gender and Age Group</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 overflow-x-auto">
            <div className="min-w-[400px]">
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="col-span-1"></div>
                {ageGroups.map(age => (
                  <div key={age} className="text-center text-xs font-semibold text-muted-foreground uppercase">{age}</div>
                ))}
              </div>
              {heatmapData.map((row, i) => (
                <div key={row.gender} className="grid grid-cols-5 gap-2 mb-2 items-center group">
                  <div className="col-span-1 text-sm font-semibold">{row.gender}</div>
                  {row.rates.map((rate, j) => {
                    const avg = row.rates.reduce((a,b)=>a+b,0)/row.rates.length;
                    const diff = (rate - avg).toFixed(1);
                    return (
                      <TooltipProvider key={j}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`col-span-1 rounded-md border p-3 flex items-center justify-center font-bold transition-all cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1 ${getHeatmapColor(rate)}`}>
                              {rate}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="p-3 shadow-xl">
                            <p className="font-semibold mb-1">{row.gender} • {ageGroups[j]}</p>
                            <div className="text-xs space-y-1">
                              <p>Sample Size: <span className="font-mono">{row.sizes[j]}</span></p>
                              <p>Deviation from group avg: <span className={`font-mono ${Number(diff) > 0 ? 'text-green-500' : 'text-destructive'}`}>{Number(diff) > 0 ? '+' : ''}{diff}%</span></p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded" /> &gt;75%</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500/20 border border-amber-500/30 rounded" /> 55-75%</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-destructive/20 border border-destructive/30 rounded" /> &lt;55%</div>
            </div>
          </CardContent>
        </Card>

        {/* B. FEATURE CORRELATION GRID */}
        <Card className="shadow-sm border-primary/10 overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/20 pb-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Feature Correlation
              </CardTitle>
              <CardDescription>Identify potential proxy variables</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="sensitive-only" checked={showSensitiveOnly} onCheckedChange={setShowSensitiveOnly} />
              <Label htmlFor="sensitive-only" className="text-xs cursor-pointer">Focus Sensitive</Label>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 overflow-x-auto">
             <div className="min-w-[450px]">
               <div className="flex mb-1">
                 <div className="w-24 shrink-0"></div>
                 {features.map((f, i) => (
                   <div key={f} className={`flex-1 text-[10px] font-semibold text-center truncate px-1 ${(showSensitiveOnly && !sensitiveFeatures.includes(f)) ? 'opacity-30' : ''}`}>
                     {f.replace('_', ' ')}
                   </div>
                 ))}
               </div>
               {correlations.map((row, i) => (
                 <div key={features[i]} className={`flex mb-1 ${(showSensitiveOnly && !sensitiveFeatures.includes(features[i])) ? 'hidden' : ''}`}>
                   <div className="w-24 shrink-0 text-[10px] font-semibold flex items-center justify-end pr-2 uppercase truncate">
                     {features[i].replace('_', ' ')}
                   </div>
                   {row.map((val, j) => (
                     <TooltipProvider key={j}>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div className={`flex-1 aspect-square rounded-sm flex items-center justify-center text-[10px] font-mono border border-transparent transition-all cursor-help hover:border-foreground/20 ${(showSensitiveOnly && !sensitiveFeatures.includes(features[j])) ? 'opacity-30' : getCorrelationColor(val)}`}>
                             {val.toFixed(2)}
                           </div>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p className="text-xs">{features[i]} &times; {features[j]}: {val.toFixed(2)}</p>
                         </TooltipContent>
                       </Tooltip>
                     </TooltipProvider>
                   ))}
                 </div>
               ))}
             </div>
             
             <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-md p-3 flex gap-2 items-start">
               <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
               <p className="text-xs text-amber-900 dark:text-amber-200">
                 <strong>AI Insight:</strong> Income strongly correlates with Gender (0.32) and Employment with Age (0.62) — high proxy bias risk if not mitigated.
               </p>
             </div>
          </CardContent>
        </Card>

        {/* C. DRIFT TIMELINE */}
        <Card className="xl:col-span-2 shadow-sm border-primary/10">
          <CardHeader className="bg-muted/20 pb-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Fairness Drift Timeline
              </CardTitle>
              <CardDescription>Historical performance and forecast</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
              <TrendingUp className="h-3 w-3" /> Improving Slowly
            </Badge>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={driftData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                  <ReferenceLine x="Dec" stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ position: 'top', value: 'Debiasing Applied (Today)', fill: 'hsl(var(--primary))', fontSize: 12 }} />
                  
                  {/* Historical Line */}
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                  
                  <Brush dataKey="month" height={30} stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted)/0.2)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* D. SCENARIO PLAYGROUND */}
        <Card className="xl:col-span-2 shadow-md border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-4 border-b border-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              Optimization Scenario Playground
            </CardTitle>
            <CardDescription>Adjust the trade-off between strict accuracy and fairness constraints</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                 <div className="space-y-4 pt-4">
                   <div className="flex justify-between items-end">
                     <div>
                       <Label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Optimization Target</Label>
                       <p className="text-xs text-muted-foreground mt-1">Move slider to see projected impact</p>
                     </div>
                     <Badge className="bg-primary">{fairnessWeight}% Fairness Weight</Badge>
                   </div>
                   <Slider 
                     value={[fairnessWeight]} 
                     min={0} max={100} step={1} 
                     onValueChange={(v) => setFairnessWeight(v[0])} 
                     className="py-4"
                   />
                   <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                     <span>Pure Accuracy</span>
                     <span>Balanced</span>
                     <span>Strict Fairness</span>
                   </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                    <motion.div 
                      key={currentFairness}
                      initial={{ scale: 0.95, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-card border rounded-xl p-4 text-center shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-primary/5" />
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider relative z-10 mb-2">Projected Fairness</p>
                      <p className={`text-4xl font-bold relative z-10 ${currentFairness > 80 ? 'text-green-600' : 'text-amber-600'}`}>{currentFairness}</p>
                    </motion.div>
                    <motion.div 
                      key={currentAccuracy}
                      initial={{ scale: 0.95, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-card border rounded-xl p-4 text-center shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-primary/5" />
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider relative z-10 mb-2">Projected Accuracy</p>
                      <p className="text-4xl font-bold relative z-10 text-foreground">{(parseFloat(currentAccuracy) * 100).toFixed(1)}%</p>
                    </motion.div>
                    <motion.div 
                      key={currentBias}
                      initial={{ scale: 0.95, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-card border rounded-xl p-4 text-center shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-primary/5" />
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider relative z-10 mb-2">Residual Bias</p>
                      <p className={`text-4xl font-bold relative z-10 ${currentBias < 20 ? 'text-green-600' : 'text-destructive'}`}>{currentBias}%</p>
                    </motion.div>
                 </div>
              </div>

              <div className="h-[250px] bg-card border rounded-xl flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                   <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                     <PolarGrid stroke="hsl(var(--border))" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 600 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                     <Radar name="Metrics" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                   </RadarChart>
                 </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
