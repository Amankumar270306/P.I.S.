"use client";

import { useState } from 'react';
import { Zap, Pencil, Trash2, X, Check } from 'lucide-react';
import { Task } from '@/shared/types/task';
import { cn } from '@/shared/lib/utils';

interface TaskCardProps {
    task: Task;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const handleSaveEdit = () => {
        if (editTitle.trim() && editTitle !== task.title) {
            onEdit?.({ ...task, title: editTitle.trim() });
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        onDelete?.(task.id);
        setShowConfirmDelete(false);
    };

    return (
        <div className="group flex flex-col gap-2 p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("size-2 rounded-full flex-shrink-0", {
                        'bg-slate-300': task.status_id === 1,
                        'bg-indigo-500': task.status_id === 2,
                        'bg-green-500': task.status_id === 3,
                    })} />

                    {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded outline-none focus:ring-2 focus:ring-indigo-200"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                            />
                            <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <Check className="size-4" />
                            </button>
                            <button onClick={() => setIsEditing(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                <X className="size-4" />
                            </button>
                        </div>
                    ) : (
                        <span className="font-medium text-slate-700 truncate">{task.title}</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Action buttons - show on hover */}
                    {!isEditing && !showConfirmDelete && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    setEditTitle(task.title);
                                    setIsEditing(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Edit task"
                            >
                                <Pencil className="size-3.5" />
                            </button>
                            <button
                                onClick={() => setShowConfirmDelete(true)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete task"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Delete confirmation */}
                    {showConfirmDelete && (
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600 mr-1">Delete?</span>
                            <button onClick={handleDelete} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                <Check className="size-4" />
                            </button>
                            <button onClick={() => setShowConfirmDelete(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                <X className="size-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        <Zap className="size-3 text-yellow-500" fill="currentColor" />
                        <span>{task.energyCost}</span>
                    </div>
                </div>
            </div>

            {task.context && !isEditing && (
                <p className="text-sm text-slate-500 pl-5 truncate">
                    {task.context}
                </p>
            )}
        </div>
    );
}
