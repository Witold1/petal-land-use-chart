import { CATEGORIES, CATEGORY_LABELS, formatKmMillions } from "./colors.js";

/** Pointer tooltip + a text readout for keyboard / screen readers. */

export function bindTooltip(tooltipEl, readoutEl) {
  function hide() {
    tooltipEl.hidden = true;
    tooltipEl.innerHTML = "";
  }

  function show(html, clientX, clientY) {
    tooltipEl.hidden = false;
    tooltipEl.innerHTML = html;
    const pad = 12;
    const { innerWidth, innerHeight } = window;
    const rect = tooltipEl.getBoundingClientRect();
    let left = clientX + pad;
    let top = clientY + pad;
    if (left + rect.width > innerWidth - 8) left = clientX - rect.width - pad;
    if (top + rect.height > innerHeight - 8) top = clientY - rect.height - pad;
    tooltipEl.style.left = `${Math.max(8, left)}px`;
    tooltipEl.style.top = `${Math.max(8, top)}px`;
  }

  function setReadout(text) {
    readoutEl.textContent = text;
  }

  return { show, hide, setReadout };
}

function pct(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export function countryTooltipHtml(payload) {
  const { row, labels } = payload;
  const name = row["Reference area"];
  const rows = CATEGORIES.map((cat) => {
    const label = labels?.[cat] || CATEGORY_LABELS[cat] || cat;
    return (
      `<div class="tip-row">` +
      `<span class="tip-swatch" data-cat="${cat}"></span>` +
      `<span>${label}: ${pct(row[cat])} (${formatKmMillions(row[`${cat}_KM`])})</span>` +
      `</div>`
    );
  }).join("");
  return (
    `<strong>${row.rank}. ${name}</strong>` +
    `<div>Land area ${formatKmMillions(row.AREA_KM)}</div>` +
    rows
  );
}

export function countryReadout(payload) {
  if (!payload) return "";
  const { row, maxCat, labels } = payload;
  const label = labels?.[maxCat] || CATEGORY_LABELS[maxCat] || maxCat;
  return `${row.rank}. ${row["Reference area"]} — largest share: ${label} (${pct(row[maxCat])})`;
}
