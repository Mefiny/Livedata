"""
ECharts configuration generator.

Produces ECharts-option dicts that the React frontend renders via
``echarts-for-react``.  Every public function returns a plain ``dict``
that can be serialised straight to JSON.
"""

from __future__ import annotations

from typing import Any

# ── Professional colour palette ──────────────────────────────────────
PALETTE: list[str] = [
    "#5B8FF9",
    "#5AD8A6",
    "#5D7092",
    "#F6BD16",
    "#E86452",
    "#6DC8EC",
    "#945FB9",
    "#FF9845",
]


# ── Shared building blocks ───────────────────────────────────────────

def _base_grid() -> dict[str, str]:
    """Responsive grid settings shared across cartesian charts."""
    return {"left": "10%", "right": "5%", "bottom": "15%", "top": "15%"}


def _title_block(text: str) -> dict[str, Any]:
    return {
        "text": text,
        "left": "center",
        "textStyle": {
            "fontSize": 16,
            "fontWeight": "600",
            "color": "#1F2937",
        },
    }


def _axis(
    axis_type: str = "category",
    data: list | None = None,
    name: str = "",
) -> dict[str, Any]:
    axis: dict[str, Any] = {
        "type": axis_type,
        "axisLine": {"lineStyle": {"color": "#D1D5DB"}},
        "axisLabel": {"color": "#6B7280"},
        "splitLine": {"lineStyle": {"color": "#F3F4F6"}},
    }
    if data is not None:
        axis["data"] = data
    if name:
        axis["name"] = name
        axis["nameLocation"] = "middle"
        axis["nameGap"] = 35
        axis["nameTextStyle"] = {"color": "#6B7280", "fontSize": 12}
    return axis


def _tooltip(trigger: str = "axis") -> dict[str, Any]:
    return {
        "trigger": trigger,
        "backgroundColor": "rgba(255,255,255,0.96)",
        "borderColor": "#E5E7EB",
        "borderWidth": 1,
        "textStyle": {"color": "#374151", "fontSize": 13},
    }


def _legend(names: list[str] | None = None) -> dict[str, Any]:
    legend: dict[str, Any] = {
        "bottom": 0,
        "textStyle": {"color": "#6B7280"},
    }
    if names is not None:
        legend["data"] = names
    return legend


# ── Public chart factories ───────────────────────────────────────────

def line_chart(
    x_data: list,
    y_data: list,
    title: str,
    x_label: str = "",
    y_label: str = "",
    show_area: bool = False,
    color: str = "#5B8FF9",
) -> dict[str, Any]:
    """Standard smooth-line chart with optional filled area."""

    series_item: dict[str, Any] = {
        "type": "line",
        "data": y_data,
        "smooth": True,
        "symbol": "circle",
        "symbolSize": 6,
        "lineStyle": {"width": 2.5, "color": color},
        "itemStyle": {"color": color},
    }
    if show_area:
        series_item["areaStyle"] = {
            "color": {
                "type": "linear",
                "x": 0, "y": 0, "x2": 0, "y2": 1,
                "colorStops": [
                    {"offset": 0, "color": color + "40"},
                    {"offset": 1, "color": color + "05"},
                ],
            }
        }

    return {
        "title": _title_block(title),
        "tooltip": _tooltip("axis"),
        "grid": _base_grid(),
        "xAxis": _axis("category", data=x_data, name=x_label),
        "yAxis": _axis("value", name=y_label),
        "series": [series_item],
    }


def bar_chart(
    categories: list,
    values: list,
    title: str,
    horizontal: bool = False,
    color: str = "#5B8FF9",
) -> dict[str, Any]:
    """Vertical (default) or horizontal bar chart."""

    category_axis = _axis("category", data=categories)
    value_axis = _axis("value")

    series_item: dict[str, Any] = {
        "type": "bar",
        "data": values,
        "barMaxWidth": 40,
        "itemStyle": {
            "color": color,
            "borderRadius": [4, 4, 0, 0] if not horizontal else [0, 4, 4, 0],
        },
    }

    if horizontal:
        x = value_axis
        y = category_axis
    else:
        x = category_axis
        y = value_axis

    return {
        "title": _title_block(title),
        "tooltip": _tooltip("axis"),
        "grid": _base_grid(),
        "xAxis": x,
        "yAxis": y,
        "series": [series_item],
    }


def pie_chart(
    data: list[dict[str, Any]],
    title: str,
) -> dict[str, Any]:
    """Donut-style pie chart.

    Parameters
    ----------
    data:
        List of ``{"name": str, "value": number}`` items.
    """

    return {
        "title": _title_block(title),
        "tooltip": _tooltip("item"),
        "legend": _legend([item["name"] for item in data]),
        "color": PALETTE,
        "series": [
            {
                "type": "pie",
                "radius": ["40%", "70%"],
                "center": ["50%", "50%"],
                "avoidLabelOverlap": True,
                "itemStyle": {
                    "borderRadius": 6,
                    "borderColor": "#fff",
                    "borderWidth": 2,
                },
                "label": {
                    "show": True,
                    "formatter": "{b}: {d}%",
                    "color": "#6B7280",
                },
                "emphasis": {
                    "label": {"show": True, "fontSize": 14, "fontWeight": "bold"},
                },
                "data": data,
            }
        ],
    }


def scatter_chart(
    x_data: list,
    y_data: list,
    title: str,
    x_label: str = "",
    y_label: str = "",
    highlight_indices: list[int] | None = None,
    highlight_color: str = "#EF4444",
) -> dict[str, Any]:
    """Scatter plot with optional highlighted points (e.g. anomalies).

    Parameters
    ----------
    highlight_indices:
        Zero-based indices into *x_data* / *y_data* that should be drawn
        in ``highlight_color``.
    """

    highlight_set = set(highlight_indices) if highlight_indices else set()

    normal_points: list[list] = []
    highlighted_points: list[list] = []

    for idx, (x, y) in enumerate(zip(x_data, y_data)):
        point = [x, y]
        if idx in highlight_set:
            highlighted_points.append(point)
        else:
            normal_points.append(point)

    series: list[dict[str, Any]] = [
        {
            "type": "scatter",
            "name": "Data",
            "data": normal_points,
            "symbolSize": 8,
            "itemStyle": {"color": PALETTE[0]},
        },
    ]

    if highlighted_points:
        series.append(
            {
                "type": "scatter",
                "name": "Highlighted",
                "data": highlighted_points,
                "symbolSize": 10,
                "itemStyle": {"color": highlight_color},
            }
        )

    option: dict[str, Any] = {
        "title": _title_block(title),
        "tooltip": _tooltip("item"),
        "grid": _base_grid(),
        "xAxis": _axis("value", name=x_label),
        "yAxis": _axis("value", name=y_label),
        "series": series,
    }

    if highlighted_points:
        option["legend"] = _legend(["Data", "Highlighted"])

    return option


def grouped_bar_chart(
    categories: list,
    series_list: list[dict[str, Any]],
    title: str,
) -> dict[str, Any]:
    """Multiple-series (grouped) bar chart.

    Parameters
    ----------
    series_list:
        List of ``{"name": str, "data": list}`` dicts, one per group.
    """

    series: list[dict[str, Any]] = []
    for idx, s in enumerate(series_list):
        series.append(
            {
                "type": "bar",
                "name": s["name"],
                "data": s["data"],
                "barMaxWidth": 32,
                "itemStyle": {
                    "color": PALETTE[idx % len(PALETTE)],
                    "borderRadius": [4, 4, 0, 0],
                },
            }
        )

    return {
        "title": _title_block(title),
        "tooltip": _tooltip("axis"),
        "legend": _legend([s["name"] for s in series_list]),
        "grid": _base_grid(),
        "xAxis": _axis("category", data=categories),
        "yAxis": _axis("value"),
        "series": series,
    }


def multi_line_chart(
    x_data: list,
    series_list: list[dict[str, Any]],
    title: str,
    x_label: str = "",
    y_label: str = "",
) -> dict[str, Any]:
    """Multiple smooth-line series sharing the same X axis.

    Parameters
    ----------
    series_list:
        List of ``{"name": str, "data": list}`` dicts.
    """

    series: list[dict[str, Any]] = []
    for idx, s in enumerate(series_list):
        color = PALETTE[idx % len(PALETTE)]
        series.append(
            {
                "type": "line",
                "name": s["name"],
                "data": s["data"],
                "smooth": True,
                "symbol": "circle",
                "symbolSize": 5,
                "lineStyle": {"width": 2.5, "color": color},
                "itemStyle": {"color": color},
            }
        )

    return {
        "title": _title_block(title),
        "tooltip": _tooltip("axis"),
        "legend": _legend([s["name"] for s in series_list]),
        "grid": _base_grid(),
        "xAxis": _axis("category", data=x_data, name=x_label),
        "yAxis": _axis("value", name=y_label),
        "series": series,
    }


def forecast_chart(
    actual_x: list,
    actual_y: list,
    forecast_x: list,
    forecast_y: list,
    title: str,
    x_label: str = "",
    y_label: str = "",
) -> dict[str, Any]:
    """Line chart with a solid *actual* series and a dashed *forecast* series.

    The two series share a continuous X axis built by concatenating
    ``actual_x`` and ``forecast_x``.  The actual series has ``None``
    placeholders where forecast values are, and vice-versa, **except** that
    the last actual point is duplicated as the first forecast point so the
    two lines connect seamlessly.
    """

    full_x: list = list(actual_x) + list(forecast_x)

    # Actual data padded with None for the forecast region.
    actual_padded: list = list(actual_y) + [None] * len(forecast_y)

    # Forecast data: None for the actual region, but start from the last
    # actual value so the lines join.
    forecast_padded: list = (
        [None] * (len(actual_y) - 1)
        + [actual_y[-1] if actual_y else None]
        + list(forecast_y)
    )

    actual_color = PALETTE[0]   # blue
    forecast_color = PALETTE[3] # yellow-gold

    return {
        "title": _title_block(title),
        "tooltip": _tooltip("axis"),
        "legend": _legend(["Actual", "Forecast"]),
        "grid": _base_grid(),
        "xAxis": _axis("category", data=full_x, name=x_label),
        "yAxis": _axis("value", name=y_label),
        "series": [
            {
                "type": "line",
                "name": "Actual",
                "data": actual_padded,
                "smooth": True,
                "symbol": "circle",
                "symbolSize": 6,
                "lineStyle": {"width": 2.5, "color": actual_color},
                "itemStyle": {"color": actual_color},
            },
            {
                "type": "line",
                "name": "Forecast",
                "data": forecast_padded,
                "smooth": True,
                "symbol": "diamond",
                "symbolSize": 6,
                "lineStyle": {
                    "width": 2.5,
                    "color": forecast_color,
                    "type": "dashed",
                },
                "itemStyle": {"color": forecast_color},
            },
        ],
    }
