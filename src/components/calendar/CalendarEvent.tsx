"use client";

import { CalendarEvent as ICalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";
import { Zap, Pencil, Trash2, X, Check } from "lucide-react";
import { useState } from "react";
import { Task } from "@/types/task";

interface CalendarEventProps {
    event: ICalendarEvent;
    onEdit?: (updates: Partial<Task>) => void;
    onDelete?: () => void;
}

export function CalendarEvent({ event, onEdit, onDelete }: CalendarEventProps) {
    const [showActions, setShowActions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 60 minutes = 60px height (1px per minute)
    const pixelsPerMinute = 1;
    const height = Math.max(30, event.durationMinutes * pixelsPerMinute);

    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const minutesFromStart = startHour * 60 + startMinute;
    const top = Math.max(0, minutesFromStart * pixelsPerMinute);

    let bgClass = "bg-indigo-500 text-white border-none";

    if (event.energyCost < 0) {
        bgClass = "bg-emerald-500 text-white border-none"; // Recovery
    } else if (event.energyCost >= 8) {
        bgClass = "bg-rose-500 text-white border-none"; // High energy
    } else if (event.energyCost >= 4) {
        bgClass = "bg-blue-500 text-white border-none"; // Medium
    }

    const handleDelete = () => {
        onDelete?.();
        setShowDeleteConfirm(false);
    };

    return (
        <div
            className={cn(
                "absolute left-1 right-1 rounded-lg border p-2 text-xs shadow-sm overflow-hidden flex flex-col gap-0.5 transition-all hover:z-10 hover:shadow-md cursor-pointer group",
                bgClass
            )}
            style={{
                top: `${top}px`,
                height: `${height}px`,
            }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => {
                setShowActions(false);
                setShowDeleteConfirm(false);
            }}
        >
            <div className="font-semibold leading-tight text-white mb-0.5 flex-1">
                <span className="line-clamp-2">{event.title}</span>
            </div>
            <div className="text-[10px] text-white/80 flex items-center justify-between">
                <span>
                    {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                    {' - '}
                    {new Date(event.startTime.getTime() + event.durationMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                <span className="flex items-center gap-0.5">
                    <Zap className="size-2.5" />
                    {event.energyCost}
                </span>
            </div>

            {/* Action buttons */}
            {(onEdit || onDelete) && showActions && !showDeleteConfirm && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // For now, just trigger a basic edit (can expand later)
                            }}
                            className="p-1 bg-white/20 hover:bg-white/40 rounded text-white transition-colors"
                            title="Edit"
                        >
                            <Pencil className="size-3" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(true);
                            }}
                            className="p-1 bg-white/20 hover:bg-red-500/80 rounded text-white transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="size-3" />
                        </button>
                    )}
                </div>
            )}

            {/* Delete confirmation */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-2 rounded-lg">
                    <span className="text-white text-xs">Delete?</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        className="p-1 bg-red-500 hover:bg-red-600 rounded text-white"
                    >
                        <Check className="size-3" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(false);
                        }}
                        className="p-1 bg-slate-500 hover:bg-slate-600 rounded text-white"
                    >
                        <X className="size-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
