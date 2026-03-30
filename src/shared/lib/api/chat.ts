export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    toolResult?: ToolResult;
}

export interface ToolResult {
    tool: string;
    args: Record<string, any>;
    result: {
        success: boolean;
        task_id?: string;
        title?: string;
        message?: string;
        error?: string;
    };
}

/**
 * Sends a chat message and returns an async generator that yields events
 * as they stream in from the server (SSE).
 */
export async function* streamChat(
    message: string,
    history: ChatMessage[]
): AsyncGenerator<{ type: 'token'; content: string } | { type: 'tool_result'; data: ToolResult }, void, unknown> {
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('pis_user') : null;
    let userId = '';
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            userId = user?.id || '';
        } catch {}
    }

    // Strip toolResult from history before sending (backend doesn't need it)
    // Keep only the last 10 messages for context
    const recentHistory = history.slice(-10);
    const cleanHistory = recentHistory.map(m => ({ role: m.role, content: m.content }));

    const response = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
        },
        body: JSON.stringify({ message, history: cleanHistory }),
    });

    if (!response.ok) {
        throw new Error(`Chat request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') return;

            try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                    throw new Error(parsed.error);
                }
                if (parsed.token) {
                    yield { type: 'token', content: parsed.token };
                }
                if (parsed.tool_result) {
                    yield { type: 'tool_result', data: parsed.tool_result as ToolResult };
                }
            } catch (e) {
                if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                    console.warn('SSE parse warning:', data);
                }
            }
        }
    }
}
