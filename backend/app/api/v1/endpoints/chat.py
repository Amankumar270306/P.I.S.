from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from uuid import UUID
from app.ai.schemas import ChatRequest
from app.api.deps import require_auth, get_chat_service
from app.ai.chat_service import ChatService
import json

router = APIRouter()


def _event_stream(service: ChatService, message: str, history: list, user_id: str):
    """Generator that yields SSE-formatted events with tool support."""
    try:
        for event in service.stream_with_tools(message, history, user_id):
            if event["type"] == "token":
                data = json.dumps({"token": event["content"]})
                yield f"data: {data}\n\n"
            elif event["type"] == "tool_result":
                data = json.dumps({"tool_result": event["data"]})
                yield f"data: {data}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        error_data = json.dumps({"error": str(e)})
        yield f"data: {error_data}\n\n"
        yield "data: [DONE]\n\n"


@router.post("/", summary="Chat with Plori AI")
def chat(
    req: ChatRequest,
    user_id: UUID = Depends(require_auth),
    service: ChatService = Depends(get_chat_service),
):
    history = [{"role": m.role, "content": m.content} for m in req.history]
    return StreamingResponse(
        _event_stream(service, req.message, history, str(user_id)),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
