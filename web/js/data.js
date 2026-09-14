/** Load preset meta + OECD wide land-use JSON. */

const PRESET_MANIFEST_URL = "../data/presets.meta.json";

export async function loadPresetManifest() {
  const res = await fetch(PRESET_MANIFEST_URL);
  if (!res.ok) throw new Error(`Could not load presets (${res.status})`);
  const meta = await res.json();
  if (!Array.isArray(meta.datasets) || !meta.datasets.length) {
    throw new Error("presets.meta.json has no datasets");
  }
  return meta.datasets;
}

export async function loadLandUseDataset(preset) {
  const res = await fetch(preset.url);
  if (!res.ok) throw new Error(`Could not load ${preset.url} (${res.status})`);
  const payload = await res.json();
  const countries = Array.isArray(payload.countries) ? payload.countries : [];
  const limit = Number(preset.limit) || countries.length;
  return {
    year: payload.year ?? 2021,
    categories: payload.categories,
    categoryLabels: payload.categoryLabels || {},
    countries: countries
      .slice()
      .sort((a, b) => Number(a.rank) - Number(b.rank))
      .slice(0, limit),
  };
}
