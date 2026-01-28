"use client";

import { useState } from "react";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { MatrixView } from "@/components/tasks/MatrixView";
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog";
import { Plus, LayoutTemplate, LayoutGrid } from "lucide-react";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

// Mock Data
const initialTasks: Task[] = [
    { id: '1', title: 'Complete Project Board', status: 'in-progress', energyCost: 5, context: 'Work', priority: 'high' },
    { id: '2', title: 'Review PRs', status: 'todo', energyCost: 3, context: 'Work', priority: 'medium' },
    { id: '3', title: 'Buy Groceries', status: 'todo', energyCost: 2, context: 'Errand', priority: 'low' },
    { id: '4', title: 'Schedule Dentist', status: 'todo', energyCost: 1, context: 'Personal', priority: 'low' },
    { id: '5', title: 'Refactor Auth', status: 'done', energyCost: 8, context: 'Work', priority: 'high' },
];

type ViewMode = 'board' | 'matrix';

export default function TasksPage() {
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [view, setView] = useState<ViewMode>('board');
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    // Handler to update a single task (passed to MatrixView)
    const handleTaskUpdate = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    return (
        <div className="max-w-6xl mx-auto py-6 px-4 h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tasks</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and track your energy-based tasks.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex p-1 bg-slate-100/80 rounded-lg border border-slate-200/60">
                        <button
                            onClick={() => setView('board')}
                            className={cn(
                                "p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium",
                                view === 'board' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            <LayoutTemplate className="size-3.5" />
                            Board
                        </button>
                        <button
                            onClick={() => setView('matrix')}
                            className={cn(
                                "p-1.5 rounded-md transition-all flex items-center gap-2 text-xs font-medium",
                                view === 'matrix' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            <LayoutGrid className="size-3.5" />
                            Matrix
                        </button>
                    </div>

                    <button
                        onClick={() => setIsAddTaskOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-200"
                    >
                        <Plus className="size-4" />
                        <span>Add Task</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0 bg-white/50 rounded-xl border border-slate-200/60 shadow-sm overflow-hidden backdrop-blur-sm">
                {view === 'board' ? (
                    <TaskBoard initialTasks={tasks} />
                ) : (
                    <MatrixView tasks={tasks} onTaskUpdate={handleTaskUpdate} />
                )}
            </div>

            <AddTaskDialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen} />
        </div>
    );
}
