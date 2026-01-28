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
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
                    <p className="text-slate-500 mt-1">Manage and track your energy-based tasks.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setView('board')}
                            className={cn(
                                "p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium",
                                view === 'board' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <LayoutTemplate className="size-4" />
                            Board
                        </button>
                        <button
                            onClick={() => setView('matrix')}
                            className={cn(
                                "p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium",
                                view === 'matrix' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <LayoutGrid className="size-4" />
                            Matrix
                        </button>
                    </div>

                    <button
                        onClick={() => setIsAddTaskOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus className="size-4" />
                        <span>Add Task</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0">
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
