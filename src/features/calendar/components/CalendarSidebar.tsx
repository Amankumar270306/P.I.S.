"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Check, X, ChevronDown, Clock, Zap } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { cn } from "@/shared/lib/utils";
import { Task } from "@/shared/types/task";

interface CalendarSidebarProps {
    selectedDate?: Date;
    onSelectDate?: (date: Date) => void;
    tasks?: Task[];
    onTaskEdit?: (task: Task) => void;
    onTaskDelete?: (taskId: string) => void;
}

export function CalendarSidebar({
    selectedDate = new Date(),
    onSelectDate,
    tasks = [],
    onTaskEdit,
    onTaskDelete
}: CalendarSidebarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(selectedDate);
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (selectedDate) {
            setCurrentMonth(selectedDate);
        }
    }, [selectedDate]);

    const days = React.useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    // Get tasks for selected date
    const selectedDateTasks = React.useMemo(() => {
        return tasks.filter(task => {
            if (!task.startedAt) return false;
            const taskDate = new Date(task.startedAt);
            return format(taskDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
        }).sort((a, b) => {
            const aTime = new Date(a.startedAt!).getTime();
            const bTime = new Date(b.startedAt!).getTime();
            return aTime - bTime;
        });
    }, [tasks, selectedDate]);

    // Get upcoming tasks for today
    const upcomingTasks = React.useMemo(() => {
        const now = new Date();
        return tasks.filter(task => {
            if (!task.startedAt) return false;
            const taskDate = new Date(task.startedAt);
            return isToday(taskDate) && taskDate > now;
        }).sort((a, b) => {
            const aTime = new Date(a.startedAt!).getTime();
            const bTime = new Date(b.startedAt!).getTime();
            return aTime - bTime;
        }).slice(0, 3);
    }, [tasks]);

    const handleDelete = (taskId: string) => {
        onTaskDelete?.(taskId);
        setDeleteConfirmId(null);
    };

    return (
        <div className="w-[300px] bg-white h-full flex flex-col text-slate-900 p-6 gap-8 shrink-0 overflow-y-auto border-l border-slate-200">
            {/* Mini Calendar */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {format(currentMonth, "MMMM yyyy")}
                    </h2>
                    <div className="flex gap-1">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
                            <ChevronLeft className="size-4" />
                        </button>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors">
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                        <div key={i} className="text-slate-400 font-medium py-1">{day}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {days.map((day) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDate = isSameDay(day, new Date());
                        const hasTasks = tasks.some(t => t.startedAt && format(new Date(t.startedAt), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => onSelectDate?.(day)}
                                className={cn(
                                    "aspect-square flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors relative",
                                    !isCurrentMonth && "text-slate-300",
                                    isSelected && "bg-indigo-600 text-white font-bold hover:bg-indigo-700",
                                    !isSelected && isTodayDate && "bg-slate-900 text-white font-bold hover:bg-slate-800"
                                )}
                            >
                                {format(day, "d")}
                                {hasTasks && !isSelected && !isTodayDate && (
                                    <span className="absolute bottom-0.5 w-1 h-1 bg-indigo-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tasks for Selected Date */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">
                        {isSameDay(selectedDate, new Date()) ? "Today's Tasks" : `Tasks for ${format(selectedDate, "MMM d")}`}
                    </h3>
                    <span className="text-xs text-slate-500">{selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                    {selectedDateTasks.length === 0 ? (
                        <div className="text-sm text-slate-500 italic">No tasks scheduled</div>
                    ) : (
                        selectedDateTasks.map(task => (
                            <div
                                key={task.id}
                                className="group bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-indigo-200 transition-colors"
                            >
                                {deleteConfirmId === task.id ? (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-red-600">Delete this task?</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleDelete(task.id)} className="p-1 bg-red-500 text-white rounded hover:bg-red-600">
                                                <Check className="size-3" />
                                            </button>
                                            <button onClick={() => setDeleteConfirmId(null)} className="p-1 bg-slate-300 text-slate-700 rounded hover:bg-slate-400">
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-slate-800 truncate">{task.title}</div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                    <Clock className="size-3" />
                                                    <span>
                                                        {task.startedAt && format(new Date(task.startedAt), "HH:mm")}
                                                        {task.endedAt && ` - ${format(new Date(task.endedAt), "HH:mm")}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onTaskEdit?.(task)}
                                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                >
                                                    <Pencil className="size-3" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirmId(task.id)}
                                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                >
                                                    <Trash2 className="size-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 mt-2">
                                            <Zap className="size-3 text-yellow-500" />
                                            <span className="text-xs text-slate-500">{task.energyCost}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Upcoming Today */}
            {upcomingTasks.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900">Coming up</h3>
                    </div>
                    <div className="space-y-2">
                        {upcomingTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 text-sm">
                                <div className="w-12 text-xs text-slate-400">
                                    {task.startedAt && format(new Date(task.startedAt), "HH:mm")}
                                </div>
                                <div className="flex-1 text-slate-700 truncate">{task.title}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* My Calendars */}
            <div className="mt-auto pt-6 border-t border-slate-200">
                <button className="flex items-center justify-between w-full text-slate-500 hover:text-slate-900 group">
                    <span className="font-medium">My calendars</span>
                    <ChevronDown className="size-4" />
                </button>
            </div>
        </div>
    );
}
