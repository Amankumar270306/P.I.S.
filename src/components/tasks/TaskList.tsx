"use client";

import { useState } from 'react';
import { Plus, Zap } from 'lucide-react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';

interface TaskListProps {
    initialTasks: Task[];
}

export function TaskList({ initialTasks }: TaskListProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    // Simple mock grouping for now, assuming all passed tasks are "Today" or we split them manually.
    // Requirement says: Group into "Today's Plan" vs "Backlog".
    // Let's assume we filter by some property or just split array.
    // For this mock, let's say "todo" & "in-progress" are Today, and we could have a "Backlog" list separate conceptually,
    // but let's stick to the prompt's request to "Group tasks into headers".
    // I'll assume we pass ALL tasks and I'll split them arbitrarily or by status for this demo, 
    // OR I will just render two hardcoded sections if data allows. 
    // Let's assume the passed `initialTasks` are ALL "Today's Plan" for now, and I'll create a mock backlog within.

    const todayTasks = tasks;
    const totalEnergy = todayTasks.reduce((acc, task) => acc + task.energyCost, 0);

    const handleAddTask = () => {
        const newTask: Task = {
            id: Date.now().toString(),
            title: "New Task",
            status: 'todo',
            energyCost: 3,
            context: 'Work'
        };
        setTasks([...tasks, newTask]);
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

                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                        <span>Total Energy Required:</span>
                        <div className="flex items-center gap-1 text-slate-900">
                            <Zap className="size-4 text-yellow-500" fill="currentColor" />
                            <span>{totalEnergy}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {todayTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}

                    <button
                        onClick={handleAddTask}
                        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-2 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all group"
                    >
                        <Plus className="size-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Add Task</span>
                    </button>
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
