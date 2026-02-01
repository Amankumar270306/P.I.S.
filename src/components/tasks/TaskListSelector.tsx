"use client";

import React, { useState } from "react";
import { Plus, List, FolderOpen, Trash2 } from "lucide-react";
import { TaskList } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TaskListSelectorProps {
    lists: TaskList[];
    onSelectList: (list: TaskList) => void;
    onCreateList: (name: string, color: string) => void;
    onDeleteList: (id: string) => void;
    isLoading?: boolean;
}

const COLORS = [
    "#6366f1", // Indigo
    "#8b5cf6", // Violet  
    "#ec4899", // Pink
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#06b6d4", // Cyan
];

export function TaskListSelector({
    lists,
    onSelectList,
    onCreateList,
    onDeleteList,
    isLoading
}: TaskListSelectorProps) {
    const [showCreate, setShowCreate] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);

    const handleCreate = () => {
        if (newListName.trim()) {
            onCreateList(newListName.trim(), selectedColor);
            setNewListName("");
            setShowCreate(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Task Lists</h1>
                <p className="text-slate-500 text-sm mt-1">Select a list to view and manage tasks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lists.map((list) => (
                    <div
                        key={list.id}
                        className="group relative bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer"
                        onClick={() => onSelectList(list)}
                    >
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                            style={{ backgroundColor: `${list.color}20` }}
                        >
                            <FolderOpen className="size-6" style={{ color: list.color }} />
                        </div>
                        <h3 className="font-semibold text-slate-800 text-lg">{list.name}</h3>
                        <p className="text-slate-400 text-sm mt-1">Click to open</p>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteList(list.id);
                            }}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                ))}

                {/* Create New List Card */}
                {!showCreate ? (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-6 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center min-h-[160px]"
                    >
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                            <Plus className="size-6 text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-500">Create New List</span>
                    </button>
                ) : (
                    <div className="bg-white rounded-xl border border-indigo-200 p-6 ring-2 ring-indigo-100">
                        <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="List name..."
                            className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-300 mb-4"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />

                        <div className="flex gap-2 mb-4">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={cn(
                                        "w-6 h-6 rounded-full transition-transform",
                                        selectedColor === color && "ring-2 ring-offset-2 ring-slate-400 scale-110"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCreate}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
