from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class SessionState:
    session_id: str
    schema: dict | None = None
    active_filters: list[dict] = field(default_factory=list)
    chart_history: list[dict] = field(default_factory=list)


class SessionManager:
    def __init__(self):
        self._sessions: dict[str, SessionState] = {}

    def get_or_create(self, session_id: str) -> SessionState:
        if session_id not in self._sessions:
            self._sessions[session_id] = SessionState(session_id=session_id)
        return self._sessions[session_id]

    def set_schema(self, session_id: str, schema: dict):
        state = self.get_or_create(session_id)
        state.schema = schema

    def get_schema(self, session_id: str) -> dict | None:
        state = self._sessions.get(session_id)
        return state.schema if state else None

    def add_filter(self, session_id: str, filter_def: dict):
        state = self.get_or_create(session_id)
        state.active_filters.append(filter_def)

    def clear_filters(self, session_id: str):
        state = self.get_or_create(session_id)
        state.active_filters.clear()

    def get_filters(self, session_id: str) -> list[dict]:
        state = self._sessions.get(session_id)
        return state.active_filters if state else []

    def add_chart(self, session_id: str, chart_config: dict):
        state = self.get_or_create(session_id)
        state.chart_history.append(chart_config)

    def remove(self, session_id: str):
        self._sessions.pop(session_id, None)
