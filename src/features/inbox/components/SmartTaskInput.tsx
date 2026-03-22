"use client";

import React, { useState, useRef, useEffect } from "react";
import { Zap, CornerDownLeft } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SmartTaskInputProps {
    onSubmit?: (task: { title: string; priority: string; context: string; energyCost: number }) => void;
}

export function SmartTaskInput({ onSubmit }: SmartTaskInputProps) {
    const [value, setValue] = useState("");
    const [energySuggestion, setEnergySuggestion] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Sync scroll between textarea and overlay
    const handleScroll = () => {
        if (textareaRef.current && overlayRef.current) {
            overlayRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    // Smart Energy Logic
    useEffect(() => {
        const lower = value.toLowerCase();
        if (lower.includes("code") || lower.includes("study") || lower.includes("build") || lower.includes("debug")) {
            setEnergySuggestion(8);
        } else if (lower.includes("call") || lower.includes("email") || lower.includes("meeting") || lower.includes("sync")) {
            setEnergySuggestion(2);
        } else {
            setEnergySuggestion(null);
        }
    }, [value]);

    // Parsing Logic for Highlighting
    const renderHighlightedText = () => {
        if (!value) return null;

        // Escape HTML to prevent XSS in the overlay rendering
        // (Simulated here by just checking chunks) but typically we would secure this.
        // For this visual layer, we splits string by regex matches.

        // Regexes
        const dateRegex = /(tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(at\s*\d+(\s*(am|pm))?)?/gi;
        const tagRegex = /#\w+/g;
        const priorityRegex = /!!/g;

        // We need a way to wrap matches. A simple approach is multiple replace passes with unique tokens, but that's messy.
        // Better: Split by all regexes combined? Complex.
        // Simple approach for this demo: Split by specific priority, then map.
        // Actually, let's just use a dangerous inner HTML approach for the overlay since it's just mirroring local input.

        let html = value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Highlight Priority !!
        html = html.replace(priorityRegex, (match) => `<span class="text-rose-600 font-bold bg-rose-50 rounded px-0.5">${match}</span>`);

        // Highlight Tags #Context
        html = html.replace(tagRegex, (match) => `<span class="text-purple-600 font-bold bg-purple-50 rounded px-0.5">${match}</span>`);

        // Highlight Dates (Simple approximation)
        html = html.replace(dateRegex, (match) => `<span class="text-blue-600 font-semibold bg-blue-50 rounded px-0.5 relative group cursor-help">${match}<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">Scheduled for Jan 26, 17:00</span></span>`);

        // Preserve trailing newlines for correct rendering match
        if (value.endsWith("\n")) {
            html += "<br />";
        }

        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-3">
            <div className="relative group bg-white rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all overflow-hidden">
                {/* Overlay Layer (Syntax Highlighting) */}
                <div
                    ref={overlayRef}
                    className="absolute inset-0 p-4 font-sans text-lg leading-relaxed whitespace-pre-wrap break-words pointer-events-none text-transparent z-0 overflow-auto"
                    aria-hidden="true"
                >
                    {renderHighlightedText()}
                </div>

                {/* Input Layer */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onScroll={handleScroll}
                    placeholder="What needs to be done? (Try 'Call Mom tomorrow at 5pm !! #Personal')"
                    className="w-full h-32 p-4 font-sans text-lg leading-relaxed bg-transparent border-none outline-none focus:ring-0 resize-none text-slate-800 placeholder:text-slate-400 z-10 relative"
                    spellCheck={false}
                />

                {/* Footer / Suggestion Chip */}
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 h-8">
                        {energySuggestion !== null && (
                            <div className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <Zap className="size-3 fill-current" />
                                <span>Suggested: {energySuggestion} Energy</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            if (!value.trim()) return;

                            // Basic Parsing
                            let priority = "medium";
                            if (value.includes("!!")) priority = "high";

                            let context = "Deep Work"; // Default
                            const tagMatch = value.match(/#(\w+)/);
                            if (tagMatch) context = tagMatch[1];

                            // Remove tags/priority from title for cleaner display? 
                            // Or keep them? Keeping them is simpler for now.
                            // Actually cleaner title is nicer.
                            const title = value.replace(/!!/g, "").replace(/#\w+/g, "").trim();

                            onSubmit?.({
                                title: title || value, // Fallback if regex stripped everything
                                priority,
                                context,
                                energyCost: energySuggestion || 5
                            });

                            setValue(""); // Reset
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!value.trim()}
                    >
                        <CornerDownLeft className="size-4" />
                    </button>
                </div>
            </div>

            <div className="text-center text-xs text-slate-400">
                Type <span className="font-mono text-rose-500">!!</span> for priority, <span className="font-mono text-purple-500">#</span> for context, or <span className="font-mono text-blue-500">time</span> to schedule.
            </div>
        </div>
    );
}
