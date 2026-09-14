"""Read and reshape OECD land-use tables.

Building blocks for the notebook:

  load_oecd_land_use   — read the long CSV
  get_top_country_names    — largest countries by land area (ISO-3 only)
  land_use_long_to_wide — long OECD rows → one wide row per country
"""

from __future__ import annotations

from pathlib import Path
from typing import Mapping, Sequence

import pandas as pd

# Defaults; the notebook usually passes its own `CATEGORIES` into the wide step.
CATEGORIES: tuple[str, ...] = ("ARABLE", "FOREST", "MEAD", "OTHER")

# OECD renamed cropland from ARABLE → CROP; keep the chart's ARABLE label.
MEASURE_ALIASES: dict[str, str] = {"CROP": "ARABLE"}

# Shorter subplot titles for a few long OECD labels.
COUNTRY_NAME_REPLACEMENTS: dict[str, str] = {
    "China (People’s Republic of)": "China",
    "Democratic Republic of the Congo": "Congo",
    "Central African Republic": "Centrafrique",
}


def load_oecd_land_use(path: str | Path) -> pd.DataFrame:
    """Read an OECD land-use CSV (csvfilewithlabels / Kaggle-style dump)."""
    return pd.read_csv(path, encoding="utf-8")


def is_country_code(ref_area: str) -> bool:
    """True for ISO 3166-1 alpha-3 codes; false for OECD aggregates."""
    return bool(ref_area) and len(ref_area) == 3 and ref_area.isalpha()


def get_top_country_names(
    df: pd.DataFrame,
    *,
    year: int,
    n: int,
    measure: str = "LAND",
    unit: str = "KM2",
) -> list[str]:
    """Largest `n` countries by `measure` area in `year`, largest first.

    Drops OECD region aggregates (`REF_AREA` must be a 3-letter country code).
    """
    land = df[
        (df["MEASURE"] == measure)
        & (df["TIME_PERIOD"] == year)
        & (df["UNIT_MEASURE"] == unit)
        & df["REF_AREA"].map(is_country_code)
    ]
    return land.nlargest(n, "OBS_VALUE")["Reference area"].tolist()


def land_use_long_to_wide(
    df: pd.DataFrame,
    *,
    countries: Sequence[str],
    year: int,
    categories: Sequence[str] = CATEGORIES,
    measure_aliases: Mapping[str, str] = MEASURE_ALIASES,
    name_replacements: Mapping[str, str] = COUNTRY_NAME_REPLACEMENTS,
) -> pd.DataFrame:
    """Pivot long OECD rows into one wide row per country.

    Percent columns use `PT_LAR`; `*_KM` / `AREA_KM` use square kilometres.
    Missing cells become 0. `rank` is 1-based order from `countries`.
    """
    measures = list(categories) + ["AREA"]
    raw_measures = set(measures) | set(measure_aliases)

    filtered = df[
        df["Reference area"].isin(countries)
        & df["MEASURE"].isin(raw_measures)
        & (df["TIME_PERIOD"] == year)
    ].copy()
    filtered["MEASURE"] = filtered["MEASURE"].replace(dict(measure_aliases))

    rows: list[dict[str, float | str | int]] = []
    for rank, country in enumerate(countries, start=1):
        slice_ = filtered[filtered["Reference area"] == country]
        row: dict[str, float | str | int] = {
            "rank": rank,
            "Reference area": name_replacements.get(country, country),
        }
        for measure in measures:
            block = slice_[slice_["MEASURE"] == measure]
            pct = block.loc[block["UNIT_MEASURE"] == "PT_LAR", "OBS_VALUE"]
            km = block.loc[block["UNIT_MEASURE"] == "KM2", "OBS_VALUE"]
            if measure == "AREA":
                row["AREA_KM"] = float(km.iloc[0]) if len(km) else 0.0
                continue
            row[measure] = float(pct.iloc[0]) if len(pct) else 0.0
            row[f"{measure}_KM"] = float(km.iloc[0]) if len(km) else 0.0
        rows.append(row)

    wide_columns = (
        ["rank", "Reference area"]
        + list(categories)
        + [f"{c}_KM" for c in categories]
        + ["AREA_KM"]
    )
    return pd.DataFrame(rows).reindex(columns=wide_columns).fillna(0.0)
