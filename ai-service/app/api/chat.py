import uuid
import json
import logging
from typing import Optional, AsyncGenerator
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage

from app.modules.recommend import recommend_graph
from app.modules.search import search_graph
from app.modules.customer_service import cs_graph
from app.core.context import context_manager

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="用户消息")
    session_id: Optional[str] = Field(None, description="会话ID，不传则新建")
    user_id: Optional[int] = Field(None, description="用户ID")


async def stream_graph(graph, initial_state: dict, session_id: str, module: str) -> AsyncGenerator[str, None]:
    yield f"data: {json.dumps({'type': 'session', 'session_id': session_id, 'module': module})}\n\n"

    try:
        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event.get("event")
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, "content") and chunk.content:
                    yield f"data: {json.dumps({'type': 'token', 'content': chunk.content})}\n\n"
            elif kind == "on_custom_event":
                yield f"data: {json.dumps({'type': 'event', 'name': event['name'], 'data': event['data']})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    except Exception as e:
        logger.error(f"Stream error: {e}", exc_info=True)
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/recommend", summary="AI智能推荐（流式）")
async def recommend(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())

    ctx = context_manager.get_context(session_id)
    ctx.module = "recommend"
    ctx.user_id = request.user_id
    ctx.add_message("user", request.message)

    initial_state = {
        "messages": [HumanMessage(content=request.message)],
        "user_id": request.user_id,
        "user_preference": "",
        "candidate_books": [],
        "recommendation_reason": "",
        "final_response": "",
    }

    async def event_generator():
        full_response = ""
        async for sse in stream_graph(recommend_graph, initial_state, session_id, "recommend"):
            if "token" in sse:
                try:
                    data = json.loads(sse.replace("data: ", ""))
                    if data.get("type") == "token":
                        full_response += data["content"]
                except json.JSONDecodeError:
                    pass
            yield sse

        ctx.add_message("assistant", full_response)
        context_manager.save_context(ctx)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/search", summary="AI智能搜索（流式）")
async def search(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())

    ctx = context_manager.get_context(session_id)
    ctx.module = "search"
    ctx.user_id = request.user_id
    ctx.add_message("user", request.message)

    initial_state = {
        "messages": [HumanMessage(content=request.message)],
        "query": "",
        "search_results": [],
        "search_type": "",
        "final_response": "",
    }

    async def event_generator():
        full_response = ""
        async for sse in stream_graph(search_graph, initial_state, session_id, "search"):
            if "token" in sse:
                try:
                    data = json.loads(sse.replace("data: ", ""))
                    if data.get("type") == "token":
                        full_response += data["content"]
                except json.JSONDecodeError:
                    pass
            yield sse

        ctx.add_message("assistant", full_response)
        context_manager.save_context(ctx)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/customer-service", summary="AI客服（流式）")
async def customer_service_chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())

    ctx = context_manager.get_context(session_id)
    ctx.module = "customer_service"
    ctx.user_id = request.user_id
    ctx.add_message("user", request.message)

    initial_state = {
        "messages": [HumanMessage(content=request.message)],
        "user_id": request.user_id,
        "intent": "",
        "entities": {},
        "knowledge_response": "",
        "final_response": "",
    }

    async def event_generator():
        full_response = ""
        async for sse in stream_graph(cs_graph, initial_state, session_id, "customer_service"):
            if "token" in sse:
                try:
                    data = json.loads(sse.replace("data: ", ""))
                    if data.get("type") == "token":
                        full_response += data["content"]
                except json.JSONDecodeError:
                    pass
            yield sse

        ctx.add_message("assistant", full_response)
        context_manager.save_context(ctx)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.delete("/session/{session_id}", summary="清除会话")
async def clear_session(session_id: str):
    context_manager.delete_context(session_id)
    return {"session_id": session_id, "message": "会话已清除"}


@router.get("/session/{session_id}", summary="获取会话上下文")
async def get_session(session_id: str):
    ctx = context_manager.get_context(session_id)
    return ctx.to_dict()
