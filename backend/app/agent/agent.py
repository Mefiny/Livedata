from google.adk.agents import Agent
from app.agent.prompts import build_system_instruction
from app.agent import tools as tool_funcs
from app.config import AGENT_MODEL


def create_agent(schema: dict | None = None) -> Agent:
    instruction = build_system_instruction(schema)

    return Agent(
        name="livedata_agent",
        model=AGENT_MODEL,
        description="A voice-driven data analysis assistant that helps ordinary people understand their data through natural conversation.",
        instruction=instruction,
        tools=[
            tool_funcs.get_data_summary,
            tool_funcs.analyze_trend,
            tool_funcs.analyze_categories,
            tool_funcs.compare_periods,
            tool_funcs.detect_anomalies,
            tool_funcs.forecast_values,
            tool_funcs.filter_data,
            tool_funcs.reset_filters,
        ],
    )
