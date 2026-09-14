import { loadLandUseDataset, loadPresetManifest } from "./data.js";
import { renderChart, setActiveCategory, SHAPES } from "./chart.js";
import { bindTooltip, countryReadout, countryTooltipHtml } from "./tooltip.js";
import { initExport } from "./export.js";

const DEFAULT_DATASET_ID = "top30";
const THEME_KEY = "petal-land-use-theme";
const SHAPE_KEY = "petal-land-use-shape";

const chartEl = document.querySelector("#chart");
const subtitleEl = document.querySelector("#chart-subtitle");
const tooltipEl = document.querySelector("#tooltip");
const readoutEl = document.querySelector("#readout");
const errorEl = document.querySelector("#error");
const themeBtn = document.querySelector("#theme-toggle");
const titleEl = document.querySelector("#chart-title");
const sourcesEl = document.querySelector("#sources");
const authorEl = document.querySelector("#author-line");
const presetControlsEl = document.querySelector("#preset-controls");
const shapeControlsEl = document.querySelector("#shape-controls");
const tooltip = bindTooltip(tooltipEl, readoutEl);

let presets = [];
let activePresetId = DEFAULT_DATASET_ID;
let activeCategory = null;
let activeShape = "petal";
let currentDataset = null;

function showError(message) {
  errorEl.hidden = false;
  errorEl.textContent = message;
}

function clearError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  themeBtn.textContent = next === "dark" ? "Light" : "Dark";
  themeBtn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* ignore */
  }
}

function initTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch {
    stored = null;
  }
  applyTheme(stored === "dark" || stored === "light" ? stored : "light");
  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

function updateShapeChipState() {
  shapeControlsEl.querySelectorAll("[data-shape]").forEach((btn) => {
    const on = btn.dataset.shape === activeShape;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function applyShape(shape) {
  const next = SHAPES.includes(shape) ? shape : "petal";
  activeShape = next;
  updateShapeChipState();
  chartEl.setAttribute(
    "aria-label",
    next === "square"
      ? "Square small-multiple chart of land use by country"
      : "Petal small-multiple chart of land use by country"
  );
  try {
    localStorage.setItem(SHAPE_KEY, next);
  } catch {
    /* ignore */
  }
  if (currentDataset) {
    renderChart(chartEl, currentDataset, activeShape);
    setActiveCategory(chartEl, activeCategory);
  }
}

function initShape() {
  let stored = null;
  try {
    stored = localStorage.getItem(SHAPE_KEY);
  } catch {
    stored = null;
  }
  activeShape = SHAPES.includes(stored) ? stored : "petal";
  updateShapeChipState();
  chartEl.setAttribute(
    "aria-label",
    activeShape === "square"
      ? "Square small-multiple chart of land use by country"
      : "Petal small-multiple chart of land use by country"
  );
  shapeControlsEl.addEventListener("click", (event) => {
    const btn = event.target.closest?.("[data-shape]");
    if (!btn || !shapeControlsEl.contains(btn)) return;
    const shape = btn.dataset.shape;
    if (!SHAPES.includes(shape) || shape === activeShape) return;
    applyShape(shape);
  });
}

function renderPresetChips() {
  presetControlsEl.replaceChildren();
  for (const preset of presets) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.dataset.presetId = preset.id;
    btn.textContent = preset.label || preset.id;
    btn.setAttribute("aria-pressed", preset.id === activePresetId ? "true" : "false");
    if (preset.id === activePresetId) btn.classList.add("is-active");
    btn.addEventListener("click", () => {
      if (preset.id === activePresetId) return;
      void loadPreset(preset.id);
    });
    presetControlsEl.append(btn);
  }
}

function updatePresetChipState() {
  presetControlsEl.querySelectorAll(".chip").forEach((btn) => {
    const on = btn.dataset.presetId === activePresetId;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function setSubtitleSelection(category) {
  subtitleEl.querySelectorAll(".cat-filter").forEach((btn) => {
    const on = Boolean(category) && btn.dataset.cat === category;
    btn.classList.toggle("is-selected", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
}

function setCategoryFilter(category) {
  activeCategory = activeCategory === category ? null : category;
  setActiveCategory(chartEl, activeCategory);
  setSubtitleSelection(activeCategory);
}

function bindSubtitleFilters() {
  subtitleEl.querySelectorAll(".cat-filter").forEach((btn) => {
    btn.addEventListener("click", () => setCategoryFilter(btn.dataset.cat));
  });
}

function bindChartInteractions() {
  chartEl.addEventListener("pointerover", (event) => {
    const cell = event.target.closest?.(".country-cell");
    if (!cell || !chartEl.contains(cell)) return;
    cell.classList.add("is-hover");
    const payload = cell._payload;
    if (!payload) return;
    tooltip.show(countryTooltipHtml(payload), event.clientX, event.clientY);
    tooltip.setReadout(countryReadout(payload));
  });

  chartEl.addEventListener("pointermove", (event) => {
    const cell = event.target.closest?.(".country-cell");
    if (!cell || !chartEl.contains(cell) || !cell._payload) return;
    tooltip.show(countryTooltipHtml(cell._payload), event.clientX, event.clientY);
  });

  chartEl.addEventListener("pointerout", (event) => {
    const cell = event.target.closest?.(".country-cell");
    if (!cell || !chartEl.contains(cell)) return;
    const next = event.relatedTarget?.closest?.(".country-cell");
    if (next === cell) return;
    cell.classList.remove("is-hover");
    tooltip.hide();
  });

  chartEl.addEventListener("focusin", (event) => {
    const cell = event.target.closest?.(".country-cell");
    if (!cell?._payload) return;
    tooltip.setReadout(countryReadout(cell._payload));
  });
}

async function loadPreset(id) {
  const preset = presets.find((p) => p.id === id) || presets[0];
  if (!preset) {
    showError("No presets available.");
    return;
  }
  clearError();
  try {
    const dataset = await loadLandUseDataset(preset);
    currentDataset = dataset;
    activePresetId = preset.id;
    activeCategory = null;
    titleEl.textContent = preset.title || "How countries use their land";
    sourcesEl.innerHTML = preset.sources || "";
    if (preset.author) authorEl.innerHTML = preset.author;
    renderChart(chartEl, dataset, activeShape);
    setSubtitleSelection(null);
    updatePresetChipState();
    tooltip.hide();
    tooltip.setReadout("");
  } catch (err) {
    console.error(err);
    showError(err?.message || "Failed to load dataset.");
  }
}

async function boot() {
  initTheme();
  initShape();
  initExport();
  bindSubtitleFilters();
  bindChartInteractions();
  try {
    presets = await loadPresetManifest();
    renderPresetChips();
    const start =
      presets.find((p) => p.id === DEFAULT_DATASET_ID)?.id || presets[0]?.id;
    await loadPreset(start);
  } catch (err) {
    console.error(err);
    showError(
      "Could not load chart data. Serve the repo over HTTP from the project root (python -m http.server 8080)."
    );
  }
}

void boot();
