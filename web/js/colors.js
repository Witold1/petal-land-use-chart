/** Category colors + share math for the petal chart. */

export const CATEGORIES = ["ARABLE", "FOREST", "MEAD", "OTHER"];

export const CATEGORY_LABELS = {
  ARABLE: "Arable and cropland",
  FOREST: "Forest",
  MEAD: "Meadows and pastures",
  OTHER: "Other",
};

export const PETAL_COLORS = {
  ARABLE: "var(--petal-arable)",
  FOREST: "var(--petal-forest)",
  MEAD: "var(--petal-mead)",
  OTHER: "var(--petal-other)",
};

/** Mid-angles of equal sectors (matches notebook / matplotlib). */
export function petalAngle(index, n = CATEGORIES.length) {
  return (360 / (n * 2)) * (index * 2 + 1);
}

/** Category percents → shares that sum to 1. */
export function petalShares(row, categories = CATEGORIES) {
  const values = categories.map((c) => Number(row[c]) / 100 || 0);
  const total = values.reduce((sum, v) => sum + v, 0);
  if (total === 0) return Object.fromEntries(categories.map((c) => [c, 0]));
  return Object.fromEntries(categories.map((c, i) => [c, values[i] / total]));
}

export function maxCategory(shares) {
  let best = CATEGORIES[0];
  let bestVal = -1;
  for (const cat of CATEGORIES) {
    const v = shares[cat] ?? 0;
    if (v > bestVal) {
      best = cat;
      bestVal = v;
    }
  }
  return best;
}

export function formatKmMillions(km) {
  const m = Number(km) / 1e6;
  if (!Number.isFinite(m)) return "0";
  return `${Math.round(m * 10) / 10}M KM²`;
}
