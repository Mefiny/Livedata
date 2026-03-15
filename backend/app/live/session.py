from __future__ import annotations

import asyncio
import base64
import logging
from typing import Callable, Awaitable

from google import genai
from google.genai import types

from app.config import GOOGLE_API_KEY, LIVE_MODEL, INPUT_SAMPLE_RATE, OUTPUT_SAMPLE_RATE
from app.agent.tools import (
    set_current_session,
    get_data_summary, analyze_trend, analyze_categories,
    compare_periods, detect_anomalies, forecast_values,
    filter_data, reset_filters,
)
from app.agent.prompts import build_system_instruction
from app.data.connector import get_schema

logger = logging.getLogger(__name__)

TOOL_FUNCTIONS = {
    "get_data_summary": get_data_summary,
    "analyze_trend": analyze_trend,
    "analyze_categories": analyze_categories,
    "compare_periods": compare_periods,
    "detect_anomalies": detect_anomalies,
    "forecast_values": forecast_values,
    "filter_data": filter_data,
    "reset_filters": reset_filters,
}


def _build_tools_list() -> list:
    return [
        get_data_summary,
        analyze_trend,
        analyze_categories,
        compare_periods,
        detect_anomalies,
        forecast_values,
        filter_data,
        reset_filters,
    ]


class LiveSession:
    """Manages a single Gemini Live API session for bidirectional audio streaming."""

    def __init__(
        self,
        session_id: str,
        ws_send_json: Callable[[dict], Awaitable[None]],
    ):
        self.session_id = session_id
        self.ws_send_json = ws_send_json
        self._gemini_session = None
        self._ctx_manager = None
        self._receive_task: asyncio.Task | None = None
        self._client = genai.Client(api_key=GOOGLE_API_KEY)

    async def start(self):
        """Open a Gemini Live session and start the receive loop."""
        schema = get_schema(self.session_id)
        system_instruction = build_system_instruction(schema)
        set_current_session(self.session_id)

        config = types.LiveConnectConfig(
            response_modalities=["AUDIO"],
            system_instruction=types.Content(
                parts=[types.Part.from_text(text=system_instruction)]
            ),
            tools=_build_tools_list(),
            input_audio_transcription=types.AudioTranscriptionConfig(),
            output_audio_transcription=types.AudioTranscriptionConfig(),
        )

        self._ctx_manager = self._client.aio.live.connect(
            model=LIVE_MODEL,
            config=config,
        )
        self._gemini_session = await self._ctx_manager.__aenter__()

        self._receive_task = asyncio.create_task(self._receive_loop())
        logger.info(f"[{self.session_id}] Gemini Live session started")

    async def send_audio(self, pcm_bytes: bytes):
        """Forward raw PCM audio from the browser to the Gemini Live API."""
        if self._gemini_session:
            await self._gemini_session.send_realtime_input(
                audio=types.Blob(
                    data=pcm_bytes,
                    mime_type=f"audio/pcm;rate={INPUT_SAMPLE_RATE}",
                )
            )

    async def _receive_loop(self):
        """Continuously receive responses from Gemini and forward to the browser."""
        try:
            async for response in self._gemini_session.receive():
                await self._handle_response(response)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"[{self.session_id}] Live receive error: {e}")
            try:
                await self.ws_send_json({
                    "type": "error",
                    "message": f"Voice session error: {str(e)}",
                })
            except Exception:
                pass

    async def _handle_response(self, response):
        """Process a single response from the Gemini Live API."""
        # Handle server content (audio, text, transcriptions)
        sc = getattr(response, "server_content", None)
        if sc:
            # Model audio/text output
            model_turn = getattr(sc, "model_turn", None)
            if model_turn:
                for part in model_turn.parts:
                    # Audio chunk
                    if part.inline_data:
                        audio_b64 = base64.b64encode(part.inline_data.data).decode()
                        await self.ws_send_json({
                            "type": "audio",
                            "data": audio_b64,
                            "mime_type": f"audio/pcm;rate={OUTPUT_SAMPLE_RATE}",
                        })
                    # Text part (rare in audio mode, but possible)
                    if part.text:
                        await self.ws_send_json({
                            "type": "transcript",
                            "text": part.text,
                            "role": "agent",
                        })

            # User speech transcription
            input_tx = getattr(sc, "input_transcription", None)
            if input_tx and getattr(input_tx, "text", None):
                await self.ws_send_json({
                    "type": "transcript",
                    "text": input_tx.text,
                    "role": "user",
                })

            # Model speech transcription
            output_tx = getattr(sc, "output_transcription", None)
            if output_tx and getattr(output_tx, "text", None):
                await self.ws_send_json({
                    "type": "transcript",
                    "text": output_tx.text,
                    "role": "agent",
                })

            # Interruption signal
            if getattr(sc, "interrupted", False):
                await self.ws_send_json({"type": "interrupted"})

        # Handle tool calls
        tc = getattr(response, "tool_call", None)
        if tc:
            await self._handle_tool_call(tc)

    async def _handle_tool_call(self, tool_call):
        """Execute tool calls from the Gemini Live session and return results."""
        set_current_session(self.session_id)
        function_responses = []

        for fc in tool_call.function_calls:
            fn_name = fc.name
            fn_args = dict(fc.args) if fc.args else {}
            logger.info(f"[{self.session_id}] Live tool call: {fn_name}({fn_args})")

            await self.ws_send_json({"type": "status", "status": "thinking"})

            tool_fn = TOOL_FUNCTIONS.get(fn_name)
            if tool_fn:
                try:
                    result = tool_fn(**fn_args)
                except Exception as e:
                    result = {"status": "error", "message": str(e)}
            else:
                result = {"status": "error", "message": f"Unknown tool: {fn_name}"}

            # Send chart to frontend if present
            if isinstance(result, dict) and "chart_config" in result:
                await self.ws_send_json({
                    "type": "chart",
                    "config": result["chart_config"],
                    "summary": result.get("summary", ""),
                })

            function_responses.append(
                types.FunctionResponse(
                    name=fn_name,
                    response=result,
                    id=fc.id,
                )
            )

        # Send tool results back to Gemini so it can continue
        await self._gemini_session.send_tool_response(
            function_responses=function_responses
        )
        await self.ws_send_json({"type": "status", "status": "idle"})

    async def close(self):
        """Clean up the Gemini Live session."""
        if self._receive_task:
            self._receive_task.cancel()
            try:
                await self._receive_task
            except asyncio.CancelledError:
                pass
        if self._ctx_manager:
            try:
                await self._ctx_manager.__aexit__(None, None, None)
            except Exception:
                pass
            self._ctx_manager = None
            self._gemini_session = None
        logger.info(f"[{self.session_id}] Gemini Live session closed")
