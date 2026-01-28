"use client";

import React, { useState, useEffect } from "react";
import * as chrono from "chrono-node";
import { Calendar, CornerDownLeft, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SmartInputProps {
    onCreateTask?: (task: { title: string; date: Date | null }) => void;
}

export function SmartInput({ onCreateTask }: SmartInputProps) {
    const [text, setText] = useState("");
    const [parsedDate, setParsedDate] = useState<Date | null>(null);

    useEffect(() => {
        const results = chrono.parse(text);
        if (results.length > 0) {
            setParsedDate(results[0].start.date());
        } else {
            setParsedDate(null);
        }
    }, [text]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (text.trim()) {
                onCreateTask?.({ title: text, date: parsedDate });
                setText("");
                setParsedDate(null);
            }
        }
    };

    return (
        <div className="relative group">
            <div className={cn(
                "relative flex items-center bg-white border rounded-xl overflow-hidden transition-all shadow-sm",
                parsedDate ? "border-indigo-500 ring-4 ring-indigo-500/10" : "border-slate-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-500/10"
            )}>
                <div className="pl-4 text-slate-400">
                    <Sparkles className={cn("size-5 transition-colors", parsedDate ? "text-indigo-500" : "text-slate-400")} />
                </div>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a task (e.g., 'Review PRs tomorrow at 10am')..."
                    className="w-full px-4 py-4 bg-transparent border-none outline-none resize-none text-slate-700 placeholder:text-slate-400 h-[60px] align-middle"
                />
                <div className="pr-4">
                    <div className="size-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-400">
                        <CornerDownLeft className="size-4" />
                    </div>
                </div>
            </div>

            {/* Smart Badge Feedback */}
            {parsedDate && (
                <div className="absolute top-full left-0 mt-2 flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                    <Calendar className="size-4" />
                    <span>
                        Detected: {format(parsedDate, "MMM d, h:mm a")}
                    </span>
                </div>
            )}
        </div>
    );
}
