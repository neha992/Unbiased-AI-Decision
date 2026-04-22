import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, FileSpreadsheet, Database, AlertCircle, CheckCircle2, Search } from "lucide-react";

type SampleRow = {
  applicant_id: string;
  gender: string;
  age: number;
  income: number;
  credit_score: number;
  employment_years: number;
  dependents: number;
  approved: string;
};

const SAMPLE_DATA: SampleRow[] = [
  { applicant_id: "A001", gender: "Male", age: 34, income: 85000, credit_score: 720, employment_years: 6, dependents: 0, approved: "Yes" },
  { applicant_id: "A002", gender: "Female", age: 29, income: 62000, credit_score: 690, employment_years: 3, dependents: 1, approved: "No" },
  { applicant_id: "A003", gender: "Male", age: 42, income: 110000, credit_score: 780, employment_years: 12, dependents: 2, approved: "Yes" },
  { applicant_id: "A004", gender: "Female", age: 31, income: 75000, credit_score: 710, employment_years: 5, dependents: 0, approved: "No" },
  { applicant_id: "A005", gender: "Male", age: 26, income: 58000, credit_score: 650, employment_years: 2, dependents: 0, approved: "Yes" },
  { applicant_id: "A006", gender: "Female", age: 38, income: 92000, credit_score: 740, employment_years: 8, dependents: 1, approved: "Yes" },
  { applicant_id: "A007", gender: "Male", age: 45, income: 135000, credit_score: 810, employment_years: 15, dependents: 3, approved: "Yes" },
  { applicant_id: "A008", gender: "Female", age: 27, income: 48000, credit_score: 620, employment_years: 1, dependents: 0, approved: "No" },
  { applicant_id: "A009", gender: "Male", age: 33, income: 72000, credit_score: 680, employment_years: 4, dependents: 1, approved: "Yes" },
  { applicant_id: "A010", gender: "Female", age: 35, income: 81000, credit_score: 730, employment_years: 7, dependents: 2, approved: "No" }
];

export default function Upload() {
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dataPreview, setDataPreview] = useState<SampleRow[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFileOrSample = (data: SampleRow[], isFile: boolean = false) => {
    setDataPreview(data);
    setAnalyzing(true);
    setProgress(0);
    setAnalysisComplete(false);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(Math.min(currentProgress, 100));
      
      if (currentProgress >= 100) {
        clearInterval(interval);
        setAnalyzing(false);
        setAnalysisComplete(true);
      }
    }, 75);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        processFileOrSample(SAMPLE_DATA, true); // Mocking parsing with sample data for demo
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      processFileOrSample(SAMPLE_DATA, true); // Mocking parsing with sample data for demo
    }
  };

  const useSampleData = () => {
    setFile(new File(["sample_loan_data.csv"], "sample_loan_data.csv", { type: "text/csv" }));
    processFileOrSample(SAMPLE_DATA);
  };

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upload Dataset</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload your historical lending data (CSV format) to detect structural biases and unfair patterns in your decision models.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!dataPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <div 
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Drag and drop your dataset</h3>
              <p className="text-muted-foreground mb-6">Supports .csv files up to 50MB</p>
              
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

        {dataPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    {file?.name || "Dataset"}
                  </CardTitle>
                  <CardDescription>10,000 rows, 8 columns</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setDataPreview(null);
                  setAnalysisComplete(false);
                  setFile(null);
                }}>
                  Change File
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Gender</th>
                      <th className="px-4 py-3">Age</th>
                      <th className="px-4 py-3">Income</th>
                      <th className="px-4 py-3">Credit</th>
                      <th className="px-4 py-3">Empl (yrs)</th>
                      <th className="px-4 py-3">Dep</th>
                      <th className="px-4 py-3">Approved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dataPreview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-mono text-xs">{row.applicant_id}</td>
                        <td className="px-4 py-2">{row.gender}</td>
                        <td className="px-4 py-2">{row.age}</td>
                        <td className="px-4 py-2">₹{row.income.toLocaleString()}</td>
                        <td className="px-4 py-2">{row.credit_score}</td>
                        <td className="px-4 py-2">{row.employment_years}</td>
                        <td className="px-4 py-2">{row.dependents}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.approved === 'Yes' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {row.approved}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-center p-2 text-xs text-muted-foreground bg-muted/20 border-t">
                  Showing 5 of 10,000 rows
                </div>
              </CardContent>
            </Card>

            {analyzing && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6 pb-6 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-primary font-medium">
                    <Database className="h-5 w-5 animate-pulse" />
                    Analyzing dataset for potential bias...
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
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold text-amber-900 dark:text-amber-200">Analysis Complete: Risk Factors Detected</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1 font-medium">Demographic Imbalance</div>
                        <div className="font-semibold text-lg">Female 34% / Male 66%</div>
                        <div className="text-xs text-destructive mt-1">Significant skew</div>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1 font-medium">Sensitive Features</div>
                        <div className="font-semibold text-lg">Gender, Age</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">Protected attributes found</div>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1 font-medium">Data Quality</div>
                        <div className="font-semibold text-lg">12 Missing Values</div>
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">Acceptable range</div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => {
                        setDataPreview(null);
                        setAnalysisComplete(false);
                      }}>Cancel</Button>
                      <Button size="lg" onClick={() => setLocation("/")} className="gap-2">
                        <Search className="h-4 w-4" />
                        Analyze Bias Dashboard
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