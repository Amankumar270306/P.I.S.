"use client";

import React, { useState, useEffect } from "react";
import * as chrono from "chrono-node";
import { Calendar, CornerDownLeft, Sparkles, ChevronDown, ChevronUp, Clock, Zap, AlertTriangle, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SmartInputProps {
    onCreateTask?: (task: {
        title: string;
        date: Date | null;
        description?: string;
        startedAt?: string;
        endedAt?: string;
        energyCost: number;
        importance: boolean;
        isUrgent: boolean;
    }) => void;
}

export function SmartInput({ onCreateTask }: SmartInputProps) {
    const [text, setText] = useState("");
    const [description, setDescription] = useState("");
    const [parsedDate, setParsedDate] = useState<Date | null>(null);
    const [showOptions, setShowOptions] = useState(false);

    // Additional Options
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [energyCost, setEnergyCost] = useState(3);
    const [importance, setImportance] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const results = chrono.parse(text);
        if (results.length > 0) {
            setParsedDate(results[0].start.date());
        } else {
            setParsedDate(null);
        }
    }, [text]);

    const handleCreate = () => {
        if (text.trim()) {
            onCreateTask?.({
                title: text,
                date: parsedDate,
                description: description || undefined,
                startedAt: startTime || undefined,
                endedAt: endTime || undefined,
                energyCost,
                importance,
                isUrgent
            });
            // Reset form
            setText("");
            setDescription("");
            setParsedDate(null);
            setStartTime("");
            setEndTime("");
            setEnergyCost(3);
            setImportance(false);
            setIsUrgent(false);
            setShowOptions(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleCreate();
        }
    };

    return (
        <div className="relative group space-y-3">
            <div className={cn(
                "relative flex flex-col bg-white border rounded-xl overflow-hidden transition-all shadow-sm",
                parsedDate ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10"
            )}>
                <div className="flex items-center w-full">
                    <div className="pl-4 text-slate-400">
                        <Sparkles className={cn("size-5 transition-colors", parsedDate ? "text-indigo-500" : "text-slate-400")} />
                    </div>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a task..."
                        className="w-full px-4 py-4 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 h-[60px]"
                    />
                    <div className="pr-4 flex items-center gap-2">
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="More Options"
                        >
                            {showOptions ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </button>
                        <button
                            onClick={handleCreate}
                            className="size-8 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 transition-colors"
                        >
                            <CornerDownLeft className="size-4" />
                        </button>
                    </div>
                </div>

                {showOptions && (
                    <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 space-y-4 pt-4 animate-in slide-in-from-top-2">
                        {/* Description */}
                        <div>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add context, details, or notes..."
                                className="w-full p-3 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-300 resize-none h-20"
                            />
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                <Calendar className="size-3" /> Due Date {parsedDate && <span className="text-indigo-500">(or detected: {format(parsedDate, 'MMM d')})</span>}
                            </label>
                            <input
                                type="date"
                                value={parsedDate ? format(parsedDate, 'yyyy-MM-dd') : ''}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setParsedDate(new Date(e.target.value));
                                    } else {
                                        setParsedDate(null);
                                    }
                                }}
                                className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-300"
                            />
                        </div>

                        {/* Times */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                    <Clock className="size-3" /> Start Time (Optional)
                                </label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-300"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                    <Clock className="size-3" /> End Time (Optional)
                                </label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full p-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-300"
                                />
                            </div>
                        </div>

                        {/* Toggles & Sliders */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                        <Zap className="size-3 text-yellow-500 fill-current" /> Energy: {energyCost} pts ({energyCost * 10} min)
                                    </label>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="12"
                                    step="0.5"
                                    value={energyCost}
                                    onChange={(e) => setEnergyCost(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 px-1">
                                    <span>5 min</span>
                                    <span>2 hrs</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={importance}
                                        onChange={(e) => setImportance(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                                        <Star className={cn("size-3", importance ? "text-yellow-400 fill-current" : "text-slate-400")} /> Important
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isUrgent}
                                        onChange={(e) => setIsUrgent(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 transition-colors"
                                    />
                                    <span className="text-sm text-slate-600 group-hover:text-slate-900 flex items-center gap-1">
                                        <AlertTriangle className={cn("size-3", isUrgent ? "text-red-500" : "text-slate-400")} /> Urgent
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Smart Badge Feedback */}
            {parsedDate && (
                <div className="absolute top-full left-0 mt-2 flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-1 z-10">
                    <Calendar className="size-4" />
                    <span>
                        Detected: {format(parsedDate, "MMM d, h:mm a")}
                    </span>
                </div>
            )}
        </div>
    );
}
