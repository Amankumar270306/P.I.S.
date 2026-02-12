"use client";

import { useState } from "react";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { MatrixView } from "@/components/tasks/MatrixView";
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog";
import { TaskListSelector } from "@/components/tasks/TaskListSelector";
import { AllTasksTable } from "@/components/tasks/AllTasksTable";
import { Plus, LayoutTemplate, LayoutGrid, ArrowLeft } from "lucide-react";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, updateTask, createTask, deleteTask, getTaskLists, createTaskList, deleteTaskList, TaskList } from "@/lib/api";

type ViewMode = 'board' | 'matrix';

export default function TasksPage() {
    const queryClient = useQueryClient();
    const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
    const [view, setView] = useState<ViewMode>('board');
    const [selectedList, setSelectedList] = useState<TaskList | null>(null);

    // Fetch Task Lists
    const { data: lists = [], isLoading: listsLoading } = useQuery({
        queryKey: ['taskLists'],
        queryFn: () => getTaskLists()
    });

    // Fetch ALL tasks (for the permanent table)
    const { data: allTasks = [], isLoading: allTasksLoading } = useQuery({
        queryKey: ['tasks', 'all'],
        queryFn: () => getTasks()
    });

    // Fetch Tasks for selected list
    const { data: tasks = [], isLoading: tasksLoading } = useQuery({
        queryKey: ['tasks', selectedList?.id],
        queryFn: () => getTasks(selectedList?.id),
        enabled: !!selectedList
    });

    // Create List Mutation
    const createListMutation = useMutation({
        mutationFn: ({ name, color }: { name: string; color: string }) => createTaskList(name, color),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskLists'] });
        }
    });

    // Delete List Mutation
    const deleteListMutation = useMutation({
        mutationFn: (id: string) => deleteTaskList(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['taskLists'] });
        }
    });

    // Update Task Mutation
    const updateTaskMutation = useMutation({
        mutationFn: (variables: { id: string; updates: Partial<Task> }) => updateTask(variables.id, variables.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    // Create Task Mutation
    const createTaskMutation = useMutation({
        mutationFn: (newTask: any) => createTask({ ...newTask, list_id: selectedList?.id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsAddTaskOpen(false);
        }
    });

    // Delete Task Mutation
    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: string) => deleteTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        }
    });

    const handleCreateTask = (task: any) => {
        const formatDateWithTime = (date: Date | null, timeStr?: string) => {
            if (!date) return undefined;
            if (!timeStr) return date.toISOString();

            const [hours, minutes] = timeStr.split(':').map(Number);
            const newDate = new Date(date);
            newDate.setHours(hours, minutes, 0, 0);
            return newDate.toISOString();
        };

        const finalDeadline = formatDateWithTime(task.date, task.endedAt);
        const referenceDate = task.date || new Date();
        const finalStartedAt = task.startedAt ? formatDateWithTime(referenceDate, task.startedAt) : undefined;
        const finalEndedAt = task.endedAt ? formatDateWithTime(referenceDate, task.endedAt) : undefined;

        createTaskMutation.mutate({
            title: task.title,
            energyCost: task.energyCost,
            context: task.description || "",
            deadline: finalDeadline,
            startedAt: finalStartedAt,
            endedAt: finalEndedAt,
            importance: task.importance,
            isUrgent: task.isUrgent
        });
    };

    const handleTaskUpdate = async (updatedTask: Task) => {
        updateTaskMutation.mutate({ id: updatedTask.id, updates: updatedTask });
    };

    const handleTaskDelete = async (taskId: string) => {
        deleteTaskMutation.mutate(taskId);
    };

    // Show list selector if no list is selected
    if (!selectedList) {
        return (
            <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
                {/* Permanent All Tasks Table */}
                <AllTasksTable
                    tasks={allTasks}
                    lists={lists}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                    isLoading={allTasksLoading}
                />

                {/* Task List Selector */}
                <TaskListSelector
                    lists={lists}
                    onSelectList={setSelectedList}
                    onCreateList={(name, color) => createListMutation.mutate({ name, color })}
                    onDeleteList={(id) => deleteListMutation.mutate(id)}
                    isLoading={listsLoading}
                />
            </div>
        );
    }

    // Show task board/matrix for selected list
    return (
        <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
            {/* Permanent All Tasks Table */}
            <AllTasksTable
                tasks={allTasks}
                lists={lists}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                isLoading={allTasksLoading}
            />

            {/* Selected List Header + Board */}
            <div className="flex flex-col" style={{ height: "calc(100vh - 500px)", minHeight: "400px" }}>
                <header className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedList(null)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: selectedList.color }}
                                />
                                {selectedList.name}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Manage and track your tasks</p>
                        </div>
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
                    {tasksLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                        </div>
                    ) : view === 'board' ? (
                        <TaskBoard initialTasks={tasks} onTaskEdit={handleTaskUpdate} onTaskDelete={handleTaskDelete} />
                    ) : (
                        <MatrixView tasks={tasks} onTaskUpdate={handleTaskUpdate} />
                    )}
                </div>
            </div>

            <AddTaskDialog
                open={isAddTaskOpen}
                onOpenChange={setIsAddTaskOpen}
                onSubmit={handleCreateTask}
            />
        </div>
    );
}
