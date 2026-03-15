from __future__ import annotations

import uuid
import json
import base64
import logging
import os
import traceback

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from google import genai
from google.genai import types

from app.config import GOOGLE_API_KEY, AGENT_MODEL, MAX_FILE_SIZE_MB, SUPPORTED_FORMATS
from app.data.connector import load_csv, get_schema, load_sample_dataset, list_sample_datasets
from app.session.manager import SessionManager
from app.agent.tools import (
    set_current_session,
    get_data_summary, analyze_trend, analyze_categories,
    compare_periods, detect_anomalies, forecast_values,
    filter_data, reset_filters,
)
from app.agent.prompts import build_system_instruction
from app.live.session import LiveSession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="LiveData OS", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_manager = SessionManager()

# Gemini client
client = genai.Client(api_key=GOOGLE_API_KEY)

# Map tool names to functions
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

# Per-session chat histories
CHAT_HISTORIES: dict[str, list] = {}

# Per-session Gemini Live audio sessions
LIVE_SESSIONS: dict[str, LiveSession] = {}


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "LiveData OS"}


@app.post("/api/upload/{session_id}")
async def upload_csv(session_id: str, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in SUPPORTED_FORMATS:
        raise HTTPException(status_code=400, detail=f"Unsupported format. Use: {SUPPORTED_FORMATS}")

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large ({size_mb:.1f}MB). Max: {MAX_FILE_SIZE_MB}MB")

    try:
        schema = load_csv(session_id, content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    session_manager.set_schema(session_id, schema)
    CHAT_HISTORIES.pop(session_id, None)
    return {"status": "ok", "filename": file.filename, "schema": schema}


@app.post("/api/load-sample/{session_id}/{scenario}")
async def load_sample(session_id: str, scenario: str):
    available = list_sample_datasets()
    if scenario not in available:
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {scenario}. Available: {list(available.keys())}")

    try:
        schema = load_sample_dataset(session_id, scenario)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sample: {str(e)}")

    session_manager.set_schema(session_id, schema)
    CHAT_HISTORIES.pop(session_id, None)
    return {"status": "ok", "scenario": scenario, "schema": schema}


@app.get("/api/samples")
async def get_samples():
    return list_sample_datasets()


@app.get("/api/schema/{session_id}")
async def get_session_schema(session_id: str):
    schema = get_schema(session_id)
    if not schema:
        raise HTTPException(status_code=404, detail="No data loaded for this session")
    return schema


@app.get("/api/session")
async def create_session():
    session_id = str(uuid.uuid4())[:8]
    return {"session_id": session_id}


@app.post("/api/analyze-workspace")
async def analyze_workspace(request: dict):
    """Analyze workspace components and generate AI insights."""
    components = request.get("components", [])
    schema = request.get("schema")

    if not components or not schema:
        raise HTTPException(status_code=400, detail="Missing components or schema")

    # Build analysis prompt
    prompt = f"""分析以下数据工作台的配置，提供数据洞察和建议：

数据结构：
- 数据集：{schema.get('name', 'Unknown')}
- 字段：{', '.join([col['name'] for col in schema.get('columns', [])])}
- 行数：{schema.get('row_count', 0)}

工作台组件：
"""
    for comp in components:
        prompt += f"\n- {comp.get('config', {}).get('label', 'Unknown')}: {comp.get('type')}"

    prompt += "\n\n请提供：\n1. 当前数据的关键发现\n2. 可能的数据趋势或模式\n3. 建议添加的分析维度"

    try:
        response = client.models.generate_content(
            model=AGENT_MODEL,
            contents=prompt
        )
        insights = response.text
        return {"insights": insights}
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _build_tools_list() -> list:
    """Build the tools list for Gemini function calling."""
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


async def _handle_gemini_chat(session_id: str, user_message: str, websocket: WebSocket):
    """Handle a text message by calling Gemini with function calling support."""
    set_current_session(session_id)

    schema = get_schema(session_id)
    system_instruction = build_system_instruction(schema)

    if session_id not in CHAT_HISTORIES:
        CHAT_HISTORIES[session_id] = []

    history = CHAT_HISTORIES[session_id]
    history.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

    try:
        response = client.models.generate_content(
            model=AGENT_MODEL,
            contents=history,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                tools=_build_tools_list(),
                temperature=0.7,
            ),
        )

        max_iterations = 5
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            if not response.candidates or not response.candidates[0].content.parts:
                break

            parts = response.candidates[0].content.parts
            has_function_call = any(p.function_call for p in parts)

            if not has_function_call:
                text_parts = [p.text for p in parts if p.text]
                agent_text = " ".join(text_parts)
                history.append(types.Content(role="model", parts=parts))

                await websocket.send_json({
                    "type": "transcript",
                    "text": agent_text,
                    "role": "agent",
                })
                break

            # Process function calls
            history.append(types.Content(role="model", parts=parts))

            function_responses = []
            for part in parts:
                if part.function_call:
                    fn_name = part.function_call.name
                    fn_args = dict(part.function_call.args) if part.function_call.args else {}

                    logger.info(f"[{session_id}] Tool call: {fn_name}({fn_args})")

                    await websocket.send_json({"type": "status", "status": "thinking"})

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
                        await websocket.send_json({
                            "type": "chart",
                            "config": result["chart_config"],
                            "summary": result.get("summary", ""),
                        })

                    function_responses.append(
                        types.Part.from_function_response(
                            name=fn_name,
                            response=result,
                        )
                    )

            history.append(types.Content(role="user", parts=function_responses))

            response = client.models.generate_content(
                model=AGENT_MODEL,
                contents=history,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=_build_tools_list(),
                    temperature=0.7,
                ),
            )

        await websocket.send_json({"type": "status", "status": "idle"})

        # Trim history to prevent token overflow
        if len(history) > 40:
            CHAT_HISTORIES[session_id] = history[-40:]

    except Exception as e:
        logger.error(f"Gemini error for {session_id}: {e}")
        await websocket.send_json({
            "type": "transcript",
            "text": f"Sorry, I encountered an error: {str(e)}",
            "role": "agent",
        })
        await websocket.send_json({"type": "status", "status": "idle"})


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected: {session_id}")

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type", "")

            if msg_type == "text":
                user_text = msg.get("text", "")
                if not user_text.strip():
                    continue
                logger.info(f"[{session_id}] User: {user_text}")
                await _handle_gemini_chat(session_id, user_text, websocket)

            elif msg_type == "audio":
                # Real-time audio streaming via Gemini Live API
                if session_id not in LIVE_SESSIONS:
                    logger.info(f"[{session_id}] Starting new Live session...")
                    live = LiveSession(
                        session_id=session_id,
                        ws_send_json=websocket.send_json,
                    )
                    LIVE_SESSIONS[session_id] = live
                    await live.start()

                pcm_data = base64.b64decode(msg["data"])
                logger.debug(f"[{session_id}] Audio chunk: {len(pcm_data)} bytes")
                await LIVE_SESSIONS[session_id].send_audio(pcm_data)

            elif msg_type == "audio_stop":
                # User stopped mic — close live session
                logger.info(f"[{session_id}] Audio stop received")
                if session_id in LIVE_SESSIONS:
                    await LIVE_SESSIONS[session_id].close()
                    del LIVE_SESSIONS[session_id]

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {session_id}: {e}\n{traceback.format_exc()}")
    finally:
        # Clean up live session on disconnect
        if session_id in LIVE_SESSIONS:
            await LIVE_SESSIONS[session_id].close()
            del LIVE_SESSIONS[session_id]


# ─── Static file serving for Cloud Run deployment ────────────────────────
_static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(_static_dir):
    _assets_dir = os.path.join(_static_dir, "assets")
    if os.path.exists(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """SPA fallback — serve index.html for all non-API, non-WS routes."""
        index_path = os.path.join(_static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Frontend not found"}
