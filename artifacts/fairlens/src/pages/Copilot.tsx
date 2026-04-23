import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, BrainCircuit, CheckCircle2, ChevronRight, Sparkles, AlertCircle, Loader2, RefreshCw, Database, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { loadDataset, computeMetrics, buildSampleDataset, DatasetMeta } from "@/lib/dataset";

type Message = { id: string; role: "user" | "assistant"; content: string };

type FairnessReport = {
  validation: { rowCount: number; columnCount: number; columns: string[]; missingCells: number; invalidRows: number; warnings: string[] };
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

function datasetToCSV(meta: DatasetMeta): string {
  const lines: string[] = [meta.columns.join(",")];
  for (const row of meta.rows) {
    lines.push(meta.columns.map((c) => String(row[c] ?? "")).join(","));
  }
  return lines.join("\n");
}

const SUGGESTED_QUESTIONS = [
  "Why is this model biased?",
  "How do I fix this?",
  "What are the metrics?",
  "Which group is disadvantaged?",
  "Is the dataset balanced?",
];

export default function Copilot() {
  const [, setLocation] = useLocation();
  const [dataset, setDataset] = useState<DatasetMeta | null>(null);
  const [report, setReport] = useState<FairnessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usedSample, setUsedSample] = useState(false);

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load dataset + run audit
  const runAudit = async (forceSample = false) => {
    setLoading(true);
    setError(null);
    setReport(null);

    let meta = loadDataset();
    let sample = false;
    if (!meta || forceSample) { meta = buildSampleDataset(); sample = true; }
    setDataset(meta);
    setUsedSample(sample);

    try {
      const csv = datasetToCSV(meta);
      const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
      const res = await fetch(`${base}api/fairness/analyze`, {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: csv,
      });
      if (!res.ok) throw new Error(`Backend ${res.status}`);
      const data: FairnessReport = await res.json();
      setReport(data);
      // Seed greeting once based on real findings
      setMessages([{
        id: "init",
        role: "assistant",
        content: sample
          ? `I just audited the sample loan dataset (${meta.rows.length.toLocaleString()} rows). Verdict: ${data.verdict}. Ask me anything — I'll answer using your real numbers.`
          : `I audited "${meta.name}" (${meta.rows.length.toLocaleString()} rows). Verdict: ${data.verdict}. Ask me anything about the bias, metrics, or fixes.`
      }]);
    } catch (e: any) {
      setError(e?.message || "Could not reach the fairness backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
    const onUpdate = () => runAudit();
    window.addEventListener("equify_dataset_updated", onUpdate);
    return () => window.removeEventListener("equify_dataset_updated", onUpdate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local metrics for extra colour
  const localMetrics = useMemo(() => (dataset ? computeMetrics(dataset) : null), [dataset]);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (el) (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight;
    }
  }, [messages, isTyping]);

  const answer = (q: string): string => {
    if (!report) return "I don't have an audit yet. Try uploading a dataset first.";
    const m = report.metrics;
    const fav = m.favoredGroup || "the favored group";
    const dis = m.disadvantagedGroup || "the disadvantaged group";
    const favRate = m.groups.find(g => g.group === m.favoredGroup);
    const disRate = m.groups.find(g => g.group === m.disadvantagedGroup);
    const di = m.disparateImpactRatio.toFixed(2);
    const gap = (m.selectionRateDifference * 100).toFixed(1);
    const spd = m.statisticalParityDifference.toFixed(2);
    const ql = q.toLowerCase();

    if (ql.includes("verdict") || ql.includes("fair") || ql.includes("biased")) {
      return `Verdict: ${report.verdict}. ${report.explanation}`;
    }
    if (ql.includes("why")) {
      const causes: string[] = [];
      if (m.disparateImpactRatio < 0.8) causes.push(`the Disparate Impact Ratio is ${di}, below the 0.80 legal threshold`);
      if (m.selectionRateDifference > 0.2) causes.push(`there is a ${gap}-point gap between groups`);
      if (Math.abs(m.statisticalParityDifference) > 0.1) causes.push(`statistical parity Δ is ${spd}, above the 0.10 threshold`);
      if (causes.length === 0) return "The model passes the main fairness checks on this dataset. Group rates are within accepted thresholds.";
      return `The model favors '${fav}' over '${dis}' because ${causes.join(", and ")}. Even after removing the protected attribute, correlated features can leak the same signal.`;
    }
    if (ql.includes("fix") || ql.includes("how") || ql.includes("mitigat") || ql.includes("solve")) {
      return `Recommended actions:\n${report.suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
    }
    if (ql.includes("score") || ql.includes("metric") || ql.includes("number")) {
      return `Disparate Impact Ratio: ${di} (need ≥ 0.80)\nSelection rate gap: ${gap}% (need ≤ 20%)\nStatistical parity Δ: ${spd} (need ≤ 0.10)\nFailed checks: ${report.flags.failedMetrics.length || 0}`;
    }
    if (ql.includes("group") || ql.includes("disadvantage") || ql.includes("favored") || ql.includes("who")) {
      if (favRate && disRate) {
        return `'${fav}' is favored with a ${(favRate.approvalRate * 100).toFixed(1)}% approval rate (${favRate.approved}/${favRate.total}). '${dis}' is disadvantaged at ${(disRate.approvalRate * 100).toFixed(1)}% (${disRate.approved}/${disRate.total}). Gap: ${gap} points.`;
      }
      return "Group breakdown is not available — your dataset may be missing a recognizable group column.";
    }
    if (ql.includes("data") || ql.includes("balance") || ql.includes("size") || ql.includes("row")) {
      const balance = m.groups.map(g => `${g.group}: ${g.total} rows (${((g.total / report.validation.rowCount) * 100).toFixed(0)}%)`).join(", ");
      return `Audited ${report.validation.rowCount.toLocaleString()} rows across ${report.validation.columnCount} columns. ${report.validation.missingCells} missing cells. Group balance: ${balance || "n/a"}.`;
    }
    if (ql.includes("warn") || ql.includes("issue") || ql.includes("problem")) {
      if (report.validation.warnings.length === 0 && report.flags.failedMetrics.length === 0) return "No warnings or failed checks. The dataset and model look clean.";
      const items = [...report.flags.failedMetrics.map(f => `Failed: ${f}`), ...report.validation.warnings.map(w => `Warning: ${w}`)];
      return items.join("\n");
    }
    if (ql.includes("hello") || ql.includes("hi ") || ql.startsWith("hi") || ql.includes("hey")) {
      return `Hi! I've already audited your dataset. Verdict is ${report.verdict}. Try asking "why is it biased?" or "how do I fix this?"`;
    }
    // Default: give explanation + first suggestion
    return `${report.explanation}${report.suggestions[0] ? ` Suggested next step: ${report.suggestions[0]}` : ""}`;
  };

  const ask = (q: string) => {
    if (!q.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setIsTyping(true);
    const replyText = answer(q);
    const delay = Math.min(900, 250 + replyText.length * 4);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: replyText }]);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); ask(query); };

  const verdictBadge = () => {
    if (!report) return null;
    if (report.verdict === "Fair Model") return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30"><ShieldCheck className="h-3.5 w-3.5" /> Fair</span>;
    if (report.flags.highlyBiased) return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/30"><ShieldX className="h-3.5 w-3.5" /> Highly Biased</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"><ShieldAlert className="h-3.5 w-3.5" /> Biased</span>;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Bias Copilot</h1>
            {verdictBadge()}
          </div>
          <p className="text-muted-foreground mt-1">
            {usedSample
              ? "Running on the sample loan dataset. Upload your own CSV to audit it."
              : dataset ? <>Auditing <span className="font-mono text-foreground">{dataset.name}</span> ({dataset.rows.length.toLocaleString()} rows).</> : "Audit your model with real numbers."}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={() => runAudit()} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Re-run Audit
          </Button>
          <Button variant="outline" onClick={() => setLocation("/upload")} className="gap-2">
            <Database className="h-4 w-4" /> Upload Data
          </Button>
          <Button onClick={() => setLocation("/report")} className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-amber-950 hover:from-amber-600 hover:to-amber-700 shadow-glow-amber">
            View Report <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <div className="text-sm">
              <div className="font-semibold text-destructive">Backend unavailable</div>
              <div className="text-muted-foreground">{error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* LEFT — diagnostics from real audit */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 shadow-soft">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  Diagnostic Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {loading && <DiagSkeleton />}
                {!loading && report && (
                  <>
                    <DiagBlock label="Bias Summary" tone={report.verdict === "Fair Model" ? "ok" : "bad"}>
                      {report.verdict === "Fair Model"
                        ? `The model passes the main fairness checks across ${report.metrics.groups.length} groups.`
                        : report.metrics.favoredGroup && report.metrics.disadvantagedGroup
                        ? `The model favors '${report.metrics.favoredGroup}' over '${report.metrics.disadvantagedGroup}' by ${(report.metrics.selectionRateDifference * 100).toFixed(1)} percentage points.`
                        : "The model fails one or more fairness thresholds on this dataset."}
                    </DiagBlock>

                    <DiagBlock label="Why This Happens" tone="warn">
                      {report.explanation}
                    </DiagBlock>

                    <DiagBlock label="Plain-language Translation" tone="info">
                      {report.verdict === "Fair Model"
                        ? "Two people with similar profiles tend to get similar decisions, regardless of their group. That's what fairness looks like in practice."
                        : "Even when two people are otherwise identical, just changing their group can change the decision. That's the unfairness signal."}
                    </DiagBlock>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <MiniMetric label="DI Ratio" value={report.metrics.disparateImpactRatio.toFixed(2)} ok={report.metrics.disparateImpactRatio >= 0.8} />
                      <MiniMetric label="Rate Gap" value={`${(report.metrics.selectionRateDifference * 100).toFixed(0)}%`} ok={report.metrics.selectionRateDifference <= 0.2} />
                      <MiniMetric label="SPD" value={report.metrics.statisticalParityDifference.toFixed(2)} ok={Math.abs(report.metrics.statisticalParityDifference) <= 0.1} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-amber-500" /> Fix Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && <DiagSkeleton lines={4} />}
                {!loading && report && (
                  <>
                    <ul className="space-y-2.5">
                      {report.suggestions.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm bg-muted/40 rounded-md px-3 py-2 border">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>

                    {localMetrics && localMetrics.fairnessScore != null && (
                      <div className="pt-4 border-t mt-4">
                        <p className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500" />
                          Current fairness score: <span className="font-bold">{localMetrics.fairnessScore}</span> · projected after fixes: <span className="font-bold text-green-600">{Math.min(98, localMetrics.fairnessScore + 25)}</span>
                        </p>
                        <div className="space-y-2">
                          <BarRow label="Now" value={localMetrics.fairnessScore} tone="bad" />
                          <BarRow label="After fixes" value={Math.min(98, localMetrics.fairnessScore + 25)} tone="ok" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* RIGHT — chat panel */}
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="h-full">
          <Card className="flex flex-col h-[640px] shadow-pop border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-amber-500/5 pb-4 border-b border-primary/10">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
                    <div className="relative bg-primary text-primary-foreground p-1.5 rounded-full"><Bot className="h-4 w-4" /></div>
                  </div>
                  Ask Bias Copilot
                </span>
                {report && <span className="text-xs font-mono text-muted-foreground">grounded in {report.validation.rowCount.toLocaleString()} rows</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                  {loading && messages.length === 0 && (
                    <div className="flex items-center gap-3 text-muted-foreground text-sm py-6 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" /> Auditing your dataset...
                    </div>
                  )}
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 max-w-[88%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950"}`}>
                          {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                          msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm border"
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%]">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-amber-950" /></div>
                      <div className="px-4 py-3 rounded-2xl bg-muted rounded-tl-sm flex items-center gap-1.5 border">
                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Suggested chips */}
              {report && (
                <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5 border-t bg-muted/20">
                  {SUGGESTED_QUESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      disabled={isTyping}
                      className="text-xs px-2.5 py-1 rounded-full bg-background border hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="p-3 border-t bg-card">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    placeholder={report ? "Ask about your model's bias..." : "Run an audit first..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={!report || isTyping}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!query.trim() || isTyping || !report} className="bg-primary">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function DiagBlock({ label, children, tone }: { label: string; children: React.ReactNode; tone: "ok" | "bad" | "warn" | "info" }) {
  const colorMap = {
    ok: "border-green-500 bg-green-500/5",
    bad: "border-destructive bg-destructive/5",
    warn: "border-amber-500 bg-amber-500/5",
    info: "border-primary bg-primary/5",
  };
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{label}</h4>
      <p className={`text-sm border-l-2 pl-3 py-1.5 ${colorMap[tone]}`}>{children}</p>
    </div>
  );
}

function MiniMetric({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className={`rounded-md border p-2 text-center ${ok ? "bg-green-500/5 border-green-500/30" : "bg-destructive/5 border-destructive/30"}`}>
      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`text-lg font-bold leading-tight ${ok ? "text-green-600" : "text-destructive"}`}>{value}</div>
    </div>
  );
}

function BarRow({ label, value, tone }: { label: string; value: number; tone: "ok" | "bad" }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
        <span>{label}</span><span className="font-mono font-semibold">{value}/100</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className={`h-full transition-all ${tone === "ok" ? "bg-green-500" : "bg-destructive"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function DiagSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-full bg-muted rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
