"use client";

import { Email } from "@/types/email";
import { CheckSquare, FileText, Trash2, ArrowLeft, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReadingPaneProps {
    email: Email | null;
    onClose?: () => void; // For mobile back behavior if needed
}

export function ReadingPane({ email, onClose }: ReadingPaneProps) {
    const [showTaskPopover, setShowTaskPopover] = useState(false);

    if (!email) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MoreHorizontal className="size-8 text-slate-300" />
                </div>
                <p>Select an email to view</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Action Bar */}
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    {/* Mobile Back Button Placeholder - logic managed by parent usually */}
                </div>

                <div className="flex items-center gap-2">

                    <div className="relative">
                        <button
                            onClick={() => setShowTaskPopover(!showTaskPopover)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                                showTaskPopover
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                            )}
                        >
                            <CheckSquare className="size-4" />
                            Convert to Task
                        </button>

                        {showTaskPopover && (
                            <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-20 animate-in fade-in zoom-in-95 duration-200">
                                <h4 className="font-semibold text-slate-900 mb-2">Create Task</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 block mb-1">Energy Cost</label>
                                        <div className="flex gap-2">
                                            {[1, 3, 5, 8].map(cost => (
                                                <button key={cost} className="flex-1 py-1.5 text-xs font-medium border border-slate-200 rounded hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600">
                                                    ⚡ {cost}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                                        onClick={() => {
                                            alert(`Created task from: ${email.subject}`);
                                            setShowTaskPopover(false);
                                        }}
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => alert("Saved to Brain!")}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600 transition-colors"
                    >
                        <FileText className="size-4" />
                        Save to Brain
                    </button>

                    <div className="w-px h-6 bg-slate-200 mx-2" />

                    <button className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="size-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#fdfdfd]">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="space-y-4 border-b border-slate-100 pb-6">
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                            {email.subject}
                        </h1>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    {email.sender.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{email.sender}</p>
                                    <p className="text-xs text-slate-500">to me</p>
                                </div>
                            </div>
                            <span className="text-sm text-slate-400">{email.time}</span>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none text-slate-600">
                        {email.body.split('\n').map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
