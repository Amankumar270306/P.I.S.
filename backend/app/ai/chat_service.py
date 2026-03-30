"""
Plori AI Chat Service — Orchestrates conversation with tool calling.
"""
import os
import json
from typing import List, Generator
from openai import OpenAI

from app.ai.tools.definitions import TOOLS
from app.ai.tools.task_tool import execute_create_task

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL", "nvidia/nemotron-3-super-120b-a12b:free"
)

SYSTEM_PROMPT = """You are Plori, a friendly and highly capable AI assistant built into P.I.S. (Personal Intelligence Scheduler).
You help users think through their tasks, plan their day, brainstorm ideas, draft documents, and answer questions.
Be concise, warm, and helpful. Use markdown formatting when it improves readability.

IMPORTANT RULES FOR TASK CREATION:
- You have a tool called `create_task` that creates tasks in the user's task manager.
- When a user asks you to add/create a task, ALWAYS gather these details before calling the tool:
  1. Task title (required) - confirm if the phrasing is clear
  2. Deadline date & time (optional) - ask if they want a specific date/time
  3. Importance (optional) - ask if this is important
  4. Urgency (optional) - ask if this is urgent
  5. Energy cost (optional) - how much energy? (1-10 scale, each point = ~10 min)
  6. Priority (optional) - low, medium, or high?
- If the user provides ALL necessary info in one message (title + clearly states date/importance/urgency), go ahead and create the task immediately.
- If info is missing or ambiguous, ask SHORT clarifying questions. Don't ask all questions at once — ask the most important 1-2 missing pieces.
- After creating a task, confirm it was created with a brief summary.
- For dates, the current server timezone is UTC. Convert user-friendly dates like "tomorrow", "next Monday", etc. to ISO format.
"""

# Registry: map tool names to their executor functions
TOOL_EXECUTORS = {
    "create_task": execute_create_task,
}


class ChatService:
    def __init__(self):
        self.client = OpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=OPENROUTER_API_KEY,
        )
        self.model = OPENROUTER_MODEL

    def _build_messages(self, message: str, history: List[dict]) -> list:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        # Keep only the last 10 messages for context
        recent = history[-10:] if len(history) > 10 else history
        for msg in recent:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": message})
        return messages

    def _execute_tool(self, tool_name: str, arguments: dict, user_id: str) -> dict:
        """Look up and execute a tool by name."""
        executor = TOOL_EXECUTORS.get(tool_name)
        if executor:
            return executor(arguments, user_id)
        return {"error": f"Unknown tool: {tool_name}"}

    def stream_with_tools(
        self, message: str, history: List[dict], user_id: str
    ) -> Generator[dict, None, None]:
        """
        Stream response with tool calling support.
        Yields dicts:
          {"type": "token", "content": "..."}
          {"type": "tool_result", "data": {...}}
        """
        messages = self._build_messages(message, history)

        # First call: may return content or a tool call
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            stream=False,
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "P.I.S. Plori",
            },
        )

        choice = response.choices[0]

        # Case 1: Model wants to call a tool
        if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
            tool_call = choice.message.tool_calls[0]
            tool_name = tool_call.function.name
            try:
                tool_args = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                tool_args = {}

            # Execute the tool
            tool_result = self._execute_tool(tool_name, tool_args, user_id)

            # Emit tool result event to frontend
            yield {
                "type": "tool_result",
                "data": {
                    "tool": tool_name,
                    "args": tool_args,
                    "result": tool_result,
                },
            }

            # Feed tool result back to the model for a human-friendly response
            messages.append(choice.message.model_dump())
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(tool_result),
                }
            )

            # Stream the follow-up response
            follow_up = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=True,
                extra_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "P.I.S. Plori",
                },
            )
            for chunk in follow_up:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield {"type": "token", "content": chunk.choices[0].delta.content}

        # Case 2: Model responds with text (asking questions or normal chat)
        else:
            content = choice.message.content or ""
            if content:
                words = content.split(" ")
                chunk = ""
                for i, word in enumerate(words):
                    chunk += word + (" " if i < len(words) - 1 else "")
                    if len(chunk) > 20 or i == len(words) - 1:
                        yield {"type": "token", "content": chunk}
                        chunk = ""
