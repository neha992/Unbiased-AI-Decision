import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shuffle, Sparkles, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function Simulator() {
  const [showBanner, setShowBanner] = useState(false);
  
  const [profileA, setProfileA] = useState({
    gender: "Male",
    income: 800000,
    creditScore: 720,
    employment: 5,
    dependents: 1,
    age: 32
  });

  const [profileB, setProfileB] = useState({
    gender: "Female",
    income: 800000,
    creditScore: 720,
    employment: 5,
    dependents: 1,
    age: 32
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowBanner(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const calculateProbability = (p: typeof profileA) => {
    // baseProbability = sigmoid( 0.0000005*income + 0.01*creditScore + 0.05*employmentYears - 0.03*dependents - 0.005*age )
    const raw = 0.0000005 * p.income + 0.01 * p.creditScore + 0.05 * p.employment - 0.03 * p.dependents - 0.005 * p.age - 6.14;
    let prob = 1 / (1 + Math.exp(-raw));
    
    if (p.gender === "Female") {
      prob -= 0.21;
    }
    
    return Math.max(0, Math.min(100, Math.round(prob * 100)));
  };

  const probA = calculateProbability(profileA);
  const probB = calculateProbability(profileB);
  
  const approvedA = probA >= 70;
  const approvedB = probB >= 70;

  const randomizeA = () => {
    const newA = {
      gender: Math.random() > 0.5 ? "Male" : "Female",
      income: Math.floor(Math.random() * 10 + 4) * 100000,
      creditScore: Math.floor(Math.random() * 200 + 600),
      employment: Math.floor(Math.random() * 10 + 1),
      dependents: Math.floor(Math.random() * 4),
      age: Math.floor(Math.random() * 30 + 25)
    };
    setProfileA(newA);
    setProfileB({ ...newA, gender: newA.gender === "Male" ? "Female" : "Male" });
    setShowBanner(false);
    setTimeout(() => setShowBanner(true), 400);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Bias Simulator</h1>
          <p className="text-muted-foreground mt-1">Adjust inputs to see how the model reacts to protected attributes.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={randomizeA} className="gap-2 flex-1 md:flex-none">
            <Shuffle className="h-4 w-4" />
            Try Another Scenario
          </Button>
          <Link href="/copilot">
            <Button className="gap-2 flex-1 md:flex-none">
              <Sparkles className="h-4 w-4" />
              Explain This Bias
            </Button>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {showBanner && profileA.gender !== profileB.gender && approvedA !== approvedB && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">
              Bias Detected — Only gender changed, but the decision reversed. This indicates unfair treatment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-6">
        {/* PROFILE A */}
        <Card className="relative overflow-hidden bg-muted/10 border-dashed border-2">
          <CardHeader className="bg-muted/30 pb-4 border-b border-dashed">
            <Badge variant="outline" className="w-fit mb-2">Profile A (Control)</Badge>
            <CardTitle className="text-xl">Applicant A</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-semibold">{profileA.gender}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Annual Income</span>
                <span className="font-semibold">₹{profileA.income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Credit Score</span>
                <span className="font-semibold">{profileA.creditScore}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Employment</span>
                <span className="font-semibold">{profileA.employment} yrs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Age</span>
                <span className="font-semibold">{profileA.age}</span>
              </div>
            </div>

            <div className="pt-6 border-t mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Model Decision</span>
                {approvedA ? (
                  <Badge className="bg-green-500 hover:bg-green-600 gap-1 text-sm py-1 px-2"><CheckCircle2 className="w-4 h-4"/> APPROVED</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 text-sm py-1 px-2"><XCircle className="w-4 h-4"/> REJECTED</Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Approval Probability</span>
                  <span>{probA}%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${approvedA ? 'bg-green-500' : 'bg-destructive'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${probA}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PROFILE B */}
        <Card className="relative overflow-hidden border-2 border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
            <Badge className="w-fit mb-2 bg-primary">Profile B (Interactive)</Badge>
            <CardTitle className="text-xl">Applicant B</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Label htmlFor="gender-toggle" className="text-sm text-muted-foreground font-normal">Gender</Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${profileB.gender === 'Male' ? 'font-bold' : 'text-muted-foreground'}`}>Male</span>
                  <Switch 
                    id="gender-toggle" 
                    checked={profileB.gender === 'Female'}
                    onCheckedChange={(checked) => setProfileB({...profileB, gender: checked ? 'Female' : 'Male'})}
                  />
                  <span className={`text-sm ${profileB.gender === 'Female' ? 'font-bold' : 'text-muted-foreground'}`}>Female</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-sm text-muted-foreground font-normal">Annual Income</Label>
                  <span className="text-sm font-semibold">₹{profileB.income.toLocaleString()}</span>
                </div>
                <Slider 
                  value={[profileB.income]} 
                  min={200000} max={2000000} step={50000}
                  onValueChange={([val]) => setProfileB({...profileB, income: val})}
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-sm text-muted-foreground font-normal">Credit Score</Label>
                  <span className="text-sm font-semibold">{profileB.creditScore}</span>
                </div>
                <Slider 
                  value={[profileB.creditScore]} 
                  min={300} max={850} step={10}
                  onValueChange={([val]) => setProfileB({...profileB, creditScore: val})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-sm text-muted-foreground font-normal">Employment</Label>
                    <span className="text-sm font-semibold">{profileB.employment} yrs</span>
                  </div>
                  <Slider 
                    value={[profileB.employment]} 
                    min={0} max={20} step={1}
                    onValueChange={([val]) => setProfileB({...profileB, employment: val})}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-sm text-muted-foreground font-normal">Age</Label>
                    <span className="text-sm font-semibold">{profileB.age}</span>
                  </div>
                  <Slider 
                    value={[profileB.age]} 
                    min={18} max={80} step={1}
                    onValueChange={([val]) => setProfileB({...profileB, age: val})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Model Decision</span>
                {approvedB ? (
                  <Badge className="bg-green-500 hover:bg-green-600 gap-1 text-sm py-1 px-2"><CheckCircle2 className="w-4 h-4"/> APPROVED</Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1 text-sm py-1 px-2"><XCircle className="w-4 h-4"/> REJECTED</Badge>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Approval Probability</span>
                  <span>{probB}%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden relative">
                  <motion.div 
                    className={`h-full ${approvedB ? 'bg-green-500' : 'bg-destructive'}`}
                    animate={{ width: `${probB}%` }}
                    transition={{ duration: 0.3 }}
                  />
                  <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-foreground/20 z-10" />
                </div>
                <p className="text-[10px] text-muted-foreground text-right">70% threshold</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
