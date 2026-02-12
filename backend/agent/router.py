"""
Intent Router for Multi-Model LangGraph System.
Uses phi3:mini for fast intent classification.
"""

import os
import json
from typing import Optional
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field


class RouterOutput(BaseModel):
    """Schema for router output."""
    intent: str = Field(description="One of: fast_task, reasoning, document, smalltalk")
    confidence: float = Field(description="Confidence score 0-1")
    action: Optional[str] = Field(default=None, description="For fast_task: create, update, delete, list, complete")
    title: Optional[str] = Field(default=None, description="Extracted task title")
    doc_id: Optional[str] = Field(default=None, description="Document ID if mentioned")
    clarification_needed: bool = Field(default=False)
    clarification_question: Optional[str] = Field(default=None)


ROUTER_SYSTEM_PROMPT = """You are an intent classification router. Analyze user input and classify intent.

RULES:
1. Output ONLY valid JSON matching the schema below
2. Never execute actions, only classify
3. If ambiguous, set clarification_needed=true
4. IMPORTANT: Words like "delete", "remove", "clear" indicate DELETE action, not create!

INTENTS:
- fast_task: Simple CRUD operations (add task, delete task, list tasks, mark done, edit task)
- reasoning: Complex planning, scheduling, prioritization, breaking down goals
- document: Reading, summarizing, or extracting from documents
- smalltalk: Greetings, questions about the AI, non-task conversation

OUTPUT SCHEMA:
{
  "intent": "fast_task | reasoning | document | smalltalk",
  "confidence": 0.95,
  "action": "create | update | delete | delete_all | list | complete | null",
  "title": "extracted task title or null",
  "doc_id": "document id if mentioned or null",
  "clarification_needed": false,
  "clarification_question": null
}

EXAMPLES:
User: "Add a task to review the project docs"
→ {"intent": "fast_task", "confidence": 0.95, "action": "create", "title": "review the project docs", "doc_id": null, "clarification_needed": false, "clarification_question": null}

User: "Delete all my tasks"
→ {"intent": "fast_task", "confidence": 0.95, "action": "delete_all", "title": null, "doc_id": null, "clarification_needed": false, "clarification_question": null}

User: "Remove the meeting task"
→ {"intent": "fast_task", "confidence": 0.95, "action": "delete", "title": "meeting", "doc_id": null, "clarification_needed": false, "clarification_question": null}

User: "Plan my week based on my priorities"
→ {"intent": "reasoning", "confidence": 0.9, "action": null, "title": null, "doc_id": null, "clarification_needed": false, "clarification_question": null}

User: "Summarize the meeting notes document"
→ {"intent": "document", "confidence": 0.9, "action": null, "title": null, "doc_id": null, "clarification_needed": false, "clarification_question": null}

User: "Hello"
→ {"intent": "smalltalk", "confidence": 0.99, "action": null, "title": null, "doc_id": null, "clarification_needed": false, "clarification_question": null}

Respond with ONLY the JSON object, no other text."""


def create_router_llm():
    """Create the phi3:mini router LLM."""
    base_url = os.getenv("AI_MODEL_URL", "http://localhost:11434")
    
    # Clean URL for langchain-ollama (needs just http://host:port)
    if "/v1" in base_url:
        base_url = base_url.split("/v1")[0]
    if base_url.endswith("/"):
        base_url = base_url[:-1]
    
    # Debug log
    print(f"[Router] Using Ollama at: {base_url}")
    
    return ChatOllama(
        model="phi3:mini",
        base_url=base_url,
        temperature=0.1,  # Low temperature for deterministic routing
        format="json"
    )


def route_intent(user_message: str) -> RouterOutput:
    """
    Route user intent using phi3:mini.
    Returns structured RouterOutput.
    """
    print(f"[Router] Classifying: '{user_message}'")
    
    llm = create_router_llm()
    
    messages = [
        SystemMessage(content=ROUTER_SYSTEM_PROMPT),
        HumanMessage(content=user_message)
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        print(f"[Router] Raw response: {content[:200]}")
        
        # Parse JSON
        data = json.loads(content)
        
        result = RouterOutput(
            intent=data.get("intent", "smalltalk"),
            confidence=data.get("confidence", 0.5),
            action=data.get("action"),
            title=data.get("title"),
            doc_id=data.get("doc_id"),
            clarification_needed=data.get("clarification_needed", False),
            clarification_question=data.get("clarification_question")
        )
        print(f"[Router] Classified as: {result.intent} (action={result.action}, title={result.title})")
        return result
        
    except json.JSONDecodeError as e:
        print(f"[Router] JSON parse error: {e}")
        # Fallback: try to extract intent from text
        content_lower = response.content.lower() if response else ""
        if "fast_task" in content_lower or "create" in content_lower or "add" in content_lower:
            return RouterOutput(intent="fast_task", confidence=0.7, action="create")
        elif "reasoning" in content_lower or "plan" in content_lower:
            return RouterOutput(intent="reasoning", confidence=0.7)
        elif "document" in content_lower:
            return RouterOutput(intent="document", confidence=0.7)
        else:
            return RouterOutput(intent="smalltalk", confidence=0.5)
    except Exception as e:
        print(f"[Router] Error: {type(e).__name__}: {e}")
        # Error fallback
        return RouterOutput(
            intent="smalltalk",
            confidence=0.3,
            clarification_needed=True,
            clarification_question=f"I had trouble understanding. Could you rephrase?"
        )
