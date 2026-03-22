"use client";

import React, { useEffect, useState } from "react";
import { X, Play, Pause, CheckCircle2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useFocus } from "@/providers/FocusContext";

export function FocusOverlay() {
    const { isFocusModeActive, activeTask, endSession } = useFocus();

    // Timer state (25 minutes in seconds)
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isPaused, setIsPaused] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Reset timer when session starts
    useEffect(() => {
        if (isFocusModeActive) {
            setTimeLeft(25 * 60);
            setIsPaused(false);
        }
    }, [isFocusModeActive]);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isFocusModeActive && !isPaused && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            // Timer finished logic can go here
        }
        return () => clearInterval(interval);
    }, [isFocusModeActive, isPaused, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isFocusModeActive) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-[100] bg-slate-900 text-white flex flex-col items-center justify-center transition-opacity duration-500",
            isFocusModeActive ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium tracking-widest uppercase">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    Deep Work Mode
                </div>
                <button
                    onClick={endSession}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Content */}
            <div className="text-center space-y-12 max-w-4xl px-6">
                <div className="space-y-4">
                    <h2 className="text-slate-400 text-xl font-light">Current Focus</h2>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight">
                        {activeTask}
                    </h1>
                </div>

                <div className="text-[12rem] font-bold tabular-nums leading-none tracking-tighter text-indigo-500/90 font-mono select-none">
                    {formatTime(timeLeft)}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-8">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full text-lg font-medium transition-all hover:scale-105 backdrop-blur-sm"
                    >
                        {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
                        {isPaused ? "Resume" : "Pause"}
                    </button>

                    <button
                        onClick={endSession}
                        className="flex items-center gap-3 px-8 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-full text-lg font-medium transition-all hover:scale-105 backdrop-blur-sm border border-emerald-500/20"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        Complete Task
                    </button>
                </div>
            </div>

            {/* Footer / Audio Toggle */}
            <div className="absolute bottom-10">
                <button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                        audioEnabled
                            ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-300"
                            : "bg-transparent border-slate-700 text-slate-500 hover:text-slate-300"
                    )}
                >
                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {audioEnabled ? "Binaural Beats Active" : "Enable Audio Focus"}
                </button>
            </div>
        </div>
    );
}
