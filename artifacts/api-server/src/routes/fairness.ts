import { Router, type IRouter, type Request, type Response } from "express";
import express from "express";
import { analyzeCSV } from "../lib/fairness";

const router: IRouter = Router();

// Accept large raw text bodies (CSV) and JSON payloads
router.use(express.text({ type: ["text/csv", "text/plain"], limit: "10mb" }));
router.use(express.json({ limit: "10mb" }));

router.post("/fairness/analyze", (req: Request, res: Response) => {
  let csv: string | undefined;

  if (typeof req.body === "string") {
    csv = req.body;
  } else if (req.body && typeof req.body === "object") {
    if (typeof (req.body as { csv?: unknown }).csv === "string") {
      csv = (req.body as { csv: string }).csv;
    }
  }

  if (!csv || csv.trim().length === 0) {
    return res.status(400).json({
      error:
        "Missing CSV payload. POST CSV as text/csv body or JSON { csv: '...' }.",
    });
  }

  try {
    const report = analyzeCSV(csv);
    return res.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: `Failed to analyze CSV: ${message}` });
  }
});

router.get("/fairness/healthz", (_req, res) => {
  res.json({ status: "ok", module: "fairness" });
});

export default router;
