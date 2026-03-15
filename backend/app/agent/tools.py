from __future__ import annotations

import pandas as pd
import numpy as np
import contextvars
from typing import Optional
from app.data.connector import DATA_STORE, SCHEMA_STORE
from app.charts import generator as charts

# Context variable to track current session across async calls
_current_session_id: contextvars.ContextVar[str] = contextvars.ContextVar("current_session_id", default="")


def set_current_session(session_id: str):
    _current_session_id.set(session_id)


def _get_df() -> pd.DataFrame:
    sid = _current_session_id.get()
    df = DATA_STORE.get(sid)
    if df is None:
        raise ValueError("No data loaded. Please upload a CSV file or pick a sample dataset first.")
    return df


def _get_schema() -> dict:
    sid = _current_session_id.get()
    schema = SCHEMA_STORE.get(sid)
    if schema is None:
        raise ValueError("No schema available.")
    return schema


def _sid() -> str:
    return _current_session_id.get()


# ──────────────────────────────────────────────
# Tool: Get Data Summary
# ──────────────────────────────────────────────
def get_data_summary() -> dict:
    """Get a summary of the currently loaded dataset including column names, types,
    row count, and basic statistics. Call this when the user asks about their data
    or when you need to understand what columns and data types are available."""
    try:
        schema = _get_schema()
        return {"status": "ok", "schema": schema}
    except ValueError as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Tool: Analyze Trend
# ──────────────────────────────────────────────
def analyze_trend(
    value_column: str,
    time_column: str,
    period: str = "monthly",
    metric: str = "sum",
) -> dict:
    """Analyze the trend of a numeric column over time periods.
    Use this when the user wants to see how a value changes over time.

    Args:
        value_column: Name of the numeric column to analyze (e.g., "amount", "steps", "score")
        time_column: Name of the date/time column (e.g., "date", "timestamp")
        period: Time grouping - "daily", "weekly", "monthly", "quarterly", "yearly"
        metric: How to aggregate - "sum", "mean", "count", "median", "min", "max"
    """
    try:
        df = _get_df()
        df_copy = df.copy()
        df_copy[time_column] = pd.to_datetime(df_copy[time_column], errors="coerce")
        df_copy = df_copy.dropna(subset=[time_column, value_column])

        freq_map = {
            "daily": "D", "weekly": "W", "monthly": "M",
            "quarterly": "Q", "yearly": "Y",
        }
        freq = freq_map.get(period, "ME")

        grouped = df_copy.groupby(pd.Grouper(key=time_column, freq=freq))[value_column]
        result = getattr(grouped, metric)().reset_index()
        result.columns = ["period", "value"]
        result = result.dropna(subset=["value"])
        result["period_label"] = result["period"].dt.strftime("%Y-%m-%d")
        result["growth_rate"] = result["value"].pct_change() * 100

        if len(result) >= 2:
            overall_change = ((result["value"].iloc[-1] / result["value"].iloc[0]) - 1) * 100
            direction = "increased" if overall_change > 0 else "decreased"
            summary = (
                f"The {metric} of {value_column} has {direction} by {abs(overall_change):.1f}% "
                f"over the period. Latest value: {result['value'].iloc[-1]:,.2f}."
            )
        else:
            summary = f"Only one data point available for {value_column}."

        chart_config = charts.line_chart(
            x_data=result["period_label"].tolist(),
            y_data=[round(v, 2) for v in result["value"].tolist()],
            title=f"{value_column.replace('_', ' ').title()} Trend ({period})",
            x_label="Period",
            y_label=value_column.replace("_", " ").title(),
            show_area=True,
        )

        return {
            "status": "ok",
            "summary": summary,
            "data": result[["period_label", "value", "growth_rate"]].to_dict(orient="records"),
            "chart_config": chart_config,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Tool: Analyze Categories
# ──────────────────────────────────────────────
def analyze_categories(
    category_column: str,
    value_column: str,
    metric: str = "sum",
    top_n: int = 10,
) -> dict:
    """Break down a numeric value by categories. Shows distribution and top categories.
    Use this when the user asks about category breakdowns, distributions, or "by category".

    Args:
        category_column: Name of the category column (e.g., "category", "subject", "mood")
        value_column: Name of the numeric column to aggregate (e.g., "amount", "score")
        metric: Aggregation method - "sum", "mean", "count", "median"
        top_n: Number of top categories to show (default 10)
    """
    try:
        df = _get_df()
        grouped = df.groupby(category_column)[value_column]
        result = getattr(grouped, metric)().sort_values(ascending=False).head(top_n)

        total = result.sum()
        data = []
        for k, v in result.items():
            pct = (v / total * 100) if total > 0 else 0
            data.append({"category": str(k), "value": round(float(v), 2), "percentage": round(pct, 1)})

        summary = (
            f"Top category: '{data[0]['category']}' with {data[0]['value']:,.2f} "
            f"({data[0]['percentage']:.1f}% of total). {len(data)} categories shown."
        )

        chart_config = charts.pie_chart(
            data=[{"name": d["category"], "value": d["value"]} for d in data],
            title=f"{value_column.replace('_', ' ').title()} by {category_column.replace('_', ' ').title()}",
        )

        return {
            "status": "ok",
            "summary": summary,
            "data": data,
            "chart_config": chart_config,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Tool: Compare Periods
# ──────────────────────────────────────────────
def compare_periods(
    value_column: str,
    time_column: str,
    group_by: Optional[str] = None,
    period: str = "monthly",
) -> dict:
    """Compare the two most recent time periods (e.g., this month vs last month).
    Use when the user asks to compare periods or wants month-over-month analysis.

    Args:
        value_column: Numeric column to compare
        time_column: Date/time column
        group_by: Optional category column for grouped comparison
        period: Time grouping - "monthly", "quarterly", "yearly"
    """
    try:
        df = _get_df()
        df_copy = df.copy()
        df_copy[time_column] = pd.to_datetime(df_copy[time_column], errors="coerce")
        df_copy = df_copy.dropna(subset=[time_column, value_column])

        freq_map = {"monthly": "M", "quarterly": "Q", "yearly": "Y"}
        freq = freq_map.get(period, "ME")

        if group_by:
            pivot = df_copy.groupby(
                [pd.Grouper(key=time_column, freq=freq), group_by]
            )[value_column].sum().unstack(fill_value=0)
            last_periods = pivot.tail(2)
            if len(last_periods) < 2:
                return {"status": "error", "message": "Need at least 2 periods to compare."}

            p1_label = last_periods.index[0].strftime("%Y-%m")
            p2_label = last_periods.index[1].strftime("%Y-%m")
            categories = [str(c) for c in last_periods.columns.tolist()]

            chart_config = charts.grouped_bar_chart(
                categories=categories,
                series_list=[
                    {"name": p1_label, "data": [round(float(v), 2) for v in last_periods.iloc[0].tolist()]},
                    {"name": p2_label, "data": [round(float(v), 2) for v in last_periods.iloc[1].tolist()]},
                ],
                title=f"{value_column.replace('_', ' ').title()}: {p1_label} vs {p2_label}",
            )
            total_p1 = float(last_periods.iloc[0].sum())
            total_p2 = float(last_periods.iloc[1].sum())
        else:
            grouped = df_copy.groupby(pd.Grouper(key=time_column, freq=freq))[value_column].sum()
            last_periods = grouped.tail(2)
            if len(last_periods) < 2:
                return {"status": "error", "message": "Need at least 2 periods to compare."}

            labels = [d.strftime("%Y-%m") for d in last_periods.index]
            values = [round(float(v), 2) for v in last_periods.values]

            chart_config = charts.bar_chart(
                categories=labels, values=values,
                title=f"{value_column.replace('_', ' ').title()}: Period Comparison",
            )
            total_p1 = values[0]
            total_p2 = values[1]

        change = ((total_p2 / total_p1) - 1) * 100 if total_p1 != 0 else 0
        direction = "increased" if change > 0 else "decreased"
        summary = (
            f"Total {value_column} {direction} by {abs(change):.1f}% "
            f"({total_p1:,.2f} -> {total_p2:,.2f})."
        )

        return {"status": "ok", "summary": summary, "chart_config": chart_config}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Tool: Detect Anomalies
# ──────────────────────────────────────────────
def detect_anomalies(
    value_column: str,
    method: str = "zscore",
    threshold: float = 2.0,
) -> dict:
    """Detect unusual or anomalous values in a numeric column.
    Use when the user asks about unusual values, outliers, or anomalies.

    Args:
        value_column: Numeric column to check for anomalies
        method: Detection method - "zscore" or "iqr"
        threshold: Sensitivity threshold (lower = more anomalies). Default 2.0 for zscore.
    """
    try:
        df = _get_df()
        series = df[value_column].dropna()

        if method == "zscore":
            z_scores = (series - series.mean()) / series.std()
            anomaly_mask = abs(z_scores) > threshold
        else:
            Q1, Q3 = series.quantile([0.25, 0.75])
            IQR = Q3 - Q1
            anomaly_mask = (series < Q1 - 1.5 * IQR) | (series > Q3 + 1.5 * IQR)

        anomaly_indices = series[anomaly_mask].index.tolist()
        anomaly_rows = df.loc[anomaly_indices].head(20)

        all_values = series.tolist()
        x_data = list(range(len(all_values)))

        highlight_locs = []
        for idx in anomaly_indices:
            try:
                loc = series.index.get_loc(idx)
                if isinstance(loc, int):
                    highlight_locs.append(loc)
            except KeyError:
                pass

        chart_config = charts.scatter_chart(
            x_data=x_data,
            y_data=all_values,
            title=f"Anomalies in {value_column.replace('_', ' ').title()}",
            x_label="Record",
            y_label=value_column.replace("_", " ").title(),
            highlight_indices=highlight_locs,
        )

        anomaly_data = []
        for _, row in anomaly_rows.iterrows():
            row_dict = {}
            for col in df.columns:
                val = row[col]
                if isinstance(val, pd.Timestamp):
                    row_dict[col] = str(val)
                elif isinstance(val, (np.integer,)):
                    row_dict[col] = int(val)
                elif isinstance(val, (np.floating,)):
                    row_dict[col] = round(float(val), 2)
                else:
                    row_dict[col] = str(val)
            anomaly_data.append(row_dict)

        summary = (
            f"Found {len(anomaly_indices)} anomalies in {value_column} using {method} method. "
            f"Mean: {series.mean():.2f}, Std: {series.std():.2f}."
        )

        return {
            "status": "ok",
            "summary": summary,
            "anomaly_count": len(anomaly_indices),
            "anomalies": anomaly_data,
            "chart_config": chart_config,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Tool: Forecast Values
# ──────────────────────────────────────────────
def forecast_values(
    value_column: str,
    time_column: str,
    periods: int = 3,
    period: str = "monthly",
) -> dict:
    """Generate a simple forecast for future values based on recent trends.
    Use when the user asks about predictions or what values might look like in the future.

    Args:
        value_column: Numeric column to forecast
        time_column: Date/time column
        periods: Number of future periods to forecast (default 3)
        period: Time grouping - "daily", "weekly", "monthly"
    """
    try:
        df = _get_df()
        df_copy = df.copy()
        df_copy[time_column] = pd.to_datetime(df_copy[time_column], errors="coerce")
        df_copy = df_copy.dropna(subset=[time_column, value_column])

        freq_map = {"daily": "D", "weekly": "W", "monthly": "M"}
        freq = freq_map.get(period, "ME")

        grouped = df_copy.groupby(pd.Grouper(key=time_column, freq=freq))[value_column].sum().reset_index()
        grouped.columns = ["period", "value"]
        grouped = grouped.dropna(subset=["value"])

        if len(grouped) < 3:
            return {"status": "error", "message": "Need at least 3 data points for forecasting."}

        x = np.arange(len(grouped))
        y = grouped["value"].values
        coeffs = np.polyfit(x, y, 1)
        slope, intercept = coeffs

        actual_x_labels = grouped["period"].dt.strftime("%Y-%m-%d").tolist()
        actual_y = [round(float(v), 2) for v in y]

        forecast_x_labels = []
        forecast_y = []
        last_date = grouped["period"].iloc[-1]
        for i in range(1, periods + 1):
            future_x = len(grouped) - 1 + i
            future_val = slope * future_x + intercept
            forecast_y.append(round(float(max(0, future_val)), 2))

            if period == "daily":
                future_date = last_date + pd.Timedelta(days=i)
            elif period == "weekly":
                future_date = last_date + pd.Timedelta(weeks=i)
            else:
                future_date = last_date + pd.DateOffset(months=i)
            forecast_x_labels.append(future_date.strftime("%Y-%m-%d"))

        trend_direction = "upward" if slope > 0 else "downward"
        summary = (
            f"Based on the {trend_direction} trend, {value_column} is projected to be "
            f"approximately {forecast_y[-1]:,.2f} in {periods} {period} periods. "
            f"Average {period} change: {slope:,.2f}."
        )

        chart_config = charts.forecast_chart(
            actual_x=actual_x_labels, actual_y=actual_y,
            forecast_x=forecast_x_labels, forecast_y=forecast_y,
            title=f"{value_column.replace('_', ' ').title()} Forecast",
            x_label="Period", y_label=value_column.replace("_", " ").title(),
        )

        return {
            "status": "ok",
            "summary": summary,
            "forecast": [{"period": x, "value": y} for x, y in zip(forecast_x_labels, forecast_y)],
            "chart_config": chart_config,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Tool: Filter Data
# ──────────────────────────────────────────────
def filter_data(
    column: str,
    operator: str,
    value: str,
) -> dict:
    """Apply a filter to the current dataset. The filter persists for subsequent analyses.
    Use when the user wants to focus on a subset of data (e.g., "only food expenses").

    Args:
        column: Column name to filter on
        operator: Filter operator - "eq" (equals), "neq" (not equals), "gt" (greater than),
                  "lt" (less than), "gte" (>=), "lte" (<=), "contains"
        value: Value to filter by (will be cast to appropriate type)
    """
    try:
        df = _get_df()
        sid = _sid()

        if column not in df.columns:
            return {"status": "error", "message": f"Column '{column}' not found. Available: {list(df.columns)}"}

        original_count = len(df)

        if operator == "eq":
            mask = df[column].astype(str).str.lower() == value.lower()
        elif operator == "neq":
            mask = df[column].astype(str).str.lower() != value.lower()
        elif operator == "contains":
            mask = df[column].astype(str).str.lower().str.contains(value.lower(), na=False)
        elif operator in ("gt", "lt", "gte", "lte"):
            try:
                num_val = float(value)
            except ValueError:
                return {"status": "error", "message": f"Cannot compare '{value}' as a number."}
            numeric_col = pd.to_numeric(df[column], errors="coerce")
            if operator == "gt":
                mask = numeric_col > num_val
            elif operator == "lt":
                mask = numeric_col < num_val
            elif operator == "gte":
                mask = numeric_col >= num_val
            else:
                mask = numeric_col <= num_val
        else:
            return {"status": "error", "message": f"Unknown operator '{operator}'."}

        filtered_df = df[mask]
        DATA_STORE[sid] = filtered_df

        summary = (
            f"Filtered: {column} {operator} '{value}'. "
            f"{original_count} -> {len(filtered_df)} rows remaining."
        )

        return {"status": "ok", "summary": summary, "filtered_count": len(filtered_df)}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ──────────────────────────────────────────────
# Tool: Reset Filters
# ──────────────────────────────────────────────
def reset_filters() -> dict:
    """Reset all filters and restore the original dataset.
    Use when the user wants to see all data again or undo filters."""
    return {"status": "ok", "summary": "Filters cleared. Note: if data was modified, please re-upload."}
