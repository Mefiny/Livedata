from __future__ import annotations

import io
import os
import pandas as pd

from app.data.schema_detector import detect_schema

DATA_STORE: dict[str, pd.DataFrame] = {}
SCHEMA_STORE: dict[str, dict] = {}

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "sample_datasets")


def load_csv(session_id: str, file_content: bytes, filename: str) -> dict:
    df = pd.read_csv(io.BytesIO(file_content))

    # Auto-parse date columns
    for col in df.columns:
        if _is_date_column(df[col]):
            df[col] = pd.to_datetime(df[col], errors="coerce")

    DATA_STORE[session_id] = df
    schema = detect_schema(df, filename)
    SCHEMA_STORE[session_id] = schema
    return schema


def load_sample_dataset(session_id: str, scenario: str) -> dict:
    samples = list_sample_datasets()
    if scenario not in samples:
        raise ValueError(f"Unknown scenario: {scenario}")

    filepath = os.path.join(SAMPLE_DIR, samples[scenario]["filename"])
    with open(filepath, "rb") as f:
        content = f.read()

    return load_csv(session_id, content, samples[scenario]["filename"])


def list_sample_datasets() -> dict:
    return {
        "personal_finance": {
            "name": "Personal Finance",
            "description": "12 months of personal transactions including spending categories, merchants, and payment methods",
            "filename": "personal_finance.csv",
        },
        "health_tracker": {
            "name": "Health Tracker",
            "description": "90 days of health data including steps, calories, sleep, heart rate, and mood",
            "filename": "health_tracker.csv",
        },
        "student_grades": {
            "name": "Student Grades",
            "description": "Academic performance across subjects and semesters with attendance data",
            "filename": "student_grades.csv",
        },
    }


def get_dataframe(session_id: str) -> pd.DataFrame | None:
    return DATA_STORE.get(session_id)


def get_schema(session_id: str) -> dict | None:
    return SCHEMA_STORE.get(session_id)


def _is_date_column(series: pd.Series) -> bool:
    if series.dtype == "object":
        sample = series.dropna().head(20)
        if len(sample) == 0:
            return False
        try:
            parsed = pd.to_datetime(sample, errors="coerce")
            success_rate = parsed.notna().sum() / len(sample)
            return success_rate > 0.8
        except Exception:
            return False
    return pd.api.types.is_datetime64_any_dtype(series)
