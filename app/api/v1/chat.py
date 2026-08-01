from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.agent.personal_chef_agent import search_recipes, get_messages, clear_messages
from app.models.schemas import ChatRequest

router = APIRouter()


@router.post("/chat/stream")
async def chat_endpoint(request: ChatRequest):
    """ストリーミング会話"""
    return StreamingResponse(
        search_recipes(request.message, request.image_url, request.thread_id),
        media_type="text/event-stream"
    )


@router.get("/chat/messages")
async def get_chat_messages(thread_id: str):
    """履歴メッセージを取得する"""
    messages = get_messages(thread_id)
    return {"messages": messages}


@router.delete("/chat/messages")
async def clear_chat_messages(thread_id: str):
    """履歴メッセージをクリアする"""
    clear_messages(thread_id)
    return {"success": True}
