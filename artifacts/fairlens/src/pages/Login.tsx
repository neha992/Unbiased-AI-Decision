import React, { useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, CheckCircle2, Eye, EyeOff, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      localStorage.setItem("equify_auth", "1");
      setLocation("/");
    }, 600);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* LEFT — animated mesh marketing panel */}
      <div className="hidden md:flex w-1/2 relative overflow-hidden bg-mesh text-white">
        {/* floating orbs */}
        <div className="pointer-events-none absolute -top-24 -left-20 w-80 h-80 rounded-full bg-amber-500/30 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute bottom-0 -right-20 w-96 h-96 rounded-full bg-indigo-500/30 blur-3xl animate-float-slower" />
        <div className="pointer-events-none absolute inset-0 bg-grid-dots-dark opacity-60" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/40 blur-xl rounded-2xl" />
              <div className="relative bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-2.5 shadow-glow-amber">
                <ShieldCheck className="h-7 w-7 text-amber-950" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-2xl tracking-tight leading-none">Equify</div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-amber-300/80 font-semibold mt-1">Fairness Intelligence</div>
            </div>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full glass-dark px-3 py-1 mb-6 text-xs font-medium text-amber-200">
              <Sparkles className="h-3.5 w-3.5" />
              Live AI bias detection in 30s
            </div>
            <h1 className="text-5xl lg:text-6xl font-black tracking-tight mb-5 leading-[1.05]">
              Fairness,<br />
              <span className="text-gradient-amber animate-gradient">measured.</span>
            </h1>
            <p className="text-lg text-indigo-100/90 mb-8 leading-relaxed">
              Detect, prove, and fix AI bias in every model you ship — with auditable reports your regulator will love.
            </p>

            <ul className="space-y-3">
              {[
                "Intersectional bias detection",
                "Auditable fairness reports",
                "Actionable debiasing pipeline",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-500/20 p-1">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  </div>
                  <span className="font-medium text-indigo-50">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-dark rounded-2xl p-5 max-w-md">
            <div className="flex items-center gap-1 mb-3 text-amber-400">
              {"★★★★★".split("").map((s, i) => <span key={i} className="text-sm">{s}</span>)}
            </div>
            <p className="italic text-indigo-100/95 mb-3 text-[15px] leading-relaxed">
              "Equify cut our model audit time by 80% and caught a disparate impact issue our team had missed for months."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-amber-950 text-sm">M</div>
              <div>
                <div className="font-semibold text-sm">Maya Chen</div>
                <div className="text-xs text-indigo-200/70">Head of ML, Acme Bank</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — login form */}
      <div className="w-full md:w-1/2 relative flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="absolute inset-0 bg-grid-dots opacity-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-md space-y-7">
          <div className="md:hidden flex items-center justify-center gap-2 mb-2">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl p-2">
              <ShieldCheck className="h-6 w-6 text-amber-950" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight">Equify</span>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to your Equify workspace</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/60 p-1 h-11">
              <TabsTrigger value="signin" className="data-[state=active]:bg-background data-[state=active]:shadow-soft font-semibold">Sign in</TabsTrigger>
              <TabsTrigger value="create" className="data-[state=active]:bg-background data-[state=active]:shadow-soft font-semibold">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold">Email</Label>
                  <Input id="email" type="email" placeholder="name@company.com" defaultValue="demo@equify.ai" required className="h-11" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="font-semibold">Password</Label>
                    <a href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} defaultValue="demo1234" required className="h-11 pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 py-1">
                  <Checkbox id="remember" defaultChecked />
                  <Label htmlFor="remember" className="text-sm font-medium leading-none">Remember me for 30 days</Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-semibold shadow-glow-amber group"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {isLoading ? "Signing in..." : <>Sign in <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" /></>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="create">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">Full Name</Label>
                  <Input id="name" placeholder="Jane Doe" required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="font-semibold">Email</Label>
                  <Input id="register-email" type="email" placeholder="name@company.com" required className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="font-semibold">Password</Label>
                  <div className="relative">
                    <Input id="register-password" type={showPassword ? "text" : "password"} required className="h-11 pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-semibold shadow-glow-amber" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground tracking-wider">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleLogin} disabled={isLoading} className="h-11 font-medium hover-lift">Google</Button>
            <Button variant="outline" onClick={handleLogin} disabled={isLoading} className="h-11 font-medium hover-lift">SSO</Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to Equify's Terms and Privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
