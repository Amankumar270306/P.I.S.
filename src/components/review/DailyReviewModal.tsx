"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Archive, X, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DailyReviewModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [energyLevel, setEnergyLevel] = useState(50);

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-[151] grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-700 bg-slate-900 p-8 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl text-slate-100">
                    <div className="flex flex-col gap-1.5 text-center sm:text-left">
                        <Dialog.Title className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                            <Moon className="w-6 h-6 text-indigo-400" />
                            Daily System Shutdown
                        </Dialog.Title>
                        <Dialog.Description className="text-slate-400">
                            Reflect on your day and clear your mind for tomorrow.
                        </Dialog.Description>
                    </div>

                    <div className="grid gap-8 py-4">
                        {/* Energy Reality Check */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-slate-300">
                                You planned 35 Energy Units. How did you feel?
                            </label>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Exhausted</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={energyLevel}
                                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Energetic</span>
                            </div>
                        </div>

                        {/* Unfinished Business */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-slate-300 border-b border-slate-800 pb-2">Unfinished Business</h4>
                            <div className="space-y-2">
                                {['Review PR #123', 'Email Marketing Team'].map((task, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                        <span className="text-sm text-slate-300">{task}</span>
                                        <div className="flex gap-2">
                                            <button className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded transition-colors" title="Reschedule">
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded transition-colors" title="Move to Backlog">
                                                <Archive className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Journal */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Notes / Blockers</label>
                            <textarea
                                className="w-full min-h-[100px] bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                                placeholder="What's on your mind?..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20"
                        >
                            Complete Shutdown
                        </button>
                    </div>

                    <Dialog.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-slate-900 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-slate-800 text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                        <span className="sr-only">Close</span>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
