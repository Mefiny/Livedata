from __future__ import annotations

import pandas as pd
import numpy as np


def detect_schema(df: pd.DataFrame, filename: str = "") -> dict:
    schema = {
        "filename": filename,
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": [],
    }

    for col in df.columns:
        col_info = {
            "name": col,
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isna().sum()),
            "null_percentage": round(df[col].isna().sum() / len(df) * 100, 1) if len(df) > 0 else 0,
            "unique_count": int(df[col].nunique()),
            "sample_values": _get_sample_values(df[col]),
        }

        if pd.api.types.is_numeric_dtype(df[col]):
            col_info["semantic_type"] = "numeric"
            col_info["stats"] = _numeric_stats(df[col])
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            col_info["semantic_type"] = "datetime"
            col_info["date_info"] = _date_info(df[col])
        elif df[col].nunique() <= 30 and df[col].nunique() < len(df) * 0.5:
            col_info["semantic_type"] = "category"
            col_info["categories"] = _category_info(df[col])
        else:
            col_info["semantic_type"] = "text"

        schema["columns"].append(col_info)

    schema["summary"] = _generate_summary(schema)
    return schema


def _numeric_stats(series: pd.Series) -> dict:
    clean = series.dropna()
    if len(clean) == 0:
        return {}
    return {
        "min": _safe_float(clean.min()),
        "max": _safe_float(clean.max()),
        "mean": _safe_float(clean.mean()),
        "median": _safe_float(clean.median()),
        "std": _safe_float(clean.std()),
        "sum": _safe_float(clean.sum()),
    }


def _date_info(series: pd.Series) -> dict:
    clean = series.dropna()
    if len(clean) == 0:
        return {}

    info = {
        "min": str(clean.min()),
        "max": str(clean.max()),
    }

    if len(clean) > 1:
        sorted_dates = clean.sort_values()
        deltas = sorted_dates.diff().dropna()
        if len(deltas) > 0:
            median_delta = deltas.median()
            if median_delta.days <= 1:
                info["frequency"] = "daily"
            elif median_delta.days <= 7:
                info["frequency"] = "weekly"
            elif median_delta.days <= 31:
                info["frequency"] = "monthly"
            elif median_delta.days <= 92:
                info["frequency"] = "quarterly"
            else:
                info["frequency"] = "yearly"

    return info


def _category_info(series: pd.Series) -> dict:
    counts = series.value_counts().head(15)
    total = series.notna().sum()
    return {
        "values": {str(k): int(v) for k, v in counts.items()},
        "top_value": str(counts.index[0]) if len(counts) > 0 else None,
        "top_count": int(counts.iloc[0]) if len(counts) > 0 else 0,
        "top_percentage": round(counts.iloc[0] / total * 100, 1) if total > 0 and len(counts) > 0 else 0,
    }


def _get_sample_values(series: pd.Series, n: int = 3) -> list:
    sample = series.dropna().head(n)
    result = []
    for v in sample:
        if isinstance(v, (np.integer,)):
            result.append(int(v))
        elif isinstance(v, (np.floating,)):
            result.append(float(v))
        elif isinstance(v, pd.Timestamp):
            result.append(str(v))
        else:
            result.append(str(v))
    return result


def _safe_float(val) -> float:
    try:
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return 0.0
        return round(f, 2)
    except (ValueError, TypeError):
        return 0.0


def _generate_summary(schema: dict) -> str:
    parts = [f"Dataset with {schema['row_count']} rows and {schema['column_count']} columns."]

    col_types = {}
    for col in schema["columns"]:
        st = col["semantic_type"]
        col_types.setdefault(st, []).append(col["name"])

    if "datetime" in col_types:
        parts.append(f"Time columns: {', '.join(col_types['datetime'])}.")
    if "numeric" in col_types:
        parts.append(f"Numeric columns: {', '.join(col_types['numeric'])}.")
    if "category" in col_types:
        parts.append(f"Category columns: {', '.join(col_types['category'])}.")

    return " ".join(parts)
