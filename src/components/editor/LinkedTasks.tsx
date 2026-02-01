"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTasks } from "@/lib/api";
import { Task } from "@/types/task";

interface LinkedTasksProps {
    sourceType?: "email" | "document";
    sourceId?: string | null;
}

export function LinkedTasks({ sourceType, sourceId }: LinkedTasksProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch tasks when sourceId changes
    useEffect(() => {
        const fetchLinkedTasks = async () => {
            if (!sourceId) {
                setTasks([]);
                return;
            }

            setIsLoading(true);
            try {
                // For now, fetch all tasks - can filter by linked_email_id or linked_doc_id later
                const allTasks = await getTasks();
                // Filter by source type (will need backend support for proper linking)
                setTasks(allTasks.slice(0, 5)); // Show first 5 for now
            } catch (error) {
                console.error("Failed to fetch linked tasks", error);
                setTasks([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLinkedTasks();
    }, [sourceId, sourceType]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "done":
                return "text-green-500";
            case "in_progress":
                return "text-indigo-500";
            default:
                return "text-slate-300";
        }
    };

    return (
        <div className="w-full h-full border-l border-slate-200 bg-slate-50 p-6 overflow-y-auto">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                    Linked Tasks
                </h3>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                ) : !sourceId ? (
                    <div className="text-sm text-slate-400 text-center py-8">
                        Select a {sourceType === "email" ? "email" : "document"} to see linked tasks
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-sm text-slate-400 text-center py-8">
                        No linked tasks
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                            >
                                <div className={cn("mt-0.5", getStatusColor(task.status))}>
                                    {task.status === "done" ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-medium truncate", task.status === "done" ? "text-slate-500 line-through" : "text-slate-700")}>
                                        {task.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Energy: {task.energyCost}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button className="w-full py-2 text-sm text-indigo-600 font-medium border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                <Plus className="size-4 inline mr-1" />
                Link Task
            </button>
        </div>
    );
}
