import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Lightbulb, X, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const insightsMap: Record<string, string[]> = {
  "/": [
    "High structural bias detected in the current model. Female applicants are disproportionately rejected.",
    "The Disparate Impact Ratio is 0.65, well below the 0.80 compliance threshold.",
    "Use the Simulator to see how changing gender flips decisions on identical profiles."
  ],
  "/simulator": [
    "This simulates the live model. Notice how Income and Employment strongly influence the score.",
    "Toggle the gender on Profile B. If the decision changes, you've proved direct bias.",
    "The 70% approval threshold is strict; lowering it might increase fairness but hurt accuracy."
  ],
  "/analyzer": [
    "The heatmap reveals age intersectionality: Older females face the highest rejection rates.",
    "Watch the correlation grid: Income is acting as a proxy variable for Gender.",
    "Use the Scenario Playground to find the optimal trade-off between fairness and accuracy."
  ],
  "/report": [
    "Debiasing improved the Fairness Score by 26 points with only a 2% accuracy drop.",
    "Reliance on Gender and Age dropped significantly in the feature importance chart.",
    "The model is now compliant with the 80% rule for Disparate Impact."
  ]
};

export function InsightCoach() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Default to dashboard insights if route not matched
  const insights = insightsMap[location] || insightsMap["/"];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-xl border-2 border-background"
        >
          <Lightbulb className="h-6 w-6" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-full border-2 border-background animate-pulse" />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={16} className="w-80 p-0 overflow-hidden shadow-2xl border-primary/20">
        <div className="bg-primary/10 px-4 py-3 flex justify-between items-center border-b border-primary/10">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Lightbulb className="h-4 w-4 text-amber-500 fill-amber-500" />
            AI Insight Coach
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 bg-card space-y-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contextual Insights</p>
          <ul className="space-y-3">
            {insights.map((insight, idx) => (
              <motion.li 
                key={idx}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-2 text-sm"
              >
                <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">{insight}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
