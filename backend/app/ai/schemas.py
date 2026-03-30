from pydantic import BaseModel, Field
from typing import List, Optional


class ChatMessageDTO(BaseModel):
    role: str = Field(..., description="Either 'user' or 'assistant'")
    content: str = Field(..., description="The message text")


class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's current message")
    history: List[ChatMessageDTO] = Field(
        default_factory=list, description="Previous conversation messages"
    )


class ChatResponse(BaseModel):
    role: str = "assistant"
    content: str
