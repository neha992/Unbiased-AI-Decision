// Backend fairness analysis module for loan approval datasets.
// Pure functions — no I/O. Input is a CSV string; output is a structured
// fairness report with metrics, verdict, and improvement suggestions.

export type Row = Record<string, string | number>;

export type DatasetValidation = {
  rowCount: number;
  columnCount: number;
  columns: string[];
  missingCells: number;
  invalidRows: number;
  warnings: string[];
};

export type GroupStats = {
  group: string;
  total: number;
  approved: number;
  approvalRate: number; // 0..1
};

export type FairnessMetrics = {
  groups: GroupStats[];
  favoredGroup: string | null;
  disadvantagedGroup: string | null;
  selectionRateDifference: number;       // |max - min| approval rate
  disparateImpactRatio: number;          // min / max approval rate
  statisticalParityDifference: number;   // signed: P(Y=1|A=fav) - P(Y=1|A=disadv)
};

export type FairnessFlags = {
  biased: boolean;          // DI < 0.8
  highlyBiased: boolean;    // |approval-rate diff| > 20%
  failedMetrics: string[];  // names of metrics that failed
};

export type FairnessReport = {
  validation: DatasetValidation;
  metrics: FairnessMetrics;
  flags: FairnessFlags;
  explanation: string;
  verdict: "Fair Model" | "Biased Model";
  suggestions: string[];
};

// ---------- CSV parsing ----------

export function parseCSV(text: string): { columns: string[]; rows: Row[] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { columns: [], rows: [] };

  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const columns = splitLine(lines[0]).map((c) =>
    c.toLowerCase().replace(/\s+/g, "_"),
  );
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const r: Row = {};
    columns.forEach((col, j) => {
      const raw = cells[j] ?? "";
      const num = Number(raw);
      r[col] =
        raw !== "" && !isNaN(num) && /^-?\d+(\.\d+)?$/.test(raw) ? num : raw;
    });
    rows.push(r);
  }
  return { columns, rows };
}

// ---------- Column detection ----------

function detectColumn(columns: string[], candidates: string[]): string | null {
  for (const cand of candidates) {
    const exact = columns.find((c) => c === cand);
    if (exact) return exact;
  }
  for (const cand of candidates) {
    const partial = columns.find((c) => c.includes(cand));
    if (partial) return partial;
  }
  return null;
}

function isApprovedValue(v: unknown): boolean {
  if (typeof v === "number") return v >= 1;
  const s = String(v).toLowerCase().trim();
  return (
    s === "yes" ||
    s === "true" ||
    s === "1" ||
    s === "approved" ||
    s === "y"
  );
}

function normalizeGender(v: unknown): string {
  const s = String(v).trim();
  if (!s) return "Unknown";
  const lower = s.toLowerCase();
  if (lower === "m" || lower === "male" || lower === "1") return "Male";
  if (lower === "f" || lower === "female" || lower === "0") return "Female";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ---------- Validation ----------

export function validateDataset(
  columns: string[],
  rows: Row[],
): DatasetValidation {
  let missing = 0;
  let invalid = 0;
  const warnings: string[] = [];

  for (const r of rows) {
    let rowHadInvalid = false;
    for (const c of columns) {
      const v = r[c];
      if (v === "" || v === null || v === undefined) {
        missing++;
        rowHadInvalid = true;
      } else if (typeof v === "number" && Number.isNaN(v)) {
        missing++;
        rowHadInvalid = true;
      }
    }
    if (rowHadInvalid) invalid++;
  }

  const expected = ["gender", "approved"];
  for (const e of expected) {
    if (!detectColumn(columns, [e])) {
      warnings.push(`Recommended column "${e}" not found in dataset.`);
    }
  }

  if (rows.length < 30) {
    warnings.push(
      `Sample size is small (${rows.length} rows). Fairness metrics may be unreliable.`,
    );
  }

  return {
    rowCount: rows.length,
    columnCount: columns.length,
    columns,
    missingCells: missing,
    invalidRows: invalid,
    warnings,
  };
}

// ---------- Metrics ----------

export function computeFairnessMetrics(
  rows: Row[],
  columns: string[],
): FairnessMetrics {
  const genderCol = detectColumn(columns, ["gender", "sex"]);
  const approvedCol = detectColumn(columns, [
    "approved",
    "approval",
    "label",
    "target",
    "outcome",
    "loan_status",
    "decision",
  ]);

  if (!genderCol || !approvedCol) {
    return {
      groups: [],
      favoredGroup: null,
      disadvantagedGroup: null,
      selectionRateDifference: 0,
      disparateImpactRatio: 1,
      statisticalParityDifference: 0,
    };
  }

  const buckets = new Map<string, { approved: number; total: number }>();
  for (const r of rows) {
    const g = normalizeGender(r[genderCol]);
    if (!buckets.has(g)) buckets.set(g, { approved: 0, total: 0 });
    const b = buckets.get(g)!;
    b.total += 1;
    if (isApprovedValue(r[approvedCol])) b.approved += 1;
  }

  const groups: GroupStats[] = Array.from(buckets.entries())
    .map(([group, v]) => ({
      group,
      total: v.total,
      approved: v.approved,
      approvalRate: v.total === 0 ? 0 : v.approved / v.total,
    }))
    .sort((a, b) => b.approvalRate - a.approvalRate);

  if (groups.length < 2) {
    return {
      groups,
      favoredGroup: groups[0]?.group ?? null,
      disadvantagedGroup: null,
      selectionRateDifference: 0,
      disparateImpactRatio: 1,
      statisticalParityDifference: 0,
    };
  }

  const favored = groups[0];
  const disadvantaged = groups[groups.length - 1];
  const selectionRateDifference = favored.approvalRate - disadvantaged.approvalRate;
  const disparateImpactRatio =
    favored.approvalRate === 0
      ? 1
      : disadvantaged.approvalRate / favored.approvalRate;
  const statisticalParityDifference =
    favored.approvalRate - disadvantaged.approvalRate;

  return {
    groups,
    favoredGroup: favored.group,
    disadvantagedGroup: disadvantaged.group,
    selectionRateDifference: round(selectionRateDifference, 4),
    disparateImpactRatio: round(disparateImpactRatio, 4),
    statisticalParityDifference: round(statisticalParityDifference, 4),
  };
}

// ---------- Rules / verdict ----------

export function applyFairnessRules(metrics: FairnessMetrics): FairnessFlags {
  const failedMetrics: string[] = [];
  const biased = metrics.disparateImpactRatio < 0.8;
  const highlyBiased = metrics.selectionRateDifference > 0.2;

  if (biased) failedMetrics.push("Disparate Impact Ratio (< 0.8)");
  if (highlyBiased)
    failedMetrics.push("Selection Rate Difference (> 20%)");
  if (Math.abs(metrics.statisticalParityDifference) > 0.1)
    failedMetrics.push("Statistical Parity Difference (> 0.1)");

  return { biased, highlyBiased, failedMetrics };
}

function buildExplanation(
  metrics: FairnessMetrics,
  flags: FairnessFlags,
): string {
  if (!metrics.favoredGroup || !metrics.disadvantagedGroup) {
    return "Could not compute fairness metrics — dataset is missing the gender or approval column, or contains only one group.";
  }
  const fav = metrics.groups.find((g) => g.group === metrics.favoredGroup)!;
  const dis = metrics.groups.find(
    (g) => g.group === metrics.disadvantagedGroup,
  )!;

  const diffPct = (metrics.selectionRateDifference * 100).toFixed(1);
  const di = metrics.disparateImpactRatio.toFixed(2);
  const intensity = flags.highlyBiased
    ? "a very large gap"
    : flags.biased
      ? "a meaningful gap"
      : "a small gap";

  const failedLine =
    flags.failedMetrics.length > 0
      ? ` Failed checks: ${flags.failedMetrics.join("; ")}.`
      : " All fairness checks passed.";

  return (
    `Group "${fav.group}" is favored with an approval rate of ${(fav.approvalRate * 100).toFixed(1)}% ` +
    `(${fav.approved}/${fav.total}), while group "${dis.group}" was approved at ${(dis.approvalRate * 100).toFixed(1)}% ` +
    `(${dis.approved}/${dis.total}). That is ${intensity} of ${diffPct} percentage points, ` +
    `a Disparate Impact Ratio of ${di}, and a Statistical Parity Difference of ${metrics.statisticalParityDifference.toFixed(2)}.` +
    failedLine
  );
}

function buildSuggestions(flags: FairnessFlags): string[] {
  if (!flags.biased && !flags.highlyBiased) {
    return [
      "Continue monitoring fairness metrics on new cohorts to catch drift.",
      "Document the fairness review for compliance and audit trails.",
    ];
  }
  return [
    "Remove the sensitive attribute (gender) from training features.",
    "Audit other features for proxy correlation with gender (e.g., income, zipcode).",
    "Rebalance the training set so each group is represented proportionally.",
    "Apply fairness-aware ML techniques (reweighing, adversarial debiasing, equalized odds post-processing).",
    "Re-evaluate the model after mitigation and compare metrics before vs. after.",
  ];
}

export function analyzeCSV(csvText: string): FairnessReport {
  const { columns, rows } = parseCSV(csvText);
  const validation = validateDataset(columns, rows);
  const metrics = computeFairnessMetrics(rows, columns);
  const flags = applyFairnessRules(metrics);
  const explanation = buildExplanation(metrics, flags);
  const suggestions = buildSuggestions(flags);
  const verdict: FairnessReport["verdict"] =
    flags.biased || flags.highlyBiased ? "Biased Model" : "Fair Model";

  return { validation, metrics, flags, explanation, verdict, suggestions };
}

function round(n: number, places: number): number {
  const f = Math.pow(10, places);
  return Math.round(n * f) / f;
}
