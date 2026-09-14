"""Petal-chart drawing helpers used by the notebook.

  prepare_canvas  — circular grid + subplot title on one axis
  plot_petal      — one ellipse petal
  petal_shares    — category percents → shares summing to 1

Colors, face color, and category order are defined in the notebook.
Figure title / subtitle / caption also live there via `highlight_text`.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Sequence

import matplotlib.patches as mpatches
import matplotlib.pyplot as plt
import pandas as pd
from matplotlib.offsetbox import AnchoredOffsetbox, TextArea, VPacker

from .data import CATEGORIES


def artifacts_dir() -> Path:
    """`notebooks/artifacts/` next to this package (created if missing)."""
    path = Path(__file__).resolve().parents[1] / "artifacts"
    path.mkdir(exist_ok=True)
    return path


def prepare_canvas(
    axis: plt.Axes,
    *,
    title: str,
    max_category: str,
    max_category_km: float,
    fontsize: float = 6,
) -> tuple[plt.Axes, tuple[float, float]]:
    """Circular grid, title, and max-category note on one subplot."""
    axis.set(xlim=(-0.1, 10.1), ylim=(-0.1, 10.1), aspect="equal")

    x_center = sum(axis.get_xlim()) / 2
    y_center = sum(axis.get_ylim()) / 2
    center = (x_center, y_center)

    for radius, alpha, label in (
        (5.0, 0.5, "grid-50"),
        (2.5, 0.3, "grid-25"),
        (1.0, 0.2, "grid-10"),
    ):
        axis.add_artist(
            mpatches.CirclePolygon(
                xy=center,
                radius=radius,
                resolution=60,
                edgecolor="black",
                facecolor="none",
                alpha=alpha,
                label=label,
                zorder=10,
            )
        )

    axis.margins(0.1)
    axis.grid(axis="x", alpha=0.20, c="gray", linestyle="--", zorder=0)
    axis.grid(axis="y", alpha=0.20, c="gray", linestyle="--", zorder=0)
    axis.set(xticklabels=[], yticklabels=[], xticks=[], yticks=[])
    axis.annotate(
        text="50%",
        xy=(0.8, 8.3),
        rotation=45,
        fontsize=fontsize,
        textcoords="data",
        c="black",
        alpha=0.5,
    )
    axis.annotate(
        text="25%",
        xy=(2.6, 6.5),
        rotation=45,
        fontsize=fontsize,
        textcoords="data",
        c="black",
        alpha=0.3,
    )
    axis.annotate(
        text="10%",
        xy=(3.7, 5.4),
        rotation=45,
        fontsize=fontsize,
        textcoords="data",
        c="black",
        alpha=0.2,
    )

    axis.axvline(x=x_center, alpha=0.20, c="black", lw=0.7, linestyle="--", zorder=0)
    axis.axhline(y=y_center, alpha=0.20, c="black", lw=0.7, linestyle="--", zorder=0)
    axis.spines[["left", "right", "bottom", "top"]].set_visible(False)

    # Bold country title + normal max-category line, left-aligned, tight gap.
    title_box = TextArea(
        title,
        textprops={"fontsize": fontsize, "fontweight": "bold", "ha": "left"},
    )
    subtitle_box = TextArea(
        f"{max_category} ({round(max_category_km / 10e5, 1)}M KM²)",
        textprops={"fontsize": fontsize, "fontweight": "normal", "ha": "left"},
    )
    pack = VPacker(children=[title_box, subtitle_box], align="left", pad=0, sep=1)
    axis.add_artist(
        AnchoredOffsetbox(
            loc="lower left",
            child=pack,
            pad=0,
            borderpad=0,
            frameon=False,
            bbox_to_anchor=(0.0, 1.0),
            bbox_transform=axis.transAxes,
        )
    )
    # Invisible title so tight_layout still reserves room above the axes.
    axis.set_title("\n\n", loc="left", fontsize=fontsize, pad=2)
    return axis, center


def plot_petal(
    canvas_center: Sequence[float],
    petal_length: float,
    angle: float,
    petal_color: str,
    axis: plt.Axes,
) -> None:
    """Draw one ellipse petal from `canvas_center` along `angle` (degrees)."""
    startx, starty = canvas_center
    # End coordinates follow the original notebook (sin on x-start, cos on y-start).
    endy = startx + petal_length * math.sin(math.radians(angle))
    endx = starty + petal_length * math.cos(math.radians(angle))

    petal = mpatches.Ellipse(
        xy=((startx + endx) / 2, (starty + endy) / 2),
        width=petal_length,
        height=petal_length / 2,
        angle=angle,
        facecolor=petal_color,
        alpha=0.5,
        zorder=10,
        clip_on=False,
    )
    axis.add_artist(petal)


def petal_shares(
    row: pd.Series,
    categories: Sequence[str] = CATEGORIES,
) -> pd.Series:
    """Category percents → shares that sum to 1 (safe if all zero)."""
    values = row.loc[list(categories)].astype(float) / 100.0
    total = float(values.sum())
    if total == 0:
        return values
    return values / total
