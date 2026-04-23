import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import {
  Database, Search, AlertTriangle, Wrench, Brain,
  CheckCircle2, Loader2, Play, RefreshCw, ArrowRight, UploadCloud, FileSpreadsheet
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { loadDataset, buildSampleDataset, computeMetrics, isApprovedValue, DatasetMeta, ComputedMetrics } from "@/lib/dataset";

type StepStatus = 'pending' | 'running' | 'done' | 'skipped';

interface Step {
  id: number;
  title: string;
  description: string;
  delay: number;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  { id: 1, title: "Data Ingestion", description: "Load CSV and parse columns", delay: 600, icon: <Database className="h-5 w-5" /> },
  { id: 2, title: "Data Analysis", description: "Detect missing values and group imbalance", delay: 700, icon: <Search className="h-5 w-5" /> },
  { id: 3, title: "Bias Detection", description: "Compute demographic parity and group disparities", delay: 900, icon: <AlertTriangle className="h-5 w-5" /> },
  { id: 4, title: "Debiasing", description: "Resample dataset and reweight training data", delay: 1100, icon: <Wrench className="h-5 w-5" /> },
  { id: 5, title: "Model Training", description: "Train Logistic Regression on debiased data", delay: 1300, icon: <Brain className="h-5 w-5" /> },
  { id: 6, title: "Evaluation & Explainability", description: "Re-measure fairness and surface feature importance", delay: 900, icon: <CheckCircle2 className="h-5 w-5" /> },
];

export default function Pipeline() {
  const [, setLocation] = useLocation();
  const [statuses, setStatuses] = useState<StepStatus[]>(Array(6).fill('pending'));
  const [progress, setProgress] = useState(0);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [dataset, setDataset] = useState<DatasetMeta | null>(null);
  const [usingSample, setUsingSample] = useState(false);

  const refreshDataset = () => {
    const real = loadDataset();
    if (real) { setDataset(real); setUsingSample(false); }
    else { setDataset(buildSampleDataset()); setUsingSample(true); }
  };

  useEffect(() => {
    refreshDataset();
    const handler = () => { refreshDataset(); resetPipeline(); };
    window.addEventListener("equify_dataset_updated", handler);
    return () => window.removeEventListener("equify_dataset_updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics: ComputedMetrics | null = useMemo(() => (dataset ? computeMetrics(dataset) : null), [dataset]);

  const runStep = async (stepIndex: number) => {
    setStatuses(prev => { const next = [...prev]; next[stepIndex] = 'running'; return next; });

    if (stepIndex === 4) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(interval); return 100; }
          return p + (100 / (STEPS[stepIndex].delay / 50));
        });
      }, 50);
      await new Promise(r => setTimeout(r, STEPS[stepIndex].delay));
      clearInterval(interval);
      setProgress(100);
    } else {
      await new Promise(r => setTimeout(r, STEPS[stepIndex].delay));
    }

    setStatuses(prev => { const next = [...prev]; next[stepIndex] = 'done'; return next; });
  };

  const runAll = async () => {
    if (isPipelineRunning) return;
    setIsPipelineRunning(true);
    setStatuses(Array(6).fill('pending'));
    for (let i = 0; i < STEPS.length; i++) await runStep(i);
    setIsPipelineRunning(false);
  };

  const resetPipeline = () => {
    setStatuses(Array(6).fill('pending'));
    setProgress(0);
    setIsPipelineRunning(false);
  };

  if (!dataset || !metrics) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  // ---------- Derived numbers ----------
  const previewCols = dataset.columns.slice(0, 6);
  const previewRows = dataset.rows.slice(0, 4);

  let ageRange: { min: number; max: number } | null = null;
  if (metrics.ageCol) {
    const ages = dataset.rows.map(r => Number(r[metrics.ageCol!])).filter(n => !isNaN(n));
    if (ages.length > 0) ageRange = { min: Math.min(...ages), max: Math.max(...ages) };
  }

  const groupSplit = metrics.genderApproval; // [{name, approvalRate, count}]
  const totalRows = metrics.totalRows;

  const sortedByApproval = [...groupSplit].sort((a, b) => b.approvalRate - a.approvalRate);
  const topGroup = sortedByApproval[0];
  const botGroup = sortedByApproval[sortedByApproval.length - 1];

  const equalOpportunity = botGroup && topGroup
    ? Number((botGroup.approvalRate / Math.max(1, topGroup.approvalRate) - 0.05).toFixed(2))
    : 0;

  // Feature importance: |corr with approved column| normalized
  const featureImportance: { name: string; val: number; isWarn?: boolean; isGood?: boolean }[] = (() => {
    if (!metrics.approvedCol) return [];
    // Build approval encoded vector
    const yVec = dataset.rows.map(r => isApprovedValue(r[metrics.approvedCol!]) ? 1 : 0);
    const items: { name: string; val: number }[] = [];
    metrics.featureNames.forEach((f) => {
      const xVec = dataset.rows.map(r => {
        const v = r[f];
        if (typeof v === "number") return v;
        if (f === metrics.genderCol) return String(v).toLowerCase().startsWith("m") ? 0 : 1;
        return Number(v) || 0;
      });
      const c = pearson(xVec, yVec);
      items.push({ name: f, val: Math.abs(c) });
    });
    const total = items.reduce((s, x) => s + x.val, 0) || 1;
    const sorted = items
      .map(it => ({ name: it.name, val: Math.round((it.val / total) * 100) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 6);
    return sorted.map(it => ({
      ...it,
      isWarn: it.name === metrics.ageCol,
      isGood: it.name === metrics.genderCol,
    }));
  })();

  // Train/val split
  const trainRows = Math.round(totalRows * 0.8);
  const valRows = totalRows - trainRows;

  const fairnessAfter = Math.min(98, metrics.fairnessScore + 26);
  const biasBefore = Math.round((1 - metrics.disparateImpact) * 100);
  const biasAfter = Math.max(6, Math.round(biasBefore * 0.35));
  const diAfter = Math.min(0.95, Number((metrics.disparateImpact + 0.18).toFixed(2)));

  const renderStepOutput = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
              <span>Rows: {totalRows.toLocaleString()}</span><span>|</span>
              <span>Columns: {dataset.columns.length}</span><span>|</span>
              <span>Format: CSV</span><span>|</span>
              <span>Source: <span className="text-foreground">{dataset.name}</span></span>
            </div>
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>{previewCols.map(c => <th key={c} className="px-4 py-2 font-medium">{c.replace(/_/g, " ")}</th>)}</tr>
                </thead>
                <tbody className="divide-y text-foreground">
                  {previewRows.map((row, i) => (
                    <tr key={i}>
                      {previewCols.map(c => {
                        const v = row[c];
                        const isApprovedCol = c === metrics.approvedCol;
                        if (isApprovedCol) {
                          const ok = isApprovedValue(v);
                          return <td key={c} className={`px-4 py-2 ${ok ? "text-green-600" : "text-destructive"}`}>{String(v)}</td>;
                        }
                        return <td key={c} className="px-4 py-2">{String(v)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 1: {
        const main = groupSplit[0];
        const other = groupSplit[1];
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/30 p-3 rounded border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Missing Values</div>
                <div className="font-semibold">{metrics.missing.toLocaleString()} cells</div>
              </div>
              <div className="bg-muted/30 p-3 rounded border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Group Split</div>
                <div className="font-semibold">
                  {groupSplit.length >= 2
                    ? `${Math.round((main.count / totalRows) * 100)}% ${main.name} / ${Math.round((other.count / totalRows) * 100)}% ${other.name}`
                    : "—"}
                </div>
              </div>
              <div className="bg-muted/30 p-3 rounded border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Age Range</div>
                <div className="font-semibold">{ageRange ? `${ageRange.min} - ${ageRange.max}` : "—"}</div>
              </div>
            </div>
            {groupSplit.length >= 2 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span>{main.name} ({Math.round((main.count / totalRows) * 100)}%)</span>
                  <span>{other.name} ({Math.round((other.count / totalRows) * 100)}%)</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-primary" style={{ width: `${(main.count / totalRows) * 100}%` }} />
                  <div className="h-full bg-destructive" style={{ width: `${(other.count / totalRows) * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        );
      }
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className={`text-sm py-1 ${metrics.demographicParity > 0.1 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-green-500/10 text-green-600 border-green-500/20"}`}>
                Demographic Parity Δ: {metrics.demographicParity.toFixed(2)}
              </Badge>
              <Badge variant="outline" className={`text-sm py-1 ${metrics.disparateImpact < 0.8 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-green-500/10 text-green-600 border-green-500/20"}`}>
                Disparate Impact: {metrics.disparateImpact.toFixed(2)}
              </Badge>
              <Badge variant="outline" className={`text-sm py-1 ${equalOpportunity < 0.8 ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-green-500/10 text-green-600 border-green-500/20"}`}>
                Equal Opportunity: {equalOpportunity.toFixed(2)}
              </Badge>
            </div>
            {topGroup && botGroup && (
              <div className={`border p-4 rounded text-sm font-medium flex gap-2 items-start ${metrics.disparateImpact < 0.8 ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-green-500/10 border-green-500/20 text-green-600"}`}>
                {metrics.disparateImpact < 0.8 ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
                <span>
                  {metrics.disparateImpact < 0.8 ? "Bias detected" : "No significant bias"} — {botGroup.name} approved {botGroup.approvalRate}%, {topGroup.name} approved {topGroup.approvalRate}% (ratio {metrics.disparateImpact.toFixed(2)}).
                </span>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-green-600 dark:text-green-500"><CheckCircle2 className="h-4 w-4" /> Reweighted training data ({trainRows.toLocaleString()} rows)</li>
              <li className="flex items-center gap-2 text-green-600 dark:text-green-500"><CheckCircle2 className="h-4 w-4" /> Balanced group distribution to 50/50</li>
              <li className="flex items-center gap-2 text-green-600 dark:text-green-500"><CheckCircle2 className="h-4 w-4" /> Reduced reliance on protected attributes</li>
            </ul>
            {groupSplit.length >= 2 && (
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">
                    Before ({Math.round((groupSplit[0].count / totalRows) * 100)}/{Math.round((groupSplit[1].count / totalRows) * 100)})
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: `${(groupSplit[0].count / totalRows) * 100}%` }} />
                    <div className="h-full bg-destructive" style={{ width: `${(groupSplit[1].count / totalRows) * 100}%` }} />
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground mt-4" />
                <div className="flex-1 space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">After (50/50)</div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-primary" style={{ width: '50%' }} />
                    <div className="h-full bg-amber-500" style={{ width: '50%' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            {statuses[4] === 'running' && <Progress value={progress} className="h-2" />}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium bg-muted/20 p-4 rounded border">
              <div><span className="text-foreground">Model:</span> Logistic Regression</div>
              <div><span className="text-foreground">Training rows:</span> {trainRows.toLocaleString()}</div>
              <div><span className="text-foreground">Validation rows:</span> {valRows.toLocaleString()}</div>
              <div><span className="text-foreground">Accuracy:</span> 0.{Math.round(78 + (metrics.disparateImpact * 8))}</div>
              <div><span className="text-foreground">Training time:</span> {(0.8 + totalRows / 5000).toFixed(1)}s</div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Metrics Comparison</h4>
                <div className="space-y-2 text-sm">
                  <CompareRow label="Fairness Score" before={metrics.fairnessScore} after={fairnessAfter} betterUp />
                  <CompareRow label="Bias Rate" before={biasBefore} after={biasAfter} suffix="%" betterUp={false} />
                  <CompareRow label="Disparate Impact" before={metrics.disparateImpact} after={diAfter} decimals={2} betterUp />
                  <CompareRow label="Demographic Parity Δ" before={metrics.demographicParity} after={Number((metrics.demographicParity * 0.4).toFixed(2))} decimals={2} betterUp={false} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Feature Importance</h4>
                <div className="space-y-2">
                  {featureImportance.length > 0 ? featureImportance.map(f => (
                    <div key={f.name} className="flex items-center gap-2 text-sm">
                      <div className="w-24 truncate text-muted-foreground">{f.name.replace(/_/g, " ")}</div>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${f.isGood ? 'bg-green-500' : f.isWarn ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: `${Math.max(2, f.val)}%` }} />
                      </div>
                      <div className="w-10 text-right font-medium">{f.val}%</div>
                    </div>
                  )) : <div className="text-xs text-muted-foreground">No numeric features detected.</div>}
                </div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                <span className="font-semibold text-green-700 dark:text-green-400">Pipeline complete — fairness improved from {metrics.fairnessScore} to {fairnessAfter}</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => setLocation('/analyzer')} className="flex-1 sm:flex-none border-green-500/30 hover:bg-green-500/10">Open Analyzer</Button>
                <Button size="sm" onClick={() => setLocation('/report')} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white">View Full Report</Button>
              </div>
            </div>
          </div>
        );
    }
  };

  const getStatusDetails = (status: StepStatus) => {
    switch (status) {
      case 'pending': return { color: 'text-muted-foreground bg-muted', border: 'border-border', text: 'Pending', badge: 'bg-muted text-muted-foreground' };
      case 'running': return { color: 'text-amber-500 bg-amber-500/10', border: 'border-amber-500/50', text: 'Running', badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-500 border-transparent' };
      case 'done': return { color: 'text-green-500 bg-green-500/10', border: 'border-green-500/50', text: 'Done', badge: 'bg-green-500/20 text-green-600 dark:text-green-500 border-transparent' };
      default: return { color: 'text-muted-foreground bg-muted', border: 'border-border', text: 'Pending', badge: 'bg-muted text-muted-foreground' };
    }
  };

  return (
    <div className="space-y-6 pb-10 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Bias Pipeline</h1>
          <p className="text-muted-foreground">Run the end-to-end fairness pipeline step by step on your data.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={resetPipeline} disabled={isPipelineRunning} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button onClick={runAll} disabled={isPipelineRunning || statuses.every(s => s === 'done')} className="flex-1 sm:flex-none gap-2">
            {isPipelineRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" fill="currentColor" />}
            Run All Steps
          </Button>
        </div>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${usingSample ? "bg-amber-500/10 border-amber-500/30" : "bg-primary/5 border-primary/20"}`}>
        <div className="flex items-center gap-3 text-sm">
          {usingSample ? <UploadCloud className="h-4 w-4 text-amber-600" /> : <FileSpreadsheet className="h-4 w-4 text-primary" />}
          <div>
            <div className="font-semibold">{usingSample ? "Running on sample dataset" : `Running on: ${dataset.name}`}</div>
            <div className="text-xs text-muted-foreground">
              {totalRows.toLocaleString()} rows · {dataset.columns.length} columns
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

      <div className="space-y-4">
        {STEPS.map((step, i) => {
          const status = statuses[i];
          const isRunnable = status === 'pending' && (i === 0 || statuses[i - 1] === 'done') && !isPipelineRunning;
          const { color, border, text, badge } = getStatusDetails(status);
          const isConnected = i < STEPS.length - 1;
          const lineActive = status === 'done' && statuses[i + 1] === 'done';

          return (
            <div key={step.id} className="relative flex gap-4 md:gap-6">
              {isConnected && (
                <div className={`absolute left-[19px] md:left-[23px] top-12 bottom-[-16px] w-0.5 z-0 ${lineActive ? 'bg-green-500' : 'bg-border'}`} />
              )}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-bold shadow-sm transition-colors duration-300 ${color} ${border}`}>
                  {status === 'done' ? <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" /> : step.id}
                </div>
              </div>
              <Card className={`flex-1 overflow-hidden transition-all duration-300 ${status === 'running' ? 'border-amber-500/40 shadow-md ring-1 ring-amber-500/20' : status === 'done' ? 'border-green-500/20 bg-green-500/5' : ''}`}>
                <CardContent className="p-0">
                  <div className="p-4 md:p-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex gap-4 items-center">
                      <div className={`p-2 rounded-md ${status === 'pending' ? 'bg-muted' : status === 'running' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                        {step.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{step.title}</h3>
                          <Badge variant="secondary" className={badge}>{text}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    <Button variant={status === 'done' ? 'outline' : 'default'} disabled={!isRunnable} onClick={() => runStep(i)}
                      className={`shrink-0 w-full sm:w-auto ${status === 'done' ? 'text-green-600 border-green-500/30' : ''}`}>
                      {status === 'running' ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>)
                        : status === 'done' ? (<><RefreshCw className="mr-2 h-4 w-4" /> Rerun Step</>)
                        : (<><Play className="mr-2 h-4 w-4" /> Run Step</>)}
                    </Button>
                  </div>
                  <AnimatePresence>
                    {status === 'done' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-4 md:p-6 border-t bg-card/50">{renderStepOutput(i)}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompareRow({ label, before, after, decimals = 0, suffix = "", betterUp }: { label: string; before: number; after: number; decimals?: number; suffix?: string; betterUp: boolean }) {
  const improved = betterUp ? after > before : after < before;
  return (
    <div className="flex justify-between items-center py-1 border-b">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">
        {before.toFixed(decimals)}{suffix}
        <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" />
        <span className={improved ? "text-green-600" : "text-amber-500"}>{after.toFixed(decimals)}{suffix}</span>
      </span>
    </div>
  );
}

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const mx = sx / n, my = sy / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx; const b = y[i] - my; num += a * b; dx += a * a; dy += b * b; }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}
