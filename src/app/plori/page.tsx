"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Sparkles, Trash2, Loader2, CheckCircle2, ListTodo, Calendar, Star, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { streamChat, ChatMessage, ToolResult } from "@/shared/lib/api/chat";
import { useQueryClient } from "@tanstack/react-query";

function TaskCreatedCard({ result }: { result: ToolResult }) {
    const { args, result: res } = result;
    if (!res.success) {
        return (
            <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <span className="font-medium">Failed to create task:</span> {res.error}
            </div>
        );
    }
    return (
        <div className="mt-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">Task Created</span>
            </div>
            <div className="flex items-center gap-2">
                <ListTodo className="size-3.5 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-800">{res.title}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {args.deadline && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <Calendar className="size-2.5" />
                        {new Date(args.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
                {args.importance && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        <Star className="size-2.5" /> Important
                    </span>
                )}
                {args.is_urgent && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="size-2.5" /> Urgent
                    </span>
                )}
                {args.energy_cost && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">
                        <Zap className="size-2.5" /> {args.energy_cost} pts
                    </span>
                )}
            </div>
        </div>
    );
}

export default function PloriPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const queryClient = useQueryClient();

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + "px";
        }
    }, [input]);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || isStreaming) return;

        const userMessage: ChatMessage = { role: "user", content: trimmed };
        const history = [...messages];

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsStreaming(true);

        const assistantMessage: ChatMessage = { role: "assistant", content: "" };
        setMessages((prev) => [...prev, assistantMessage]);

        try {
            let fullContent = "";
            let toolResult: ToolResult | undefined;

            for await (const event of streamChat(trimmed, history)) {
                if (event.type === "token") {
                    fullContent += event.content;
                    setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            role: "assistant",
                            content: fullContent,
                            toolResult,
                        };
                        return updated;
                    });
                } else if (event.type === "tool_result") {
                    toolResult = event.data;
                    setMessages((prev) => {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            role: "assistant",
                            content: fullContent,
                            toolResult,
                        };
                        return updated;
                    });
                    // Invalidate tasks query so other pages refresh
                    if (toolResult.result.success) {
                        queryClient.invalidateQueries({ queryKey: ['tasks'] });
                        queryClient.invalidateQueries({ queryKey: ['energy', 'today'] });
                    }
                }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                    role: "assistant",
                    content: "Sorry, I couldn't connect to the AI service. Please check that the backend is running and your OpenRouter API key is configured.",
                };
                return updated;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-200/50">
                        <Sparkles className="size-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Plori</h1>
                        <p className="text-xs text-slate-400">AI Assistant • Can create tasks for you</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={clearChat}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="size-3.5" />
                        Clear
                    </button>
                )}
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-in fade-in duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-indigo-400/20 rounded-full blur-2xl scale-150" />
                            <div className="relative flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-xl shadow-indigo-300/30">
                                <Sparkles className="size-10 text-white" />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Hey, I'm Plori</h2>
                            <p className="text-slate-500 text-sm max-w-md">
                                Your AI assistant that can create tasks, plan your day, and answer questions. Try asking me to add a task!
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                            {[
                                "Add a task: finish report by Friday",
                                "Create an urgent task for today",
                                "Help me plan my week",
                                "Brainstorm project ideas"
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => {
                                        setInput(suggestion);
                                        inputRef.current?.focus();
                                    }}
                                    className="px-4 py-3 text-sm text-left text-slate-600 bg-white hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all shadow-sm"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex gap-3 animate-in slide-in-from-bottom-2 duration-300",
                            msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        {/* Avatar */}
                        <div
                            className={cn(
                                "flex items-center justify-center size-8 rounded-lg shrink-0 mt-0.5",
                                msg.role === "user"
                                    ? "bg-indigo-100 text-indigo-600"
                                    : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm"
                            )}
                        >
                            {msg.role === "user" ? (
                                <User className="size-4" />
                            ) : (
                                <Bot className="size-4" />
                            )}
                        </div>

                        {/* Bubble */}
                        <div className="max-w-[75%]">
                            <div
                                className={cn(
                                    "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-br-md"
                                        : "bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm"
                                )}
                            >
                                {msg.content || (
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Loader2 className="size-4 animate-spin" />
                                        <span className="text-xs">Thinking...</span>
                                    </div>
                                )}
                            </div>
                            {/* Tool Result Card */}
                            {msg.toolResult && (
                                <TaskCreatedCard result={msg.toolResult} />
                            )}
                        </div>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 pb-6 pt-2">
                <div className={cn(
                    "relative flex items-end gap-2 bg-white border rounded-2xl px-4 py-3 shadow-sm transition-all",
                    isStreaming
                        ? "border-violet-300 ring-2 ring-violet-100"
                        : "border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100"
                )}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isStreaming ? "Plori is working..." : "Message Plori... (e.g. 'Add a task to review the budget tomorrow')"}
                        disabled={isStreaming}
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 text-sm resize-none max-h-[150px] py-1 disabled:opacity-50"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isStreaming}
                        className={cn(
                            "flex items-center justify-center size-9 rounded-xl shrink-0 transition-all",
                            input.trim() && !isStreaming
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                                : "bg-slate-100 text-slate-300 cursor-not-allowed"
                        )}
                    >
                        {isStreaming ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Send className="size-4" />
                        )}
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2">
                    Plori can create tasks directly in your scheduler. Just ask!
                </p>
            </div>
        </div>
    );
}
