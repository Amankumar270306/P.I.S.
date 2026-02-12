"""
Intent Router for Multi-Model LangGraph System.
Uses OpenRouter API for fast intent classification.
"""

import os
import json
from typing import Optional
from pydantic import BaseModel, Field

from agent.openrouter import chat_completion


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


def route_intent(user_message: str) -> RouterOutput:
    """
    Route user intent using OpenRouter API.
    Returns structured RouterOutput.
    """
    print(f"[Router] Classifying: '{user_message}'")

    messages = [
        {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    try:
        content = chat_completion(
            messages=messages,
            temperature=0.1,
            max_tokens=256,
        )
        content = content.strip()
        print(f"[Router] Raw response: {content[:200]}")

        data = json.loads(content)

        result = RouterOutput(
            intent=data.get("intent", "smalltalk"),
            confidence=data.get("confidence", 0.5),
            action=data.get("action"),
            title=data.get("title"),
            doc_id=data.get("doc_id"),
            clarification_needed=data.get("clarification_needed", False),
            clarification_question=data.get("clarification_question"),
        )
        print(f"[Router] Classified as: {result.intent} (action={result.action}, title={result.title})")
        return result

    except json.JSONDecodeError as e:
        print(f"[Router] JSON parse error: {e}")
        
        # Try to extract JSON from within the response text
        from agent.openrouter import _extract_json_from_text
        extracted = _extract_json_from_text(content)
        if extracted:
            try:
                data = json.loads(extracted)
                result = RouterOutput(
                    intent=data.get("intent", "smalltalk"),
                    confidence=data.get("confidence", 0.6),
                    action=data.get("action"),
                    title=data.get("title"),
                    doc_id=data.get("doc_id"),
                    clarification_needed=data.get("clarification_needed", False),
                    clarification_question=data.get("clarification_question"),
                )
                print(f"[Router] Extracted JSON → {result.intent} (action={result.action})")
                return result
            except (json.JSONDecodeError, Exception):
                pass
        
        # Fallback: classify based on the USER'S message, NOT the AI response
        user_lower = user_message.lower()
        print(f"[Router] Falling back to keyword matching on: '{user_lower}'")
        
        # Energy patterns (check BEFORE list to avoid misroute)
        if any(p in user_lower for p in ["energy", "capacity", "how much time", "remaining point",
                "how tired", "bandwidth"]):
            return RouterOutput(intent="fast_task", confidence=0.8, action="energy")
        # List/query patterns
        if any(p in user_lower for p in ["what task", "show task", "list task", "my task", 
                "what do i have", "what's on", "how many task", "today", "pending",
                "show me", "what are my"]):
            return RouterOutput(intent="fast_task", confidence=0.7, action="list")
        # Delete patterns
        if any(p in user_lower for p in ["delete ", "remove ", "clear all", "delete_all"]):
            if "all" in user_lower:
                return RouterOutput(intent="fast_task", confidence=0.7, action="delete_all")
            return RouterOutput(intent="fast_task", confidence=0.7, action="delete",
                                title=user_lower.split("delete")[-1].split("remove")[-1].strip())
        # Complete patterns  
        if any(p in user_lower for p in ["complete ", "mark done", "finish ", "done "]):
            return RouterOutput(intent="fast_task", confidence=0.7, action="complete")
        # Create patterns (must be AFTER list/delete to avoid false positives)
        if any(p in user_lower for p in ["add ", "create ", "new task", "schedule ", "assign "]):
            return RouterOutput(intent="fast_task", confidence=0.7, action="create")
        # Document patterns
        if any(p in user_lower for p in ["document", "summarize", "read ", "notes"]):
            return RouterOutput(intent="document", confidence=0.7)
        # Reasoning patterns
        if any(p in user_lower for p in ["plan ", "prioritize", "break down", "analyze"]):
            return RouterOutput(intent="reasoning", confidence=0.7)
        
        return RouterOutput(intent="smalltalk", confidence=0.5)
    except Exception as e:
        print(f"[Router] Error: {type(e).__name__}: {e}")
        return RouterOutput(
            intent="smalltalk",
            confidence=0.3,
            clarification_needed=True,
            clarification_question="I had trouble understanding. Could you rephrase?",
        )
