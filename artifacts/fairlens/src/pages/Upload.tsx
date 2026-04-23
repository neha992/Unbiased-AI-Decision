import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, FileSpreadsheet, Database, AlertCircle, CheckCircle2, Search, BarChart3 } from "lucide-react";
import { parseCSV, saveDataset, buildSampleDataset, computeMetrics, DatasetMeta } from "@/lib/dataset";

export default function Upload() {
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dataset, setDataset] = useState<DatasetMeta | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = (meta: DatasetMeta) => {
    setDataset(meta);
    saveDataset(meta);
    setAnalyzing(true);
    setProgress(0);
    setAnalysisComplete(false);

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
      startAnalysis(meta);
    } catch (e: any) {
      setError(e?.message || "Failed to read file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };
  const useSampleData = () => {
    const sample = buildSampleDataset();
    setFile(new File(["sample"], sample.name, { type: "text/csv" }));
    startAnalysis(sample);
  };

  const metrics = dataset ? computeMetrics(dataset) : null;
  const previewColumns = dataset ? dataset.columns.slice(0, 8) : [];
  const previewRows = dataset ? dataset.rows.slice(0, 5) : [];

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Dataset</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your historical lending data (CSV format). The Analyzer, Dashboard, and Pipeline will use this dataset for every metric.
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
                <Button variant="ghost" size="sm" onClick={() => { setDataset(null); setAnalysisComplete(false); setFile(null); }}>
                  Change File
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-xs">
                    <tr>
                      {previewColumns.map((c) => (
                        <th key={c} className="px-4 py-3">{c.replace(/_/g, " ")}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewRows.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        {previewColumns.map((c) => (
                          <td key={c} className="px-4 py-2">
                            {String(row[c] ?? "")}
                          </td>
                        ))}
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
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="border-amber-500/30 overflow-hidden">
                  <div className="bg-amber-500/10 px-6 py-3 border-b border-amber-500/20 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold text-amber-900 dark:text-amber-200">Analysis Complete</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1 font-medium">Group Distribution</div>
                        {metrics.genderApproval.length > 0 ? (
                          <div className="font-semibold text-lg">
                            {metrics.genderApproval
                              .map((g) => `${g.name} ${Math.round((g.count / metrics.totalRows) * 100)}%`)
                              .join(" / ")}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No gender column detected</div>
                        )}
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1 font-medium">Disparate Impact</div>
                        <div className={`font-semibold text-lg ${metrics.disparateImpact < 0.8 ? "text-destructive" : "text-green-600"}`}>
                          {metrics.disparateImpact.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {metrics.disparateImpact < 0.8 ? "Fails the 80% rule" : "Passes the 80% rule"}
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1 font-medium">Data Quality</div>
                        <div className="font-semibold text-lg">{metrics.missing} missing values</div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">{((metrics.missing / (metrics.totalRows * dataset.columns.length || 1)) * 100).toFixed(2)}% of cells</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <Button variant="outline" onClick={() => { setDataset(null); setAnalysisComplete(false); setFile(null); }}>
                        Upload Another
                      </Button>
                      <Button variant="secondary" size="lg" onClick={() => setLocation("/analyzer")} className="gap-2">
                        <BarChart3 className="h-4 w-4" /> Open Analyzer
                      </Button>
                      <Button size="lg" onClick={() => setLocation("/")} className="gap-2">
                        <Search className="h-4 w-4" /> View Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
