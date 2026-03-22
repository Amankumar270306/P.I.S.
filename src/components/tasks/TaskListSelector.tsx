"use client";

import React, { useState } from "react";
import { Plus, List, FolderOpen, Trash2, Edit3 } from "lucide-react";
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
        <div className="max-w-[1400px] mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-800">Task Lists</h1>
                <p className="text-slate-500 text-xs mt-1">Select a list to view and manage tasks</p>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {lists.map((list) => (
                    <div
                        key={list.id}
                        className="group relative bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer flex flex-col items-start"
                        onClick={() => onSelectList(list)}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: `${list.color}20` }}
                        >
                            <FolderOpen className="size-5" style={{ color: list.color }} />
                        </div>
                        <h3 className="font-semibold text-slate-800 text-base">{list.name}</h3>
                        <p className="text-slate-400 text-xs mt-1">Click to open</p>

                        {!list.is_permanent && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        alert("Edit feature coming soon!");
                                    }}
                                    className="p-1.5 text-slate-300 hover:text-indigo-500 transition-colors"
                                >
                                    <Edit3 className="size-3.5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteList(list.id);
                                    }}
                                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {/* Create New List Card */}
                {!showCreate ? (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center min-h-[140px]"
                    >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                            <Plus className="size-5 text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-500 text-sm">Create New</span>
                    </button>
                ) : (
                    <div className="bg-white rounded-xl border border-indigo-200 p-4 ring-2 ring-indigo-100 min-h-[140px] flex flex-col justify-center">
                        <input
                            type="text"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            placeholder="List name..."
                            className="w-full p-2 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-300 mb-3"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />

                        <div className="flex gap-1.5 mb-3 flex-wrap">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={cn(
                                        "w-5 h-5 rounded-full transition-transform",
                                        selectedColor === color && "ring-2 ring-offset-1 ring-slate-400 scale-110"
                                    )}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCreate}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium"
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
