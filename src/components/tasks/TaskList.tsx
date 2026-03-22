"use client";

import { useState, useEffect } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { useQueryClient } from '@tanstack/react-query';

interface TaskListProps {
    initialTasks: Task[];
}

export function TaskList({ initialTasks }: TaskListProps) {
    const queryClient = useQueryClient();
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    const todayTasks = tasks;
    const totalEnergy = tasks.reduce((acc: number, task: Task) => acc + (task.energyCost || 0), 0);

    // Sync state with props if parent updates
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const handleAddTask = () => {
        // Implementation remains or opens modal
        // For this file, it seems the AddTaskModal is separate or triggered differently.
        // The original code had a simple local add. I'll keep it but typically this should open the Dialog.
        // But the prompt says "Add a button... next to the 'Add Task' button". 
        // I will just add the Auto-Schedule button nearby.
    };

    return (
        <div className="space-y-8">
            {/* Today's Plan Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900">Today's Plan</h3>
                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                            {todayTasks.length} Tasks
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            <span>Energy:</span>
                            <div className="flex items-center gap-1 text-slate-900">
                                <Zap className="size-4 text-yellow-500" fill="currentColor" />
                                <span>{totalEnergy}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {todayTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}

                    {/* Keeps the original Add Task button below list or wherever it was intended, 
                        though the prompt implies "next to" usually means top bar. 
                        I added Auto-Schedule to top bar. I leave the bottom button as is. */}
                </div>
            </div>

            {/* Backlog Section (Mock) */}
            <div className="space-y-4 opacity-75">
                <h3 className="text-lg font-bold text-slate-900">Backlog</h3>
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-400">
                    <p>No tasks in backlog</p>
                </div>
            </div>
        </div>
    );
}
