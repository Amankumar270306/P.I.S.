import os
import requests
import json
from typing import List, Dict

def query_custom_ai(system_prompt: str, user_message: str) -> str:
    """
    Sends a request to the self-hosted AI model.
    """
    url = os.getenv("AI_MODEL_URL")
    api_key = os.getenv("AI_API_KEY")
    
    if not url:
        return "Error: AI_MODEL_URL is not configured."

    headers = {
        "Content-Type": "application/json"
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "model": "custom-model", # Often ignored by local models, but required by schema
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Standard OpenAI-compatible response structure
        return data["choices"][0]["message"]["content"]
        
    except requests.exceptions.ConnectionError:
        return "Broadcasting Error: The local AI brain seems to be offline."
    except Exception as e:
        return f"AI Error: {str(e)}"
