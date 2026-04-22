import React, { useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

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
      {/* Left Half - Marketing Panel */}
      <div className="hidden md:flex w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-12">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-amber-500" />
          <span className="font-bold text-2xl tracking-wide">Equify</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Fairness, measured.
          </h1>
          <p className="text-lg text-indigo-200 mb-8">
            Detect, prove, and fix AI bias in 30 seconds.
          </p>

          <ul className="space-y-4">
            {[
              "Intersectional bias detection",
              "Auditable fairness reports",
              "Actionable debiasing pipeline"
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-amber-500 shrink-0" />
                <span className="font-medium">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Card className="bg-white/10 border-white/20 backdrop-blur-sm text-white max-w-md">
          <CardContent className="p-6">
            <p className="italic text-indigo-100 mb-4">
              "Equify cut our model audit time by 80%."
            </p>
            <div className="font-semibold">— Head of ML, Acme Bank</div>
          </CardContent>
        </Card>
      </div>

      {/* Right Half - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left md:hidden mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl tracking-wide">Equify</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to your Equify workspace
            </p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="create">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    defaultValue="demo@equify.ai"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-xs font-medium text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      defaultValue="demo1234"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 py-2">
                  <Checkbox id="remember" defaultChecked />
                  <Label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Remember me
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="create">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input id="register-email" type="email" placeholder="name@company.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleLogin} disabled={isLoading}>
              Google
            </Button>
            <Button variant="outline" onClick={handleLogin} disabled={isLoading}>
              SSO
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to Equify's Terms and Privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
