"""
OpenRouter API helper for P.I.S. AI Agent.
Replaces local Ollama calls with the OpenRouter cloud API.
"""

import os
import re
import json
import requests
from typing import List, Dict, Optional


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "stepfun/step-3.5-flash:free"


def get_api_key() -> str:
    """Get the OpenRouter API key from environment."""
    key = os.getenv("OPENROUTER_API_KEY", "")
    if not key:
        raise RuntimeError("OPENROUTER_API_KEY not set. Add it to your .env file.")
    return key


def _extract_json_from_text(text: str) -> Optional[str]:
    """Try to extract a JSON object from mixed text (e.g. reasoning output)."""
    if not text:
        return None
    # Try to find a JSON object {...} in the text
    match = re.search(r'\{[^{}]*\}', text, re.DOTALL)
    if match:
        candidate = match.group(0)
        try:
            json.loads(candidate)  # validate it's real JSON
            return candidate
        except json.JSONDecodeError:
            pass
    # Try finding a larger nested JSON
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        candidate = match.group(0)
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            pass
    return None


def chat_completion(
    messages: List[Dict[str, str]],
    model: str = DEFAULT_MODEL,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> str:
    """
    Call the OpenRouter API and return the assistant's response content.
    
    Args:
        messages: List of {"role": "...", "content": "..."} dicts.
        model: Model identifier on OpenRouter.
        temperature: Sampling temperature.
        max_tokens: Max tokens for the response.
    
    Returns:
        The assistant's response text.
    """
    headers = {
        "Authorization": f"Bearer {get_api_key()}",
        "Content-Type": "application/json",
    }

    payload: Dict = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            data=json.dumps(payload),
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()

        msg = data["choices"][0]["message"]
        content = msg.get("content") or ""

        # If content is empty, try to extract JSON from reasoning field
        if not content.strip():
            reasoning = msg.get("reasoning") or ""
            if reasoning:
                print(f"[OpenRouter] Content was empty, extracting from reasoning")
                extracted = _extract_json_from_text(reasoning)
                if extracted:
                    print(f"[OpenRouter] Extracted JSON from reasoning: {extracted[:200]}")
                    return extracted
                # Last resort: return the reasoning text
                content = reasoning

        return content

    except requests.exceptions.Timeout:
        raise RuntimeError("OpenRouter API request timed out.")
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else "unknown"
        detail = e.response.text[:300] if e.response else str(e)
        print(f"[OpenRouter] HTTP {status} error: {detail}")
        raise RuntimeError(f"OpenRouter API error (HTTP {status}): {detail}")
    except (KeyError, IndexError):
        raise RuntimeError("Unexpected response format from OpenRouter API.")
