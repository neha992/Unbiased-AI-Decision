import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, BrainCircuit, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Copilot() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([{
    id: "initial",
    role: "assistant",
    content: "I'm your Bias Copilot. I've analyzed the model and can explain the structural bias we found. What would you like to know?"
  }]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: query };
    setMessages(prev => [...prev, userMsg]);
    setQuery("");
    setIsTyping(true);

    const q = userMsg.content.toLowerCase();
    
    setTimeout(() => {
      let response = "Bias here is structural, not random. Even after removing gender, correlated features can leak the signal — that is why we combine resampling, constraint training, and audit metrics.";
      
      if (q.includes("why")) {
        response = "The model has learned from historical data where approval patterns differed across groups. Income, employment, and credit features carry indirect signals about gender, so the model amplifies that gap.";
      } else if (q.includes("fix") || q.includes("how")) {
        response = "Apply three fixes together: drop the protected attribute, rebalance the training set across groups, and add fairness constraints during training. This typically lifts fairness 20-30 points.";
      } else if (q.includes("score") || q.includes("metric")) {
        response = "Demographic Parity Difference drops from 0.24 to 0.09, Disparate Impact climbs from 0.65 to 0.82, and the overall Fairness Score moves from 61 to 87.";
      } else if (q.includes("data")) {
        response = "Your training set was 66% male, 34% female. Resampling to 50/50 plus reweighting reduces representation bias before training even starts.";
      }

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: response }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bias Copilot</h1>
          <p className="text-muted-foreground mt-1">AI-assisted analysis and remediation of model fairness.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={() => setLocation("/")} className="flex-1 md:flex-none">
            Back to Dashboard
          </Button>
          <Button onClick={() => setLocation("/report")} className="flex-1 md:flex-none gap-2">
            Apply Bias Fix (Demo)
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-2 shadow-sm">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                  Diagnostic Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Bias Summary</h4>
                  <p className="text-sm border-l-2 border-destructive pl-3 py-1 bg-destructive/5">
                    The model shows gender bias, with female applicants receiving fewer approvals.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Why This Happens</h4>
                  <p className="text-sm border-l-2 border-amber-500 pl-3 py-1 bg-amber-500/5">
                    The model relies heavily on income patterns, and historical data shows lower average income for female applicants.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Simple Explanation</h4>
                  <p className="text-sm border-l-2 border-primary pl-3 py-1 bg-primary/5">
                    Even when two people are identical, just changing gender changes the decision. That means the system is unfair.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Fix Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">Remove gender influence from model</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">Rebalance training data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">Apply fairness constraints</span>
                  </li>
                </ul>

                <div className="pt-4 border-t mt-4">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Impact preview: Fairness score can improve from 61 to 86 after fixes
                  </p>
                  <div className="space-y-2">
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-destructive w-[61%]" />
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[86%]" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="h-full">
          <Card className="flex flex-col h-[600px] shadow-md border-primary/20">
            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Ask Bias Copilot
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
              <ScrollArea ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                          msg.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                            : 'bg-muted rounded-tl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%]">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-muted rounded-tl-sm flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t bg-card">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    placeholder="Ask the Bias Copilot anything..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!query.trim() || isTyping}>
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