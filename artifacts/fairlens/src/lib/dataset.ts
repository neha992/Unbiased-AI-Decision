export type Row = Record<string, string | number>;

export type DatasetMeta = {
  name: string;
  rows: Row[];
  columns: string[];
  uploadedAt: number;
};

const STORAGE_KEY = "equify_dataset_v1";

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

  const columns = splitLine(lines[0]).map((c) => c.toLowerCase().replace(/\s+/g, "_"));
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const r: Row = {};
    columns.forEach((col, j) => {
      const raw = cells[j] ?? "";
      const num = Number(raw);
      r[col] = raw !== "" && !isNaN(num) && /^-?\d+(\.\d+)?$/.test(raw) ? num : raw;
    });
    rows.push(r);
  }
  return { columns, rows };
}

export function saveDataset(meta: DatasetMeta) {
  try {
    // Cap to 5000 rows to keep localStorage happy
    const slim = { ...meta, rows: meta.rows.slice(0, 5000) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    window.dispatchEvent(new Event("equify_dataset_updated"));
  } catch (e) {
    console.warn("Could not persist dataset", e);
  }
}

export function loadDataset(): DatasetMeta | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DatasetMeta;
  } catch {
    return null;
  }
}

export function clearDataset() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("equify_dataset_updated"));
}

// --- Detection helpers ---
export function detectColumn(columns: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    const found = columns.find((col) => col === c || col.includes(c));
    if (found) return found;
  }
  return null;
}

export function isApprovedValue(v: any): boolean {
  if (typeof v === "number") return v >= 1;
  const s = String(v).toLowerCase().trim();
  return s === "yes" || s === "true" || s === "1" || s === "approved" || s === "y";
}

// --- Metric computations ---
export type ComputedMetrics = {
  totalRows: number;
  missing: number;
  genderCol: string | null;
  ageCol: string | null;
  approvedCol: string | null;
  genderApproval: { name: string; approvalRate: number; count: number }[];
  heatmap: { gender: string; rates: number[]; sizes: number[] }[];
  ageGroups: string[];
  numericColumns: string[];
  correlations: number[][];
  featureNames: string[];
  fairnessScore: number;
  demographicParity: number;
  disparateImpact: number;
};

const AGE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: "18-25", min: 18, max: 25 },
  { label: "26-35", min: 26, max: 35 },
  { label: "36-50", min: 36, max: 50 },
  { label: "51+", min: 51, max: 200 },
];

export function computeMetrics(meta: DatasetMeta): ComputedMetrics {
  const { rows, columns } = meta;
  const genderCol = detectColumn(columns, ["gender", "sex"]);
  const ageCol = detectColumn(columns, ["age"]);
  const approvedCol = detectColumn(columns, ["approved", "approval", "label", "target", "outcome", "loan_status", "decision"]);

  let missing = 0;
  for (const r of rows) {
    for (const c of columns) {
      const v = r[c];
      if (v === "" || v === null || v === undefined || (typeof v === "number" && isNaN(v))) missing += 1;
    }
  }

  // Gender approval
  const genderApproval: { name: string; approvalRate: number; count: number }[] = [];
  if (genderCol && approvedCol) {
    const groups = new Map<string, { approved: number; total: number }>();
    for (const r of rows) {
      const g = String(r[genderCol]);
      if (!groups.has(g)) groups.set(g, { approved: 0, total: 0 });
      const grp = groups.get(g)!;
      grp.total += 1;
      if (isApprovedValue(r[approvedCol])) grp.approved += 1;
    }
    Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([name, v]) => {
        genderApproval.push({ name, approvalRate: Math.round((v.approved / v.total) * 100), count: v.total });
      });
  }

  // Heatmap gender x age
  const heatmap: { gender: string; rates: number[]; sizes: number[] }[] = [];
  if (genderCol && ageCol && approvedCol) {
    const genders = Array.from(new Set(rows.map((r) => String(r[genderCol])))).sort();
    for (const g of genders) {
      const rates: number[] = [];
      const sizes: number[] = [];
      for (const bucket of AGE_BUCKETS) {
        const subset = rows.filter((r) => {
          const age = Number(r[ageCol]);
          return String(r[genderCol]) === g && age >= bucket.min && age <= bucket.max;
        });
        const approvedCount = subset.filter((r) => isApprovedValue(r[approvedCol])).length;
        rates.push(subset.length > 0 ? Math.round((approvedCount / subset.length) * 100) : 0);
        sizes.push(subset.length);
      }
      heatmap.push({ gender: g, rates, sizes });
    }
  }

  // Numeric cols & correlations
  const numericColumns = columns.filter((c) => {
    const sample = rows.slice(0, 50).map((r) => r[c]);
    return sample.length > 0 && sample.every((v) => typeof v === "number");
  });

  // Build feature list: include gender (encoded) + numeric cols (skip approved label)
  const featureNames: string[] = [];
  const featureValues: number[][] = [];
  if (genderCol) {
    featureNames.push(genderCol);
    featureValues.push(rows.map((r) => (String(r[genderCol]).toLowerCase().startsWith("m") ? 0 : 1)));
  }
  for (const c of numericColumns) {
    if (approvedCol && c === approvedCol) continue;
    featureNames.push(c);
    featureValues.push(rows.map((r) => Number(r[c]) || 0));
  }

  const correlations: number[][] = featureNames.map((_, i) =>
    featureNames.map((_, j) => pearson(featureValues[i], featureValues[j]))
  );

  // Fairness metrics
  let demographicParity = 0;
  let disparateImpact = 1;
  if (genderApproval.length >= 2) {
    const sorted = [...genderApproval].sort((a, b) => b.approvalRate - a.approvalRate);
    demographicParity = (sorted[0].approvalRate - sorted[sorted.length - 1].approvalRate) / 100;
    disparateImpact = sorted[0].approvalRate === 0 ? 1 : sorted[sorted.length - 1].approvalRate / sorted[0].approvalRate;
  }

  // Fairness score: higher = more fair. Anchor: DI=1 -> 100, DI=0 -> 30
  const fairnessScore = Math.round(30 + 70 * Math.max(0, Math.min(1, disparateImpact)));

  return {
    totalRows: rows.length,
    missing,
    genderCol,
    ageCol,
    approvedCol,
    genderApproval,
    heatmap,
    ageGroups: AGE_BUCKETS.map((b) => b.label),
    numericColumns,
    correlations,
    featureNames,
    fairnessScore,
    demographicParity: Number(demographicParity.toFixed(2)),
    disparateImpact: Number(disparateImpact.toFixed(2)),
  };
}

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  let sx = 0,
    sy = 0;
  for (let i = 0; i < n; i++) {
    sx += x[i];
    sy += y[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx * dy);
  if (denom === 0) return 0;
  return Number((num / denom).toFixed(2));
}

// --- Built-in sample dataset (used as fallback) ---
export function buildSampleDataset(): DatasetMeta {
  const genders = ["Male", "Female"];
  const rows: Row[] = [];
  const rand = mulberry32(42);
  for (let i = 0; i < 1200; i++) {
    const gender = genders[rand() < 0.66 ? 0 : 1];
    const age = Math.floor(18 + rand() * 50);
    const income = Math.round(30000 + rand() * 130000);
    const credit = Math.round(550 + rand() * 300);
    const employment = Math.floor(rand() * 18);
    const dependents = Math.floor(rand() * 4);
    // Approval probability with built-in gender bias
    const score =
      0.000005 * income +
      0.005 * credit +
      0.06 * employment -
      0.05 * dependents -
      0.01 * age -
      4.4 +
      (gender === "Female" ? -0.9 : 0);
    const p = 1 / (1 + Math.exp(-score));
    const approved = rand() < p ? "Yes" : "No";
    rows.push({
      applicant_id: `A${String(i + 1).padStart(4, "0")}`,
      gender,
      age,
      income,
      credit_score: credit,
      employment_years: employment,
      dependents,
      approved,
    });
  }
  return {
    name: "sample_loan_data.csv",
    rows,
    columns: ["applicant_id", "gender", "age", "income", "credit_score", "employment_years", "dependents", "approved"],
    uploadedAt: Date.now(),
  };
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
