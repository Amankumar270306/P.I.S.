"use client";

import React, { useState } from "react";
import { Task, TaskStatus, TaskPriority } from "@/types/task";
import { TaskList } from "@/lib/api";
import { Check, Pencil, X, ChevronDown, ChevronUp, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AllTasksTableProps {
    tasks: Task[];
    lists: TaskList[];
    onTaskUpdate: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
    isLoading?: boolean;
}

const STATUS_STYLES: Record<TaskStatus, { label: string; bg: string; text: string }> = {
    todo: { label: "To Do", bg: "bg-slate-100", text: "text-slate-600" },
    in_progress: { label: "In Progress", bg: "bg-amber-50", text: "text-amber-700" },
    done: { label: "Done", bg: "bg-emerald-50", text: "text-emerald-700" },
};

const PRIORITY_STYLES: Record<string, { dot: string }> = {
    high: { dot: "bg-red-500" },
    medium: { dot: "bg-amber-400" },
    low: { dot: "bg-blue-400" },
};

type SortField = "title" | "status" | "priority" | "createdAt" | "deadline";

export function AllTasksTable({ tasks, lists, onTaskUpdate, onTaskDelete, isLoading }: AllTasksTableProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<Task>>({});
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortAsc, setSortAsc] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const listMap = new Map(lists.map(l => [l.id, l]));

    const getListName = (listId?: string) => {
        if (!listId) return "—";
        const list = listMap.get(listId);
        return list?.name || "—";
    };

    const getListColor = (listId?: string) => {
        if (!listId) return undefined;
        return listMap.get(listId)?.color;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
    };

    // Filter
    const filtered = filterStatus === "all" ? tasks : tasks.filter(t => t.status === filterStatus);

    // Sort
    const sorted = [...filtered].sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
            case "title": cmp = a.title.localeCompare(b.title); break;
            case "status": cmp = a.status.localeCompare(b.status); break;
            case "priority": cmp = (a.priority || "medium").localeCompare(b.priority || "medium"); break;
            case "createdAt": cmp = (a.createdAt || "").localeCompare(b.createdAt || ""); break;
            case "deadline": cmp = (a.deadline || "9999").localeCompare(b.deadline || "9999"); break;
        }
        return sortAsc ? cmp : -cmp;
    });

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortAsc(!sortAsc);
        else { setSortField(field); setSortAsc(true); }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === sorted.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(sorted.map(t => t.id)));
    };

    const startEdit = (task: Task) => {
        setEditingId(task.id);
        setEditValues({ title: task.title, status: task.status, priority: task.priority, energyCost: task.energyCost });
    };

    const cancelEdit = () => { setEditingId(null); setEditValues({}); };

    const saveEdit = (task: Task) => {
        onTaskUpdate({ ...task, ...editValues });
        setEditingId(null);
        setEditValues({});
    };

    const bulkComplete = () => {
        selectedIds.forEach(id => {
            const task = tasks.find(t => t.id === id);
            if (task && task.status !== "done") onTaskUpdate({ ...task, status: "done" });
        });
        setSelectedIds(new Set());
    };

    const bulkDelete = () => {
        selectedIds.forEach(id => onTaskDelete(id));
        setSelectedIds(new Set());
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronDown className="size-3 opacity-30" />;
        return sortAsc ? <ChevronUp className="size-3 text-indigo-500" /> : <ChevronDown className="size-3 text-indigo-500" />;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            {/* Header Bar */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-slate-800 text-sm tracking-tight">All Tasks</h2>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{tasks.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Filter */}
                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                        <ListFilter className="size-3.5 text-slate-400 ml-1.5" />
                        {["all", "todo", "in_progress", "done"].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={cn(
                                    "px-2 py-1 text-xs rounded-md transition-colors font-medium",
                                    filterStatus === s
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {s === "all" ? "All" : s === "in_progress" ? "Active" : s === "todo" ? "To Do" : "Done"}
                            </button>
                        ))}
                    </div>

                    {/* Bulk Actions */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200">
                            <span className="text-xs text-slate-500">{selectedIds.size} selected</span>
                            <button
                                onClick={bulkComplete}
                                className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 font-medium transition-colors"
                            >
                                ✓ Done
                            </button>
                            <button
                                onClick={bulkDelete}
                                className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-md hover:bg-red-100 font-medium transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10">
                        <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                            <th className="pl-5 pr-2 py-2.5 w-8">
                                <input
                                    type="checkbox"
                                    checked={sorted.length > 0 && selectedIds.size === sorted.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 size-3.5"
                                />
                            </th>
                            <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("title")}>
                                <span className="flex items-center gap-1">Task <SortIcon field="title" /></span>
                            </th>
                            <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("status")}>
                                <span className="flex items-center gap-1">Status <SortIcon field="status" /></span>
                            </th>
                            <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("priority")}>
                                <span className="flex items-center gap-1">Priority <SortIcon field="priority" /></span>
                            </th>
                            <th className="px-3 py-2.5">List</th>
                            <th className="px-3 py-2.5">Energy</th>
                            <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                                <span className="flex items-center gap-1">Created <SortIcon field="createdAt" /></span>
                            </th>
                            <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("deadline")}>
                                <span className="flex items-center gap-1">Deadline <SortIcon field="deadline" /></span>
                            </th>
                            <th className="px-3 py-2.5 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center py-10 text-slate-400 text-sm">
                                    No tasks found
                                </td>
                            </tr>
                        ) : sorted.map(task => {
                            const isEditing = editingId === task.id;
                            const statusStyle = STATUS_STYLES[task.status] || STATUS_STYLES.todo;
                            const priorityDot = PRIORITY_STYLES[(task.priority || "medium")] || PRIORITY_STYLES.medium;
                            const listColor = getListColor(task.listId);

                            return (
                                <tr
                                    key={task.id}
                                    className={cn(
                                        "hover:bg-slate-50/80 transition-colors group",
                                        selectedIds.has(task.id) && "bg-indigo-50/40",
                                        task.status === "done" && "opacity-60"
                                    )}
                                >
                                    {/* Checkbox */}
                                    <td className="pl-5 pr-2 py-2.5">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(task.id)}
                                            onChange={() => toggleSelect(task.id)}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 size-3.5"
                                        />
                                    </td>

                                    {/* Title */}
                                    <td className="px-3 py-2.5 max-w-[240px]">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editValues.title || ""}
                                                onChange={e => setEditValues({ ...editValues, title: e.target.value })}
                                                className="w-full px-2 py-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                                                autoFocus
                                            />
                                        ) : (
                                            <span className={cn(
                                                "font-medium text-slate-800 truncate block",
                                                task.status === "done" && "line-through text-slate-400"
                                            )}>
                                                {task.title}
                                            </span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="px-3 py-2.5">
                                        {isEditing ? (
                                            <select
                                                value={editValues.status || task.status}
                                                onChange={e => setEditValues({ ...editValues, status: e.target.value as TaskStatus })}
                                                className="px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none"
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>
                                        ) : (
                                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusStyle.bg, statusStyle.text)}>
                                                {statusStyle.label}
                                            </span>
                                        )}
                                    </td>

                                    {/* Priority */}
                                    <td className="px-3 py-2.5">
                                        {isEditing ? (
                                            <select
                                                value={editValues.priority || task.priority || "medium"}
                                                onChange={e => setEditValues({ ...editValues, priority: e.target.value as TaskPriority })}
                                                className="px-2 py-1 text-xs border border-slate-200 rounded bg-white focus:outline-none"
                                            >
                                                <option value="high">High</option>
                                                <option value="medium">Medium</option>
                                                <option value="low">Low</option>
                                            </select>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs text-slate-600 capitalize">
                                                <span className={cn("size-2 rounded-full", priorityDot.dot)} />
                                                {task.priority || "medium"}
                                            </span>
                                        )}
                                    </td>

                                    {/* List */}
                                    <td className="px-3 py-2.5">
                                        {listColor ? (
                                            <span className="flex items-center gap-1.5 text-xs text-slate-600">
                                                <span className="size-2 rounded-full flex-shrink-0" style={{ backgroundColor: listColor }} />
                                                <span className="truncate max-w-[100px]">{getListName(task.listId)}</span>
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-300">—</span>
                                        )}
                                    </td>

                                    {/* Energy */}
                                    <td className="px-3 py-2.5">
                                        <span className="text-xs text-slate-500 font-mono">{task.energyCost}p</span>
                                    </td>

                                    {/* Created */}
                                    <td className="px-3 py-2.5">
                                        <span className="text-xs text-slate-400">{formatDate(task.createdAt)}</span>
                                    </td>

                                    {/* Deadline */}
                                    <td className="px-3 py-2.5">
                                        <span className="text-xs text-slate-400">{formatDate(task.deadline)}</span>
                                    </td>

                                    {/* Actions */}
                                    <td className="px-3 py-2.5">
                                        {isEditing ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => saveEdit(task)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                                                    <Check className="size-3.5" />
                                                </button>
                                                <button onClick={cancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded transition-colors">
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => startEdit(task)}
                                                className="p-1 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
