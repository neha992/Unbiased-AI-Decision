import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shuffle, Sparkles, AlertCircle, CheckCircle2, XCircle, Link2, Link2Off, Play } from "lucide-react";

type Profile = {
  gender: "Male" | "Female";
  income: number;
  creditScore: number;
  employment: number;
  dependents: number;
  age: number;
};

const defaultProfile: Profile = {
  gender: "Male",
  income: 800000,
  creditScore: 720,
  employment: 5,
  dependents: 1,
  age: 32,
};

function calculateProbability(p: Profile) {
  const raw =
    0.0000005 * p.income +
    0.01 * p.creditScore +
    0.05 * p.employment -
    0.03 * p.dependents -
    0.005 * p.age -
    6.14;
  let prob = 1 / (1 + Math.exp(-raw));
  if (p.gender === "Female") prob -= 0.21;
  return Math.max(0, Math.min(100, Math.round(prob * 100)));
}

export default function Simulator() {
  const search = useSearch();
  const autoDemo = new URLSearchParams(search).get("demo") === "1";

  const [linked, setLinked] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  const [profileA, setProfileA] = useState<Profile>({ ...defaultProfile, gender: "Male" });
  const [profileB, setProfileB] = useState<Profile>({ ...defaultProfile, gender: "Female" });

  const updateA = (patch: Partial<Profile>) => {
    setProfileA((prev) => {
      const next = { ...prev, ...patch };
      if (linked) {
        setProfileB({ ...next, gender: next.gender === "Male" ? "Female" : "Male" });
      }
      return next;
    });
  };

  const updateB = (patch: Partial<Profile>) => {
    setProfileB((prev) => {
      const next = { ...prev, ...patch };
      if (linked && !("gender" in patch)) {
        setProfileA({ ...next, gender: next.gender === "Male" ? "Female" : "Male" });
      }
      return next;
    });
  };

  useEffect(() => {
    const t = setTimeout(() => setShowBanner(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Auto-demo: cycle gender of B a few times to prove bias visually
  const demoRan = useRef(false);
  useEffect(() => {
    if (!autoDemo || demoRan.current) return;
    demoRan.current = true;
    let count = 0;
    const id = setInterval(() => {
      setProfileB((prev) => ({ ...prev, gender: prev.gender === "Male" ? "Female" : "Male" }));
      count += 1;
      if (count >= 5) clearInterval(id);
    }, 900);
    return () => clearInterval(id);
  }, [autoDemo]);

  const probA = calculateProbability(profileA);
  const probB = calculateProbability(profileB);
  const approvedA = probA >= 70;
  const approvedB = probB >= 70;

  const onlyGenderDiffers =
    profileA.income === profileB.income &&
    profileA.creditScore === profileB.creditScore &&
    profileA.employment === profileB.employment &&
    profileA.dependents === profileB.dependents &&
    profileA.age === profileB.age &&
    profileA.gender !== profileB.gender;

  const biasProven = onlyGenderDiffers && approvedA !== approvedB;

  const randomize = () => {
    const newA: Profile = {
      gender: Math.random() > 0.5 ? "Male" : "Female",
      income: Math.floor(Math.random() * 10 + 4) * 100000,
      creditScore: Math.floor(Math.random() * 200 + 600),
      employment: Math.floor(Math.random() * 10 + 1),
      dependents: Math.floor(Math.random() * 4),
      age: Math.floor(Math.random() * 30 + 25),
    };
    setProfileA(newA);
    setProfileB({ ...newA, gender: newA.gender === "Male" ? "Female" : "Male" });
    setLinked(true);
    setShowBanner(false);
    setTimeout(() => setShowBanner(true), 300);
  };

  const runProof = () => {
    setLinked(true);
    setProfileA({ ...defaultProfile, gender: "Male" });
    setProfileB({ ...defaultProfile, gender: "Female" });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Bias Simulator</h1>
          <p className="text-muted-foreground mt-1">
            Edit either applicant. Keep them linked to prove that only changing gender flips the decision.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          <Button variant="secondary" onClick={runProof} className="gap-2 flex-1 md:flex-none">
            <Play className="h-4 w-4" fill="currentColor" />
            Reset to Proof
          </Button>
          <Button variant="outline" onClick={randomize} className="gap-2 flex-1 md:flex-none">
            <Shuffle className="h-4 w-4" />
            Randomize
          </Button>
          <Link href="/copilot">
            <Button className="gap-2 flex-1 md:flex-none">
              <Sparkles className="h-4 w-4" />
              Explain This Bias
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between bg-muted/40 border rounded-lg px-4 py-3">
        <div className="flex items-center gap-3">
          {linked ? <Link2 className="h-4 w-4 text-primary" /> : <Link2Off className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-semibold">Link applicants (only gender differs)</p>
            <p className="text-xs text-muted-foreground">
              When linked, editing one applicant mirrors all attributes except gender to the other. This isolates bias.
            </p>
          </div>
        </div>
        <Switch checked={linked} onCheckedChange={setLinked} />
      </div>

      <AnimatePresence>
        {showBanner && biasProven && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="font-medium">
              Bias Proven — Only gender differs, but the decision reversed ({approvedA ? "Approved" : "Rejected"} vs{" "}
              {approvedB ? "Approved" : "Rejected"}).
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-6">
        <ApplicantCard
          title="Applicant A"
          tag="Profile A"
          tone="muted"
          profile={profileA}
          onChange={updateA}
          probability={probA}
          approved={approvedA}
        />
        <ApplicantCard
          title="Applicant B"
          tag="Profile B"
          tone="primary"
          profile={profileB}
          onChange={updateB}
          probability={probB}
          approved={approvedB}
        />
      </div>
    </div>
  );
}

function ApplicantCard({
  title,
  tag,
  tone,
  profile,
  onChange,
  probability,
  approved,
}: {
  title: string;
  tag: string;
  tone: "muted" | "primary";
  profile: Profile;
  onChange: (p: Partial<Profile>) => void;
  probability: number;
  approved: boolean;
}) {
  const headerCls = tone === "primary" ? "bg-primary/5 border-primary/10" : "bg-muted/30 border-dashed";
  const borderCls = tone === "primary" ? "border-2 border-primary/20 shadow-md" : "bg-muted/10 border-dashed border-2";

  return (
    <Card className={`relative overflow-hidden ${borderCls}`}>
      <CardHeader className={`pb-4 border-b ${headerCls}`}>
        <Badge className={`w-fit mb-2 ${tone === "primary" ? "bg-primary" : ""}`} variant={tone === "primary" ? "default" : "outline"}>
          {tag}
        </Badge>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground font-normal">Gender</Label>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${profile.gender === "Male" ? "font-bold" : "text-muted-foreground"}`}>Male</span>
              <Switch
                checked={profile.gender === "Female"}
                onCheckedChange={(checked) => onChange({ gender: checked ? "Female" : "Male" })}
              />
              <span className={`text-sm ${profile.gender === "Female" ? "font-bold" : "text-muted-foreground"}`}>Female</span>
            </div>
          </div>

          <SliderRow
            label="Annual Income"
            value={profile.income}
            display={`₹${profile.income.toLocaleString()}`}
            min={200000}
            max={2000000}
            step={50000}
            onChange={(v) => onChange({ income: v })}
          />
          <SliderRow
            label="Credit Score"
            value={profile.creditScore}
            display={`${profile.creditScore}`}
            min={300}
            max={850}
            step={10}
            onChange={(v) => onChange({ creditScore: v })}
          />

          <div className="grid grid-cols-2 gap-4">
            <SliderRow
              label="Employment"
              value={profile.employment}
              display={`${profile.employment} yrs`}
              min={0}
              max={20}
              step={1}
              onChange={(v) => onChange({ employment: v })}
            />
            <SliderRow
              label="Age"
              value={profile.age}
              display={`${profile.age}`}
              min={18}
              max={80}
              step={1}
              onChange={(v) => onChange({ age: v })}
            />
          </div>

          <SliderRow
            label="Dependents"
            value={profile.dependents}
            display={`${profile.dependents}`}
            min={0}
            max={6}
            step={1}
            onChange={(v) => onChange({ dependents: v })}
          />
        </div>

        <div className="pt-6 border-t mt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Model Decision</span>
            {approved ? (
              <Badge className="bg-green-500 hover:bg-green-600 gap-1 text-sm py-1 px-2">
                <CheckCircle2 className="w-4 h-4" /> APPROVED
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1 text-sm py-1 px-2">
                <XCircle className="w-4 h-4" /> REJECTED
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Approval Probability</span>
              <span>{probability}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden relative">
              <motion.div
                className={`h-full ${approved ? "bg-green-500" : "bg-destructive"}`}
                animate={{ width: `${probability}%` }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-foreground/20 z-10" />
            </div>
            <p className="text-[10px] text-muted-foreground text-right">70% threshold</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <Label className="text-sm text-muted-foreground font-normal">{label}</Label>
        <span className="text-sm font-semibold">{display}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
