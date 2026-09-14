# How countries use their land

[![Website](https://img.shields.io/badge/Website-local-22863a?style=flat-square)](https://witold1.github.io/petal-land-use-chart/web/)
[![Jupyter Notebook](https://img.shields.io/badge/Jupyter--Notebook-live-22863a?style=flat-square)](https://nbviewer.org/github/Witold1/petal-land-use-chart/blob/main/notebooks/petal-type-chart-land-use-by-country.ipynb)
<br>
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=222)<br>
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat-square&logo=python&logoColor=white)
![pandas](https://img.shields.io/badge/Prep-pandas%20%2B%20matplotlib-150458?style=flat-square&logo=pandas&logoColor=white)
![html-to-image](https://img.shields.io/badge/Export-html--to--image-4A90D9?style=flat-square)<br>
![Status](https://img.shields.io/badge/Status-public--beta-orange?style=flat-square)
![AI Assistance](https://img.shields.io/badge/AI--Assistance-high-informational?style=flat-square)

## Preview

<p align="center">
  <img src="preview.jpg" width="500" alt="How countries use their land. 30 biggest countries overview. OECD Land use dataset">
</p>

Small-multiple petal chart of how the largest countries split land across **arable (cropland)**, **forest**, **meadows and pastures**, and **other**. Petal length is each category’s share of those four OECD percentages (renormalized to sum to 1).

Two implementations live in this repo:

- **Python** (`notebooks/`) — matplotlib poster via the `petal_chart` package
- **Interactive web tool** (`web/`) — browser version on the same stack as [petal-land-use-chart](https://github.com/Witold1/petal-land-use-chart) (vanilla ES modules, theme, presets, SVG/PNG export)

## Description

### 1. Chart

| Element | Meaning |
|---------|---------|
| Cell | One country (rank by total land area) |
| Four petals | ARABLE / FOREST / MEAD / OTHER |
| Petal length | Category share among the four OECD % values |
| Rings | 10% / 25% / 50% guides |
| Subtitle under name | Largest category + absolute km² |

Hover a country for the breakdown; click a colored category in the subtitle to highlight that petal across all flowers.

### 2. Controls

- **Theme** — light (notebook cream) / dark (remembered in `localStorage`)
- **Presets** — Top 30 / Top 50 (from `data/presets.meta.json`)
- **Export** — download SVG or PNG poster via `html-to-image` (CDN)

## Data

| Path | Contents |
|------|----------|
| `data/oecd_land_use_2021.csv` | OECD long-format land-use dump (source for the notebook) |
| `data/land_use_top50.json` | Wide table for the web app (top 50 countries) |
| `data/presets.meta.json` | Top 30 / Top 50 preset labels and captions |

See [`data/README.md`](data/README.md) for OECD measure definitions and retrieval notes.

## Run locally

JSON under `data/` is loaded over HTTP — open via a local server from the **repo root** (not as a raw `file://` page):

```powershell
python -m http.server 8080
```

Then open `http://localhost:8080/` (root `index.html` redirects to `web/`).

No bundler or package manager for the web app: ES modules and `fetch` for presets need HTTP.

### Python notebook / package

```powershell
uv sync
```

Open [`notebooks/petal-type-chart-land-use-by-country.ipynb`](notebooks/petal-type-chart-land-use-by-country.ipynb). It uses `notebooks/petal_chart/` (`load_oecd_land_use`, `land_use_long_to_wide`, `prepare_canvas`, `plot_petal`) and writes PNG under `notebooks/artifacts/`.

## Repository layout

```text
.
├── notebooks/              # Python version (refactored)
│   ├── petal-type-chart-land-use-by-country.ipynb
│   ├── petal_chart/        # matplotlib module
│   │   ├── data.py
│   │   └── plot.py
│   └── artifacts/          # Saved PNG charts
├── web/                    # Browser app
│   ├── index.html
│   ├── css/
│   │   ├── tokens.css
│   │   ├── layout.css
│   │   └── export.css
│   └── js/
│       ├── app.js
│       ├── data.js
│       ├── colors.js
│       ├── chart.js
│       ├── tooltip.js
│       └── export.js
├── index.html              # Redirects root/ -> root/web/
└── data/                   # Shared datasets
    ├── presets.meta.json
    ├── land_use_top50.json
    └── oecd_land_use_2021.csv
```

## License & credit

| Part | License |
|------|---------|
| Code (`web/`, `notebooks/`) | [MIT](LICENSE) |
| Prepared tables under `data/` | [CC BY-SA 4.0](LICENSE-DATA) — OECD/FAO source terms still apply |

_Made with AI. Curated by Human._
