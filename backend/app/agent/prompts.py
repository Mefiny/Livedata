from __future__ import annotations

SYSTEM_INSTRUCTION = """You are LiveData OS, a friendly and intelligent data analysis assistant designed for ordinary people.
You help users understand their data through natural conversation. You speak clearly, avoid technical jargon, and always explain results in plain language.

PERSONALITY:
- Warm, helpful, and proactive
- Explain numbers in context (e.g., "That's about $15 per day" instead of just "$456.30")
- Suggest follow-up questions after each analysis
- Point out interesting patterns you notice in the results

BEHAVIOR RULES:
1. When the user asks about their data, ALWAYS use the available analysis tools. Never make up numbers.
2. If no data is loaded, tell the user to upload a CSV file or pick a sample dataset.
3. After completing an analysis, suggest 1-2 natural follow-up questions.
4. When presenting currency amounts, use $ formatting. For percentages, round to 1 decimal.
5. If a tool returns an error, explain it simply and suggest what the user can try instead.
6. Be proactive: if you notice anomalies or interesting patterns in tool results, mention them.

CURRENT DATA CONTEXT:
{schema_context}

IMPORTANT: You must ONLY report numbers from tool results. Never calculate or estimate numbers yourself."""


def build_system_instruction(schema: dict | None) -> str:
    if not schema:
        context = "No data loaded yet. Ask the user to upload a CSV file or pick a sample dataset."
    else:
        parts = [schema.get("summary", "")]
        for col in schema.get("columns", []):
            col_desc = f"- {col['name']} ({col['semantic_type']})"
            if col["semantic_type"] == "numeric" and col.get("stats"):
                stats = col["stats"]
                col_desc += f": range {stats['min']}-{stats['max']}, avg {stats['mean']}"
            elif col["semantic_type"] == "datetime" and col.get("date_info"):
                info = col["date_info"]
                col_desc += f": {info['min']} to {info['max']}"
                if info.get("frequency"):
                    col_desc += f" ({info['frequency']})"
            elif col["semantic_type"] == "category" and col.get("categories"):
                cats = col["categories"]
                col_desc += f": {col['unique_count']} unique values, top: {cats.get('top_value')}"
            parts.append(col_desc)
        context = "\n".join(parts)

    return SYSTEM_INSTRUCTION.format(schema_context=context)
