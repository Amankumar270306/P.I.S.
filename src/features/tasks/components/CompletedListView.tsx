"use client";

import { Task } from "@/shared/types/task";
import { TaskCard } from "./TaskCard";

interface CompletedListViewProps {
    tasks: Task[];
    onTaskUpdate: (task: Task) => void;
}

export function CompletedListView({ tasks, onTaskUpdate }: CompletedListViewProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
                <p>No completed tasks yet.</p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-3 overflow-y-auto h-full max-h-[calc(100vh-200px)]">
            {tasks.map(task => (
                <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={onTaskUpdate}
                />
            ))}
        </div>
    );
}
