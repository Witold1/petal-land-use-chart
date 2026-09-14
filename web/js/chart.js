/** SVG petal/square small-multiples (petal geometry mirrors notebooks/petal_chart/plot.py). */

import {
  CATEGORIES,
  CATEGORY_LABELS,
  formatKmMillions,
  maxCategory,
  petalAngle,
  petalShares,
} from "./colors.js";

const NS = "http://www.w3.org/2000/svg";
const VIEW = 10;
const CENTER = VIEW / 2;
/** SVG user units — must stay an attribute so export scales with the viewBox. */
const GRID_LABEL_SIZE = 0.60;

export const SHAPES = ["petal", "square"];

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) el.setAttribute(key, String(value));
  }
  return el;
}

/** Ellipse petal from center along `angle` degrees (y-up math coords). */
function petalEllipse(length, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const endX = CENTER + length * Math.cos(rad);
  const endY = CENTER + length * Math.sin(rad);
  const cx = (CENTER + endX) / 2;
  const cy = (CENTER + endY) / 2;
  const rx = length / 2;
  const ry = length / 4;
  return svgEl("ellipse", {
    class: "petal",
    cx,
    cy,
    rx,
    ry,
    transform: `rotate(${angleDeg} ${cx} ${cy})`,
  });
}

/** Axis-aligned square in the quadrant of `angleDeg`; side = length (same reach as petal tip). */
function petalSquare(length, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const side = length;
  const x = Math.cos(rad) >= 0 ? CENTER : CENTER - side;
  const y = Math.sin(rad) >= 0 ? CENTER : CENTER - side;
  return svgEl("rect", {
    class: "petal",
    x,
    y,
    width: side,
    height: side,
  });
}

function shapeGlyph(shape, length, angleDeg) {
  return shape === "square"
    ? petalSquare(length, angleDeg)
    : petalEllipse(length, angleDeg);
}

function drawCanvas(svg) {
  const rings = [
    [5, "r50"],
    [2.5, "r25"],
    [1, "r10"],
  ];
  for (const [r, cls] of rings) {
    svg.append(
      svgEl("circle", {
        class: `grid-ring ${cls}`,
        cx: CENTER,
        cy: CENTER,
        r,
      })
    );
  }
  svg.append(
    svgEl("line", {
      class: "grid-axis",
      x1: CENTER,
      y1: 0.2,
      x2: CENTER,
      y2: VIEW - 0.2,
    }),
    svgEl("line", {
      class: "grid-axis",
      x1: 0.2,
      y1: CENTER,
      x2: VIEW - 0.2,
      y2: CENTER,
    })
  );

  // Labels sit in screen space (y-down), so place them outside the flipped group.
}

function labelLayer() {
  const g = svgEl("g", { class: "grid-labels" });
  // font-size in viewBox user units so labels scale with the SVG (screen + export).
  const labels = [
    { text: "50%", x: 0.8, y: 1.7, cls: "l50", rot: -45 },
    { text: "25%", x: 2.6, y: 3.5, cls: "l25", rot: -45 },
    { text: "10%", x: 3.7, y: 4.6, cls: "l10", rot: -45 },
  ];
  for (const { text, x, y, cls, rot } of labels) {
    const t = svgEl("text", {
      class: `grid-label ${cls}`,
      x,
      y,
      "font-size": GRID_LABEL_SIZE,
      transform: `rotate(${rot} ${x} ${y})`,
    });
    t.textContent = text;
    g.append(t);
  }
  return g;
}

function countryCard(row, labels, shape) {
  const shares = petalShares(row);
  const maxCat = maxCategory(shares);
  const maxLabel = labels[maxCat] || CATEGORY_LABELS[maxCat] || maxCat;
  const maxKm = row[`${maxCat}_KM`] ?? 0;
  const shapeName = shape === "square" ? "squares" : "petals";

  const cell = document.createElement("article");
  cell.className = "country-cell";
  cell.dataset.rank = String(row.rank);
  cell.tabIndex = 0;

  const head = document.createElement("div");
  head.className = "country-head";
  const title = document.createElement("h2");
  title.className = "country-title";
  title.textContent = `${row.rank}. ${row["Reference area"]}`;
  const maxLine = document.createElement("p");
  maxLine.className = "country-max";
  maxLine.textContent = `${maxCat} (${formatKmMillions(maxKm)})`;
  head.append(title, maxLine);

  const svg = svgEl("svg", {
    class: "country-svg",
    viewBox: `0 0 ${VIEW} ${VIEW}`,
    role: "img",
    "aria-label": `${row["Reference area"]} land-use ${shapeName}`,
  });

  const world = svgEl("g", {
    transform: `translate(0 ${VIEW}) scale(1 -1)`,
  });
  drawCanvas(world);

  CATEGORIES.forEach((cat, i) => {
    const length = (shares[cat] || 0) * 10;
    if (length <= 0) return;
    const petal = shapeGlyph(shape, length, petalAngle(i));
    petal.dataset.cat = cat;
    petal.dataset.share = String(shares[cat]);
    petal.dataset.pct = String(row[cat] ?? 0);
    petal.dataset.km = String(row[`${cat}_KM`] ?? 0);
    world.append(petal);
  });

  svg.append(world, labelLayer());
  cell.append(head, svg);

  cell._payload = {
    row,
    shares,
    maxCat,
    maxLabel,
    labels,
  };
  return cell;
}

export function renderChart(root, dataset, shape = "petal") {
  const labels = { ...CATEGORY_LABELS, ...(dataset.categoryLabels || {}) };
  const mode = SHAPES.includes(shape) ? shape : "petal";
  root.replaceChildren();
  root.classList.remove("is-filtered");
  root.dataset.shape = mode;
  for (const row of dataset.countries) {
    root.append(countryCard(row, labels, mode));
  }
}

export function setActiveCategory(root, category) {
  const petals = root.querySelectorAll(".petal");
  if (!category) {
    root.classList.remove("is-filtered");
    petals.forEach((p) => p.classList.remove("is-active"));
    return;
  }
  root.classList.add("is-filtered");
  petals.forEach((p) => {
    p.classList.toggle("is-active", p.dataset.cat === category);
  });
}
