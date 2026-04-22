import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Database, Search, AlertTriangle, Wrench, Brain, 
  CheckCircle2, Loader2, Play, RefreshCw, ArrowRight 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

  const runStep = async (stepIndex: number) => {
    setStatuses(prev => {
      const next = [...prev];
      next[stepIndex] = 'running';
      return next;
    });

    if (stepIndex === 4) {
      // Step 5 specific logic for progress bar
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + (100 / (STEPS[stepIndex].delay / 50));
        });
      }, 50);
      
      await new Promise(resolve => setTimeout(resolve, STEPS[stepIndex].delay));
      clearInterval(interval);
      setProgress(100);
    } else {
      await new Promise(resolve => setTimeout(resolve, STEPS[stepIndex].delay));
    }

    setStatuses(prev => {
      const next = [...prev];
      next[stepIndex] = 'done';
      return next;
    });
  };

  const runAll = async () => {
    if (isPipelineRunning) return;
    setIsPipelineRunning(true);
    setStatuses(Array(6).fill('pending'));
    
    for (let i = 0; i < STEPS.length; i++) {
      await runStep(i);
    }
    
    setIsPipelineRunning(false);
  };

  const resetPipeline = () => {
    setStatuses(Array(6).fill('pending'));
    setProgress(0);
    setIsPipelineRunning(false);
  };

  const renderStepOutput = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-muted-foreground font-medium">
              <span>Rows: 1,200</span>
              <span>|</span>
              <span>Columns: 8</span>
              <span>|</span>
              <span>Format: CSV</span>
            </div>
            <div className="overflow-x-auto border rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-2 font-medium">applicant_id</th>
                    <th className="px-4 py-2 font-medium">gender</th>
                    <th className="px-4 py-2 font-medium">age</th>
                    <th className="px-4 py-2 font-medium">income</th>
                    <th className="px-4 py-2 font-medium">credit_score</th>
                    <th className="px-4 py-2 font-medium">approved</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-foreground">
                  <tr>
                    <td className="px-4 py-2">A1001</td>
                    <td className="px-4 py-2">Male</td>
                    <td className="px-4 py-2">34</td>
                    <td className="px-4 py-2">$65,000</td>
                    <td className="px-4 py-2">720</td>
                    <td className="px-4 py-2 text-green-600">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">A1002</td>
                    <td className="px-4 py-2">Female</td>
                    <td className="px-4 py-2">29</td>
                    <td className="px-4 py-2">$58,000</td>
                    <td className="px-4 py-2">680</td>
                    <td className="px-4 py-2 text-destructive">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">A1003</td>
                    <td className="px-4 py-2">Male</td>
                    <td className="px-4 py-2">45</td>
                    <td className="px-4 py-2">$92,000</td>
                    <td className="px-4 py-2">750</td>
                    <td className="px-4 py-2 text-green-600">Yes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">A1004</td>
                    <td className="px-4 py-2">Female</td>
                    <td className="px-4 py-2">31</td>
                    <td className="px-4 py-2">$62,000</td>
                    <td className="px-4 py-2">710</td>
                    <td className="px-4 py-2 text-green-600">Yes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted/30 p-3 rounded border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Missing Values</div>
                <div className="font-semibold">12 rows</div>
              </div>
              <div className="bg-muted/30 p-3 rounded border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gender Split</div>
                <div className="font-semibold">66% M / 34% F</div>
              </div>
              <div className="bg-muted/30 p-3 rounded border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Age Range</div>
                <div className="font-semibold">22 - 68</div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span>Male (66%)</span>
                <span>Female (34%)</span>
              </div>
              <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{ width: '66%' }} />
                <div className="h-full bg-destructive" style={{ width: '34%' }} />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex gap-3">
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-sm py-1">
                Demographic Parity: 0.24
              </Badge>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-sm py-1">
                Disparate Impact: 0.65
              </Badge>
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-sm py-1">
                Equal Opportunity: 0.27
              </Badge>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded text-destructive text-sm font-medium flex gap-2 items-start">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Result: Bias Detected — Female applicants approved 65% as often as Male.</span>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-5">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-4 w-4" /> Reweighted training data
              </li>
              <li className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-4 w-4" /> Balanced dataset distribution
              </li>
              <li className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-4 w-4" /> Reduced reliance on protected attributes
              </li>
            </ul>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground">Before (66/34)</div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full bg-primary" style={{ width: '66%' }} />
                  <div className="h-full bg-destructive" style={{ width: '34%' }} />
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
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            {statuses[4] === 'running' && (
              <Progress value={progress} className="h-2" />
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground font-medium bg-muted/20 p-4 rounded border">
              <div><span className="text-foreground">Model:</span> Logistic Regression</div>
              <div><span className="text-foreground">Training rows:</span> 960</div>
              <div><span className="text-foreground">Validation rows:</span> 240</div>
              <div><span className="text-foreground">Accuracy:</span> 0.82</div>
              <div><span className="text-foreground">Training time:</span> 1.3s</div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Metrics Comparison</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-muted-foreground">Fairness Score</span>
                    <span className="font-medium">61 <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" /> <span className="text-green-600">87</span></span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-muted-foreground">Bias Rate</span>
                    <span className="font-medium text-destructive">43% <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" /> <span className="text-amber-500">19%</span></span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-muted-foreground">Disparate Impact</span>
                    <span className="font-medium">0.65 <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" /> <span className="text-green-600">0.82</span></span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="text-muted-foreground">Compliance</span>
                    <span className="font-medium">38 <ArrowRight className="inline h-3 w-3 mx-1 text-muted-foreground" /> <span className="text-green-600">80</span></span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Top Feature Importance</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Credit Score', val: 28 },
                    { name: 'Income', val: 24 },
                    { name: 'Employment', val: 20 },
                    { name: 'Dependents', val: 14 },
                    { name: 'Age', val: 9, isWarn: true },
                    { name: 'Gender', val: 5, isGood: true },
                  ].map(f => (
                    <div key={f.name} className="flex items-center gap-2 text-sm">
                      <div className="w-24 truncate text-muted-foreground">{f.name}</div>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${f.isGood ? 'bg-green-500' : f.isWarn ? 'bg-amber-500' : 'bg-primary'}`} 
                          style={{ width: `${f.val}%` }} 
                        />
                      </div>
                      <div className="w-8 text-right font-medium">{f.val}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                <span className="font-semibold text-green-700 dark:text-green-400">Pipeline complete — fairness improved from 61 to 87</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => setLocation('/analyzer')} className="flex-1 sm:flex-none border-green-500/30 hover:bg-green-500/10">
                  Open Analyzer
                </Button>
                <Button size="sm" onClick={() => setLocation('/report')} className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white">
                  View Full Report
                </Button>
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
          <p className="text-muted-foreground">Run the end-to-end fairness pipeline step by step.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={resetPipeline} disabled={isPipelineRunning} className="flex-1 sm:flex-none">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Pipeline
          </Button>
          <Button onClick={runAll} disabled={isPipelineRunning || statuses.every(s => s === 'done')} className="flex-1 sm:flex-none gap-2">
            {isPipelineRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" fill="currentColor" />}
            Run All Steps
          </Button>
        </div>
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
              {/* Vertical line connector */}
              {isConnected && (
                <div 
                  className={`absolute left-[19px] md:left-[23px] top-12 bottom-[-16px] w-0.5 z-0 ${lineActive ? 'bg-green-500' : 'bg-border'}`} 
                />
              )}
              
              {/* Circle Indicator */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center font-bold shadow-sm transition-colors duration-300 ${color} ${border}`}>
                  {status === 'done' ? <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6" /> : step.id}
                </div>
              </div>
              
              {/* Card Content */}
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
                    <Button 
                      variant={status === 'done' ? 'outline' : 'default'}
                      disabled={!isRunnable} 
                      onClick={() => runStep(i)}
                      className={`shrink-0 w-full sm:w-auto ${status === 'done' ? 'text-green-600 border-green-500/30' : ''}`}
                    >
                      {status === 'running' ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>
                      ) : status === 'done' ? (
                        <><RefreshCw className="mr-2 h-4 w-4" /> Rerun Step</>
                      ) : (
                        <><Play className="mr-2 h-4 w-4" /> Run Step</>
                      )}
                    </Button>
                  </div>
                  
                  <AnimatePresence>
                    {status === 'done' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 md:p-6 border-t bg-card/50">
                          {renderStepOutput(i)}
                        </div>
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
