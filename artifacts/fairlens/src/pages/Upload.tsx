import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, FileSpreadsheet, Database, AlertCircle, CheckCircle2, Search, BarChart3, Shield, ShieldAlert, ShieldX, Sparkles, Loader2, ListChecks } from "lucide-react";
import { parseCSV, saveDataset, buildSampleDataset, computeMetrics, DatasetMeta } from "@/lib/dataset";

type FairnessReport = {
  validation: {
    rowCount: number;
    columnCount: number;
    columns: string[];
    missingCells: number;
    invalidRows: number;
    warnings: string[];
  };
  metrics: {
    groups: { group: string; total: number; approved: number; approvalRate: number }[];
    favoredGroup: string | null;
    disadvantagedGroup: string | null;
    selectionRateDifference: number;
    disparateImpactRatio: number;
    statisticalParityDifference: number;
  };
  flags: { biased: boolean; highlyBiased: boolean; failedMetrics: string[] };
  explanation: string;
  verdict: "Fair Model" | "Biased Model";
  suggestions: string[];
};

export default function Upload() {
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<DatasetMeta | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FairnessReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const callBackend = async (csvText: string) => {
    setReport(null);
    setReportError(null);
    try {
      const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
      const res = await fetch(`${base}api/fairness/analyze`, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: csvText,
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Backend returned ${res.status}: ${errBody.slice(0, 200)}`);
      }
      const data: FairnessReport = await res.json();
      setReport(data);
    } catch (e: any) {
      setReportError(e?.message || "Could not reach the fairness backend.");
    }
  };

  const startAnalysis = (meta: DatasetMeta, csvText: string) => {
    setDataset(meta);
    saveDataset(meta);
    setAnalyzing(true);
    setProgress(0);
    setAnalysisComplete(false);
    setReport(null);
    setReportError(null);

    callBackend(csvText);

    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(interval);
        setAnalyzing(false);
        setAnalysisComplete(true);
      }
    }, 60);
  };

  const handleFile = async (selected: File) => {
    setError(null);
    setFile(selected);
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    try {
      const text = await selected.text();
      const { columns, rows } = parseCSV(text);
      if (rows.length === 0) {
        setError("Could not parse any rows from this file.");
        return;
      }
      const meta: DatasetMeta = { name: selected.name, rows, columns, uploadedAt: Date.now() };
      startAnalysis(meta, text);
    } catch (e: any) {
      setError(e?.message || "Failed to read file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
  };
  const useSampleData = () => {
    const sample = buildSampleDataset();
    setFile(new File(["sample"], sample.name, { type: "text/csv" }));
    const csvText = datasetToCSV(sample);
    startAnalysis(sample, csvText);
  };

  const metrics = dataset ? computeMetrics(dataset) : null;
  const previewColumns = dataset ? dataset.columns.slice(0, 8) : [];
  const previewRows = dataset ? dataset.rows.slice(0, 5) : [];

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Dataset</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your historical lending data (CSV format). The Analyzer, Pipeline, and Dashboard will all use this dataset.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!dataset && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}>
            <div
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer
                ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Drag and drop your dataset</h3>
              <p className="text-muted-foreground mb-2">Supports .csv files up to 5,000 rows</p>
              <p className="text-xs text-muted-foreground mb-6">
                Tip: include columns like <code>gender</code>, <code>age</code>, <code>income</code>, <code>credit_score</code>, <code>approved</code> for best results.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button>Select File</Button>
                <span className="text-sm text-muted-foreground">or</span>
                <Button variant="outline" onClick={(e) => { e.stopPropagation(); useSampleData(); }}>
                  Use Sample Loan Dataset
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {dataset && metrics && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    {file?.name || dataset.name}
                  </CardTitle>
                  <CardDescription>
                    {metrics.totalRows.toLocaleString()} rows · {dataset.columns.length} columns
                    {metrics.genderCol && <> · gender column: <code>{metrics.genderCol}</code></>}
                    {metrics.approvedCol && <> · label column: <code>{metrics.approvedCol}</code></>}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setDataset(null); setAnalysisComplete(false); setFile(null); setReport(null); setReportError(null); }}>
                  Change File
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-xs">
                    <tr>{previewColumns.map((c) => <th key={c} className="px-4 py-3">{c.replace(/_/g, " ")}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        {previewColumns.map((c) => <td key={c} className="px-4 py-2">{String(row[c] ?? "")}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-center p-2 text-xs text-muted-foreground bg-muted/20 border-t">
                  Showing 5 of {metrics.totalRows.toLocaleString()} rows
                </div>
              </CardContent>
            </Card>

            {analyzing && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 pb-6 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-primary font-medium">
                    <Database className="h-5 w-5 animate-pulse" /> Analyzing your dataset for bias...
                  </div>
                  <Progress value={progress} className="w-full max-w-md mx-auto h-2" />
                  <p className="text-xs text-muted-foreground font-mono">{progress}% Complete</p>
                </CardContent>
              </Card>
            )}

            {analysisComplete && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                {/* QUICK STATS (always visible, computed client-side) */}
                <Card className="border-amber-500/30 overflow-hidden">
                  <div className="bg-amber-500/10 px-6 py-3 border-b border-amber-500/20 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold text-amber-900 dark:text-amber-200">Dataset Snapshot</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-4 gap-4">
                      <SnapshotCard label="Group Mix">
                        {metrics.genderApproval.length > 0 ? (
                          <div className="font-semibold text-base">
                            {metrics.genderApproval.map((g) => `${g.name} ${Math.round((g.count / metrics.totalRows) * 100)}%`).join(" / ")}
                          </div>
                        ) : <div className="text-sm text-muted-foreground">No gender column</div>}
                      </SnapshotCard>
                      <SnapshotCard label="Approval Rates">
                        {metrics.genderApproval.length > 0 ? (
                          <div className="font-semibold text-base space-y-0.5">
                            {metrics.genderApproval.map((g) => (
                              <div key={g.name} className="flex justify-between gap-2">
                                <span className="text-muted-foreground">{g.name}</span>
                                <span className={g.approvalRate >= 60 ? "text-green-600" : "text-destructive"}>{g.approvalRate}%</span>
                              </div>
                            ))}
                          </div>
                        ) : <div className="text-sm text-muted-foreground">No label column</div>}
                      </SnapshotCard>
                      <SnapshotCard label="Disparate Impact">
                        <div className={`font-semibold text-lg ${metrics.disparateImpact < 0.8 ? "text-destructive" : "text-green-600"}`}>{metrics.disparateImpact.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{metrics.disparateImpact < 0.8 ? "Fails 80% rule" : "Passes 80% rule"}</div>
                      </SnapshotCard>
                      <SnapshotCard label="Data Quality">
                        <div className="font-semibold text-lg">{metrics.missing.toLocaleString()} missing</div>
                        <div className="text-xs text-muted-foreground mt-1">{((metrics.missing / (metrics.totalRows * dataset.columns.length || 1)) * 100).toFixed(2)}% of cells</div>
                      </SnapshotCard>
                    </div>
                  </CardContent>
                </Card>

                {/* BACKEND FAIRNESS REPORT */}
                {!report && !reportError && (
                  <Card>
                    <CardContent className="py-8 flex items-center justify-center gap-3 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" /> Running fairness audit on the backend...
                    </CardContent>
                  </Card>
                )}

                {reportError && (
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="py-6 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-semibold text-destructive mb-1">Fairness backend unavailable</div>
                        <div className="text-muted-foreground">{reportError}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {report && <FairnessReportPanel report={report} />}

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button variant="outline" onClick={() => { setDataset(null); setAnalysisComplete(false); setFile(null); setReport(null); setReportError(null); }}>
                    Upload Another
                  </Button>
                  <Button variant="secondary" size="lg" onClick={() => setLocation("/analyzer")} className="gap-2">
                    <BarChart3 className="h-4 w-4" /> Open Analyzer
                  </Button>
                  <Button size="lg" onClick={() => setLocation("/")} className="gap-2">
                    <Search className="h-4 w-4" /> View Dashboard
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SnapshotCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="text-sm text-muted-foreground mb-1 font-medium">{label}</div>
      {children}
    </div>
  );
}

function FairnessReportPanel({ report }: { report: FairnessReport }) {
  const isFair = report.verdict === "Fair Model";
  const headerTone = isFair
    ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
    : report.flags.highlyBiased
    ? "bg-destructive/10 border-destructive/30 text-destructive"
    : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";

  const VerdictIcon = isFair ? Shield : report.flags.highlyBiased ? ShieldX : ShieldAlert;
  const verdictLabel = isFair ? "Fair Model" : report.flags.highlyBiased ? "Highly Biased Model" : "Biased Model";

  return (
    <Card className="border-2 overflow-hidden shadow-md">
      <div className={`px-6 py-4 border-b flex items-center justify-between ${headerTone}`}>
        <div className="flex items-center gap-3">
          <VerdictIcon className="h-6 w-6" />
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold opacity-80">Backend Verdict</div>
            <div className="text-xl font-bold">{verdictLabel}</div>
          </div>
        </div>
        <div className="text-xs font-mono bg-background/50 px-2 py-1 rounded border">
          /api/fairness/analyze
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Explanation */}
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Why this verdict</div>
          <p className="text-sm leading-relaxed">{report.explanation}</p>
        </div>

        {/* Metrics grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricTile label="Disparate Impact Ratio" value={report.metrics.disparateImpactRatio.toFixed(2)} ok={report.metrics.disparateImpactRatio >= 0.8} hint="80% rule" />
          <MetricTile label="Selection Rate Difference" value={`${(report.metrics.selectionRateDifference * 100).toFixed(1)}%`} ok={report.metrics.selectionRateDifference <= 0.2} hint="Threshold 20%" />
          <MetricTile label="Statistical Parity Δ" value={report.metrics.statisticalParityDifference.toFixed(2)} ok={Math.abs(report.metrics.statisticalParityDifference) <= 0.1} hint="Threshold 0.10" />
          <MetricTile label="Rows Audited" value={report.validation.rowCount.toLocaleString()} ok hint={`${report.validation.missingCells} missing cells`} />
        </div>

        {/* Group breakdown */}
        {report.metrics.groups.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Approval Breakdown by Group</div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Group</th>
                    <th className="text-right px-4 py-2 font-medium">Approved</th>
                    <th className="text-right px-4 py-2 font-medium">Total</th>
                    <th className="text-right px-4 py-2 font-medium">Approval Rate</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.metrics.groups.map((g) => {
                    const isFav = g.group === report.metrics.favoredGroup;
                    const isDis = g.group === report.metrics.disadvantagedGroup;
                    return (
                      <tr key={g.group}>
                        <td className="px-4 py-2 font-medium">{g.group}</td>
                        <td className="px-4 py-2 text-right font-mono">{g.approved.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-mono">{g.total.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-mono">{(g.approvalRate * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2">
                          {isFav && <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">Favored</span>}
                          {isDis && !isFav && <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">Disadvantaged</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Failed checks */}
        {report.flags.failedMetrics.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Failed fairness checks</span>
            </div>
            <ul className="text-sm space-y-1">
              {report.flags.failedMetrics.map((m) => (
                <li key={m} className="text-destructive/90">• {m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {report.validation.warnings.length > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Validation warnings</span>
            </div>
            <ul className="text-sm space-y-1">
              {report.validation.warnings.map((w) => (
                <li key={w} className="text-amber-700 dark:text-amber-400/90">• {w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Recommended actions</div>
          </div>
          <ul className="space-y-2">
            {report.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm bg-muted/40 rounded-md px-3 py-2 border">
                <ListChecks className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricTile({ label, value, ok, hint }: { label: string; value: string; ok: boolean; hint?: string }) {
  return (
    <div className={`rounded-lg border p-3 ${ok ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-2xl font-bold ${ok ? "text-green-600" : "text-destructive"}`}>{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

function datasetToCSV(meta: DatasetMeta): string {
  const lines: string[] = [meta.columns.join(",")];
  for (const row of meta.rows) {
    lines.push(meta.columns.map((c) => String(row[c] ?? "")).join(","));
  }
  return lines.join("\n");
}
