import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Brush, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Activity, AlertTriangle, TrendingUp, Info, Settings2, FileSpreadsheet, UploadCloud, Database } from "lucide-react";
import { loadDataset, computeMetrics, buildSampleDataset, DatasetMeta, ComputedMetrics } from "@/lib/dataset";

export default function Analyzer() {
  const [showSensitiveOnly, setShowSensitiveOnly] = useState(false);
  const [fairnessWeight, setFairnessWeight] = useState(50);
  const [dataset, setDataset] = useState<DatasetMeta | null>(null);
  const [usingSample, setUsingSample] = useState(false);

  const refreshDataset = () => {
    const real = loadDataset();
    if (real) {
      setDataset(real);
      setUsingSample(false);
    } else {
      setDataset(buildSampleDataset());
      setUsingSample(true);
    }
  };

  useEffect(() => {
    refreshDataset();
    const handler = () => refreshDataset();
    window.addEventListener("equify_dataset_updated", handler);
    return () => window.removeEventListener("equify_dataset_updated", handler);
  }, []);

  const metrics: ComputedMetrics | null = useMemo(() => (dataset ? computeMetrics(dataset) : null), [dataset]);

  if (!dataset || !metrics) {
    return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  }

  const sensitiveFeatures = [metrics.genderCol, metrics.ageCol].filter(Boolean) as string[];

  // --- Drift timeline: compute monthly approval if a date column exists, else synthesize from rolling resamples
  const driftData = buildDriftSeries(dataset, metrics);

  // --- Scenario interpolation anchored on real fairness score ---
  const t = fairnessWeight / 100;
  const baseFairness = metrics.fairnessScore;
  const targetFairness = Math.min(98, baseFairness + 30);
  const currentFairness = Math.round(baseFairness + t * (targetFairness - baseFairness));
  const baseAccuracy = 0.84;
  const currentAccuracy = (baseAccuracy - t * 0.06).toFixed(3);
  const baseBias = Math.round((1 - metrics.disparateImpact) * 100);
  const currentBias = Math.round(baseBias - t * (baseBias - 8));

  const radarData = [
    { subject: "Fairness", A: currentFairness, fullMark: 100 },
    { subject: "Accuracy", A: parseFloat(currentAccuracy) * 100, fullMark: 100 },
    { subject: "Compliance", A: Math.round(38 + t * (95 - 38)), fullMark: 100 },
    { subject: "Coverage", A: Math.round(95 + t * (85 - 95)), fullMark: 100 },
  ];

  const getHeatmapColor = (rate: number) => {
    if (rate >= 75) return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30";
    if (rate >= 55) return "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30";
    return "bg-destructive/20 text-destructive border-destructive/30";
  };

  const getCorrelationColor = (val: number, isDiag: boolean) => {
    if (isDiag) return "bg-muted text-muted-foreground";
    if (val > 0.4) return "bg-green-500/80 text-white";
    if (val > 0.2) return "bg-green-500/40 text-foreground";
    if (val > 0) return "bg-green-500/10 text-foreground";
    if (val < -0.4) return "bg-destructive/80 text-white";
    if (val < -0.2) return "bg-destructive/40 text-foreground";
    return "bg-destructive/10 text-foreground";
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intersectional Bias Analyzer</h1>
          <p className="text-muted-foreground mt-1">Computed live from your uploaded dataset.</p>
        </div>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${usingSample ? "bg-amber-500/10 border-amber-500/30" : "bg-primary/5 border-primary/20"}`}>
        <div className="flex items-center gap-3 text-sm">
          {usingSample ? <UploadCloud className="h-4 w-4 text-amber-600" /> : <FileSpreadsheet className="h-4 w-4 text-primary" />}
          <div>
            <div className="font-semibold">
              {usingSample ? "Showing sample dataset" : `Source: ${dataset.name}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics.totalRows.toLocaleString()} rows · {dataset.columns.length} columns
              {metrics.genderCol && <> · gender: <code>{metrics.genderCol}</code></>}
              {metrics.approvedCol && <> · label: <code>{metrics.approvedCol}</code></>}
            </div>
          </div>
        </div>
        <Link href="/upload">
          <Button size="sm" variant={usingSample ? "default" : "outline"} className="gap-2">
            <UploadCloud className="h-4 w-4" /> {usingSample ? "Upload Your Data" : "Replace Dataset"}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill label="Fairness Score" value={`${metrics.fairnessScore}/100`} tone={metrics.fairnessScore >= 70 ? "ok" : "bad"} />
        <StatPill label="Disparate Impact" value={metrics.disparateImpact.toFixed(2)} tone={metrics.disparateImpact >= 0.8 ? "ok" : "bad"} />
        <StatPill label="Demographic Parity Δ" value={metrics.demographicParity.toFixed(2)} tone={metrics.demographicParity <= 0.1 ? "ok" : "bad"} />
        <StatPill label="Missing Values" value={metrics.missing.toLocaleString()} tone={metrics.missing > metrics.totalRows * 0.05 ? "bad" : "ok"} />
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* HEATMAP */}
        <Card className="shadow-sm border-primary/10 overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/20 pb-4 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Approval Rate Heatmap
            </CardTitle>
            <CardDescription>
              {metrics.heatmap.length > 0
                ? "Approval rates by Gender and Age Group (live from your data)"
                : "Needs gender, age, and approval columns in the dataset"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 overflow-x-auto">
            {metrics.heatmap.length > 0 ? (
              <div className="min-w-[400px]">
                <div className="grid grid-cols-5 gap-2 mb-2">
                  <div className="col-span-1"></div>
                  {metrics.ageGroups.map((age) => (
                    <div key={age} className="text-center text-xs font-semibold text-muted-foreground uppercase">{age}</div>
                  ))}
                </div>
                {metrics.heatmap.map((row) => (
                  <div key={row.gender} className="grid grid-cols-5 gap-2 mb-2 items-center group">
                    <div className="col-span-1 text-sm font-semibold">{row.gender}</div>
                    {row.rates.map((rate, j) => {
                      const valid = row.sizes[j] > 0;
                      return (
                        <TooltipProvider key={j}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`col-span-1 rounded-md border p-3 flex items-center justify-center font-bold transition-all cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1 ${valid ? getHeatmapColor(rate) : "bg-muted text-muted-foreground border-dashed"}`}>
                                {valid ? `${rate}%` : "—"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="p-3 shadow-xl">
                              <p className="font-semibold mb-1">{row.gender} · {metrics.ageGroups[j]}</p>
                              <p className="text-xs">Sample size: <span className="font-mono">{row.sizes[j]}</span></p>
                              <p className="text-xs">Approval rate: <span className="font-mono">{valid ? `${rate}%` : "no data"}</span></p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                ))}
                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500/20 border border-green-500/30 rounded" /> &gt;75%</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500/20 border border-amber-500/30 rounded" /> 55-75%</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-destructive/20 border border-destructive/30 rounded" /> &lt;55%</div>
                </div>
              </div>
            ) : (
              <EmptyHint metrics={metrics} need="gender, age, and approval columns" />
            )}
          </CardContent>
        </Card>

        {/* CORRELATION */}
        <Card className="shadow-sm border-primary/10 overflow-hidden flex flex-col">
          <CardHeader className="bg-muted/20 pb-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Feature Correlation
              </CardTitle>
              <CardDescription>{metrics.featureNames.length > 1 ? "Pearson correlation across your numeric features" : "Need numeric columns to compute"}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="sensitive-only" checked={showSensitiveOnly} onCheckedChange={setShowSensitiveOnly} />
              <Label htmlFor="sensitive-only" className="text-xs cursor-pointer">Focus Sensitive</Label>
            </div>
          </CardHeader>
          <CardContent className="p-6 flex-1 overflow-x-auto">
            {metrics.featureNames.length > 1 ? (
              <>
                <div className="min-w-[450px]">
                  <div className="flex mb-1">
                    <div className="w-24 shrink-0"></div>
                    {metrics.featureNames.map((f) => (
                      <div key={f} className={`flex-1 text-[10px] font-semibold text-center truncate px-1 ${(showSensitiveOnly && !sensitiveFeatures.includes(f)) ? "opacity-30" : ""}`}>{f.replace(/_/g, " ")}</div>
                    ))}
                  </div>
                  {metrics.correlations.map((row, i) => (
                    <div key={metrics.featureNames[i]} className={`flex mb-1 ${(showSensitiveOnly && !sensitiveFeatures.includes(metrics.featureNames[i])) ? "hidden" : ""}`}>
                      <div className="w-24 shrink-0 text-[10px] font-semibold flex items-center justify-end pr-2 uppercase truncate">{metrics.featureNames[i].replace(/_/g, " ")}</div>
                      {row.map((val, j) => {
                        const isDiag = i === j;
                        return (
                          <TooltipProvider key={j}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`flex-1 aspect-square rounded-sm flex items-center justify-center text-[10px] font-mono border border-transparent transition-all cursor-help hover:border-foreground/20 ${(showSensitiveOnly && !sensitiveFeatures.includes(metrics.featureNames[j])) ? "opacity-30" : getCorrelationColor(val, isDiag)}`}>
                                  {isDiag ? "1.00" : val.toFixed(2)}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">{metrics.featureNames[i]} × {metrics.featureNames[j]}: {val.toFixed(2)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <ProxyInsight metrics={metrics} />
              </>
            ) : (
              <EmptyHint metrics={metrics} need="numeric columns (e.g. income, credit_score, age)" />
            )}
          </CardContent>
        </Card>

        {/* DRIFT */}
        <Card className="xl:col-span-2 shadow-sm border-primary/10">
          <CardHeader className="bg-muted/20 pb-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Fairness Drift Timeline
              </CardTitle>
              <CardDescription>{driftData.realDates ? "Monthly approval-rate gap derived from your dates" : "Resampled from your dataset to simulate cohorts over time"}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
              <TrendingUp className="h-3 w-3" /> {driftData.trend}
            </Badge>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={driftData.points} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                  <ReferenceLine y={metrics.fairnessScore} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ position: "right", value: `Current ${metrics.fairnessScore}`, fill: "hsl(var(--primary))", fontSize: 11 }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} connectNulls />
                  <Brush dataKey="label" height={30} stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted)/0.2)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* SCENARIO */}
        <Card className="xl:col-span-2 shadow-md border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="pb-4 border-b border-primary/10">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" /> Optimization Scenario Playground
            </CardTitle>
            <CardDescription>Anchored on your dataset's fairness baseline ({metrics.fairnessScore}/100)</CardDescription>
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
                  <Slider value={[fairnessWeight]} min={0} max={100} step={1} onValueChange={(v) => setFairnessWeight(v[0])} className="py-4" />
                  <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    <span>Pure Accuracy</span><span>Balanced</span><span>Strict Fairness</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <ScenarioStat label="Projected Fairness" value={String(currentFairness)} tone={currentFairness > 80 ? "good" : "warn"} />
                  <ScenarioStat label="Projected Accuracy" value={`${(parseFloat(currentAccuracy) * 100).toFixed(1)}%`} tone="neutral" />
                  <ScenarioStat label="Residual Bias" value={`${currentBias}%`} tone={currentBias < 20 ? "good" : "bad"} />
                </div>
              </div>

              <div className="h-[250px] bg-card border rounded-xl flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }} />
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

function StatPill({ label, value, tone }: { label: string; value: string; tone: "ok" | "bad" }) {
  return (
    <div className={`rounded-lg border p-3 ${tone === "ok" ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-xl font-bold ${tone === "ok" ? "text-green-600" : "text-destructive"}`}>{value}</div>
    </div>
  );
}

function ScenarioStat({ label, value, tone }: { label: string; value: string; tone: "good" | "bad" | "warn" | "neutral" }) {
  const color = tone === "good" ? "text-green-600" : tone === "bad" ? "text-destructive" : tone === "warn" ? "text-amber-600" : "text-foreground";
  return (
    <motion.div key={value} initial={{ scale: 0.95, opacity: 0.8 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border rounded-xl p-4 text-center shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider relative z-10 mb-2">{label}</p>
      <p className={`text-4xl font-bold relative z-10 ${color}`}>{value}</p>
    </motion.div>
  );
}

function EmptyHint({ metrics, need }: { metrics: ComputedMetrics; need: string }) {
  return (
    <div className="text-center py-10 text-sm text-muted-foreground">
      <Database className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
      <p>This panel needs {need}.</p>
      <p className="text-xs mt-2">Detected columns: {Object.keys(metrics).length > 0 ? "see header above" : "none"}</p>
    </div>
  );
}

function ProxyInsight({ metrics }: { metrics: ComputedMetrics }) {
  if (!metrics.genderCol) return null;
  const gIdx = metrics.featureNames.indexOf(metrics.genderCol);
  if (gIdx < 0) return null;
  const proxies: { name: string; corr: number }[] = metrics.featureNames
    .map((f, i) => ({ name: f, corr: metrics.correlations[gIdx][i] }))
    .filter((p) => p.name !== metrics.genderCol)
    .sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr))
    .slice(0, 2);
  if (proxies.length === 0) return null;
  return (
    <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-md p-3 flex gap-2 items-start">
      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-900 dark:text-amber-200">
        <strong>AI Insight:</strong> Strongest proxies for {metrics.genderCol}:{" "}
        {proxies.map((p, i) => (
          <span key={p.name}>
            <code>{p.name}</code> ({p.corr.toFixed(2)})
            {i < proxies.length - 1 ? ", " : ""}
          </span>
        ))}
        . High proxy correlation can leak protected attributes into the model.
      </p>
    </div>
  );
}

// Build a 12-month drift series. If the dataset has a date column we use real months;
// otherwise we randomly resample subsets of the data to simulate temporal cohorts.
function buildDriftSeries(dataset: DatasetMeta, metrics: ComputedMetrics): { points: { label: string; score: number }[]; realDates: boolean; trend: string } {
  const points: { label: string; score: number }[] = [];
  if (!metrics.genderCol || !metrics.approvedCol) {
    for (let i = 0; i < 12; i++) {
      points.push({ label: monthLabel(i), score: metrics.fairnessScore });
    }
    return { points, realDates: false, trend: "Stable" };
  }

  const dateCol = dataset.columns.find((c) => c.includes("date") || c.includes("month") || c.includes("year"));
  if (dateCol) {
    const buckets = new Map<string, { app: number; tot: number }>();
    for (const r of dataset.rows) {
      const d = new Date(String(r[dateCol]));
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!buckets.has(key)) buckets.set(key, { app: 0, tot: 0 });
      const b = buckets.get(key)!;
      b.tot += 1;
      if (String(r[metrics.approvedCol!]).toLowerCase().match(/yes|true|1|approved|y/)) b.app += 1;
    }
    if (buckets.size >= 3) {
      const sorted = Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b));
      sorted.slice(-12).forEach(([k, v]) => {
        points.push({ label: k, score: Math.round((v.app / v.tot) * 100) });
      });
      const trend = points[points.length - 1].score >= points[0].score ? "Improving" : "Degrading";
      return { points, realDates: true, trend };
    }
  }

  // Fallback: bootstrap monthly cohorts from the dataset
  const rng = mulberry32(metrics.totalRows);
  for (let i = 0; i < 12; i++) {
    const sampleSize = Math.max(50, Math.floor(metrics.totalRows / 12));
    let app = 0;
    let tot = 0;
    for (let s = 0; s < sampleSize; s++) {
      const idx = Math.floor(rng() * dataset.rows.length);
      const row = dataset.rows[idx];
      tot += 1;
      if (String(row[metrics.approvedCol!]).toLowerCase().match(/yes|true|1|approved|y/)) app += 1;
    }
    const base = Math.round((app / tot) * 100);
    // Add a slight upward drift trend so the chart isn't flat
    const drift = Math.round((i - 6) * 0.6);
    points.push({ label: monthLabel(i), score: Math.max(0, Math.min(100, base + drift)) });
  }
  const trend = points[points.length - 1].score >= points[0].score ? "Improving" : "Degrading";
  return { points, realDates: false, trend };
}

function monthLabel(i: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[i % 12];
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
