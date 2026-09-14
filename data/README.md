# Data

## `land_use_top50.json`

Wide table used by the web app: top 50 countries by land area for 2021, with OECD percent + km² columns for ARABLE / FOREST / MEAD / OTHER (plus `AREA_KM`). Built from `oecd_land_use_2021.csv` with the same reshape as `notebooks/petal_chart/data.py`. Preset chips in `presets.meta.json` slice this file to Top 30 or Top 50.

## `oecd_land_use_2021.csv`

OECD Environment Database product **"Land use"** (FAOSTAT is the primary source OECD cites). This file is a **2021** slice downloaded via the OECD SDMX API (`format=csvfilewithlabels`).

### Sources

| Link | Notes |
|------|--------|
| [OECD Data Explorer – Land use](https://data-explorer.oecd.org/vis?lc=en&df[ds]=DisseminateFinalDMZ&df[id]=DSD_LAND_USE@DF_LAND_USE&df[ag]=OECD.ENV.EPI) | Current UI |
| [stats.oecd.org – LAND_USE](https://stats.oecd.org/Index.aspx?DataSetCode=LAND_USE) | Legacy UI |
| [FAOSTAT land use](https://www.fao.org/faostat/en/#data/RL) | Upstream |
| [Country metadata (PDF)](http://stats.oecd.org/wbos/fileview2.aspx?IDFile=abe6cd0d-9a74-442c-9818-a57322fa6c9b) | OECD country notes |

SDMX: agency `OECD.ENV.EPI`, dataflow `DSD_LAND_USE@DF_LAND_USE`.

Example pull (full year filter):

```text
https://sdmx.oecd.org/public/rest/data/OECD.ENV.EPI,DSD_LAND_USE@DF_LAND_USE/all
  ?startPeriod=2021&endPeriod=2021
  &dimensionAtObservation=AllDimensions
  &format=csvfilewithlabels
```

### Columns used by the notebook

| Column | Role |
|--------|------|
| `REF_AREA` / `Reference area` | ISO-3 country vs OECD aggregates |
| `MEASURE` | `LAND`, `AREA`, `CROP`/`ARABLE`, `FOREST`, `MEAD`, `OTHER`, … |
| `UNIT_MEASURE` | `KM2` or `PT_LAR` (% of land area) |
| `TIME_PERIOD` | Year |
| `OBS_VALUE` | Observation |

OECD now often labels cropland as `CROP`; the notebook maps that to **`ARABLE`** for the chart caption.

### Measure definitions (OECD)

Land resources are one of the four components of the natural environment: water, air, land and living resources. Land is both a physical milieu for vegetation and a resource for human activities.

- **Land area** — excludes inland water bodies (major rivers and lakes).
- **Arable** — land generally under rotation (temporary crops, meadows, or fallow &lt; five years). Not “potentially cultivable” land.
- **Permanent crops** — long-period crops without yearly replanting (e.g. cocoa, coffee, rubber, vines, fruit trees; forest-tree nurseries excluded).
- **Arable and permanent crop land** — sum of arable + permanent crops (`CROP` / chart `ARABLE`).
- **Permanent meadows and pastures (`MEAD`)** — forage five years or more, cultivated or wild.
- **Forest** — &gt; 0.5 ha with canopy cover &gt; 10% (or trees able to reach that in situ), including land to be reforested; excluding woodland under agricultural or urban use.
- **Other areas** — built-up land, wet/dry open land; inland water excluded.

Definitions may vary by country. Material remains subject to [OECD](https://www.oecd.org/en/about/terms-conditions.html) / FAO terms of use.
