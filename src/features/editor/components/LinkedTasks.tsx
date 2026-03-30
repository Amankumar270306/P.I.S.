"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Plus, Loader2, FileText } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { getTasks } from '@/shared/lib/api/tasks';;
import { Task } from "@/shared/types/task";

interface LinkedTasksProps {
    sourceType?: "email" | "document";
    sourceId?: string | null;
    documentTitle?: string;
}

export function LinkedTasks({ sourceType = "document", sourceId, documentTitle }: LinkedTasksProps) {
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
                const allTasks = await getTasks();
                // Filter tasks that have this document ID in their context
                const linkedTasks = allTasks.filter(task =>
                    task.context && (
                        task.context.includes(sourceId) ||
                        (documentTitle && task.context.toLowerCase().includes(documentTitle.toLowerCase()))
                    )
                );
                setTasks(linkedTasks);
            } catch (error) {
                console.error("Failed to fetch linked tasks", error);
                setTasks([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLinkedTasks();
    }, [sourceId, sourceType, documentTitle]);

    const getStatusColor = (statusId: number) => {
        switch (statusId) {
            case 3:
                return "text-green-500";
            case 2:
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
                    <div className="text-center py-8">
                        <FileText className="size-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-400">
                            Select a {sourceType === "email" ? "email" : "document"} to see linked tasks
                        </p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="size-5 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400">
                            No tasks linked to this {sourceType}
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                            Use AI Chat to create linked tasks
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-200 transition-colors"
                            >
                                <div className={cn("mt-0.5", getStatusColor(task.status_id))}>
                                    {task.status_id === 3 ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-medium truncate", task.status_id === 3 ? "text-slate-500 line-through" : "text-slate-700")}>
                                        {task.title}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {task.energyCost} pts ({task.energyCost * 10} min)
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button
                className="w-full py-2 text-sm text-indigo-600 font-medium border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                disabled={!sourceId}
            >
                <Plus className="size-4 inline mr-1" />
                Link Task
            </button>
        </div>
    );
}
