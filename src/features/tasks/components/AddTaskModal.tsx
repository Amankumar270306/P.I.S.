"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Sparkles, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useUI } from "@/providers/UIContext";
import { cn } from "@/shared/lib/utils";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, ContextEnum } from '@/shared/lib/api/tasks';;

const CONTEXTS = [
    { id: 'deep_work', label: 'Deep Work', apiValue: ContextEnum.DEEP_WORK, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { id: 'admin', label: 'Admin', apiValue: ContextEnum.ADMIN, color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'errand', label: 'Errand', apiValue: ContextEnum.ERRAND, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'meeting', label: 'Meeting', apiValue: ContextEnum.MEETING, color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

export function AddTaskModal() {
    const { isTaskModalOpen, closeTaskModal } = useUI();
    const [title, setTitle] = useState("");
    const [energy, setEnergy] = useState(3);
    const [context, setContext] = useState("deep_work");
    const [date, setDate] = useState<Date>(new Date());

    const queryClient = useQueryClient();

    // Reset state when opened
    useEffect(() => {
        if (isTaskModalOpen) {
            setTitle("");
            setEnergy(3);
            setContext("deep_work");
            setDate(new Date());
        }
    }, [isTaskModalOpen]);

    const mutation = useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            // console.log("Task scheduled!"); // Toast placeholder
            closeTaskModal();
        },
        onError: (error) => {
            console.error("Failed to create task", error);
            alert("Failed to create task. Is the backend running?");
        }
    });

    const getEnergyColor = (val: number) => {
        if (val <= 2) return "bg-emerald-500";
        if (val <= 6) return "bg-amber-500";
        return "bg-rose-500";
    };

    const getEnergyLabel = (val: number) => {
        const mins = val * 10;
        if (mins < 60) return `${mins} min`;
        return `${(mins / 60).toFixed(1)} hrs`;
    };



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedContext = CONTEXTS.find(c => c.id === context)?.apiValue || ContextEnum.DEEP_WORK;

        mutation.mutate({
            title,
            energyCost: energy,
            context: selectedContext,
            deadline: date.toISOString(),
            status_id: 1
        });
    };

    return (
        <Dialog.Root open={isTaskModalOpen} onOpenChange={closeTaskModal}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-2xl border border-slate-200 focus:outline-none animate-in fade-in zoom-in-95 duration-200">
                    <Dialog.Title className="sr-only">Add New Task</Dialog.Title>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full text-2xl font-bold placeholder:text-slate-300 border-none outline-none bg-transparent"
                                autoFocus
                            />
                            <Dialog.Close asChild>
                                <button type="button" className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </Dialog.Close>
                        </div>

                        {/* Body Constraints */}
                        <div className="space-y-6">
                            {/* Energy Slider */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-slate-500">Energy (1 pt = 10 min)</span>
                                    <span className={cn("px-2 py-0.5 rounded text-white text-xs", getEnergyColor(energy))}>
                                        {energy} pts - {getEnergyLabel(energy)}
                                    </span>
                                </div>
                                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={cn("absolute top-0 left-0 h-full transition-all duration-300", getEnergyColor(energy))}
                                        style={{ width: `${(energy / 12) * 100}%` }}
                                    />
                                </div>
                                {/* Invisible larger hit area */}
                                <input
                                    type="range"
                                    min="0.5"
                                    max="12"
                                    step="0.5"
                                    value={energy}
                                    onChange={(e) => setEnergy(parseFloat(e.target.value))}
                                    className="w-full opacity-0 cursor-pointer absolute -mt-4 h-6"
                                    style={{ marginTop: '-12px', zIndex: 10 }}
                                />
                                {/* Visual Slider Thumb (Input) */}
                                <input
                                    type="range"
                                    min="0.5"
                                    max="12"
                                    step="0.5"
                                    value={energy}
                                    onChange={(e) => setEnergy(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-slate-200 [&::-webkit-slider-thumb]:mt-[-6px] relative z-20"
                                />
                            </div>

                            {/* Context Chips */}
                            <div className="space-y-3">
                                <span className="text-sm font-medium text-slate-500">Context</span>
                                <div className="flex flex-wrap gap-2">
                                    {CONTEXTS.map((ctx) => (
                                        <button
                                            key={ctx.id}
                                            type="button"
                                            onClick={() => setContext(ctx.id)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                                                context === ctx.id ? ctx.color + " ring-2 ring-offset-1 ring-indigo-500/20" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                            )}
                                        >
                                            {ctx.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Deadline */}
                            <div className="space-y-3">
                                <span className="text-sm font-medium text-slate-500">Deadline</span>
                                <div className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 w-fit hover:border-slate-300 cursor-pointer bg-white">
                                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm text-slate-700">{format(date, "MMM d, yyyy")}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 flex items-center justify-between border-t border-slate-100">


                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className={cn(
                                    "bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors",
                                    mutation.isPending && "opacity-70 cursor-not-allowed"
                                )}
                            >
                                {mutation.isPending ? "Scheduling..." : "Add to Schedule"}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
