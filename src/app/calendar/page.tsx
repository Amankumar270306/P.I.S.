"use client";

import { useState, useMemo } from "react";
import { format, addDays, startOfWeek, differenceInMinutes, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, PanelRightOpen, PanelRightClose } from "lucide-react";
import { CalendarEvent as CalendarEventComponent } from "@/features/calendar/components/CalendarEvent";
import { CalendarSidebar } from "@/features/calendar/components/CalendarSidebar";
import { CalendarEvent } from "@/shared/types/calendar";
import { cn } from "@/shared/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTasks, updateTask, deleteTask } from '@/shared/lib/api/tasks';;
import { Task } from "@/shared/types/task";

// Convert tasks with scheduled times to calendar events
const tasksToCalendarEvents = (tasks: Task[]): CalendarEvent[] => {
    return tasks
        .filter(task => task.startedAt && task.endedAt)
        .map(task => {
            const startTime = new Date(task.startedAt!);
            const endTime = new Date(task.endedAt!);
            const durationMinutes = Math.max(30, differenceInMinutes(endTime, startTime));

            return {
                id: `task-${task.id}`,
                title: task.title,
                startTime,
                durationMinutes,
                energyCost: task.energyCost,
                taskId: task.id
            };
        });
};

export default function CalendarPage() {
    const queryClient = useQueryClient();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Fetch all tasks
    const { data: tasks = [] } = useQuery({
        queryKey: ['calendarTasks'],
        queryFn: () => getTasks()
    });

    // Convert tasks to calendar events
    const events = useMemo(() => tasksToCalendarEvents(tasks), [tasks]);

    // Mutations for task actions
    const updateTaskMutation = useMutation({
        mutationFn: (variables: { id: string; updates: Partial<Task> }) => updateTask(variables.id, variables.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendarTasks'] });
        }
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: string) => deleteTask(taskId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calendarTasks'] });
        }
    });

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const timeSlots = Array.from({ length: 24 }).map((_, i) => i); // 0 to 23 (24 slots)

    const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
    const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));

    return (
        <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans">
            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Header */}
                <div className="h-20 flex items-center justify-between px-8 bg-white shrink-0">
                    <div className="flex items-center gap-6">
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            {format(currentDate, "MMMM yyyy")}
                        </h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevWeek}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="size-5" />
                            </button>
                            <button
                                onClick={handleNextWeek}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <ChevronRight className="size-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <button className="px-4 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-white">Month</button>
                            <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-white text-slate-900 shadow-sm">Week</button>
                            <button className="px-4 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-white">Day</button>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Toggle Sidebar"
                        >
                            {isSidebarOpen ? <PanelRightClose className="size-5" /> : <PanelRightOpen className="size-5" />}
                        </button>
                    </div>
                </div>

                {/* Week Header */}
                <div className="grid grid-cols-[60px_1fr] px-4 pb-2">
                    <div className="text-xs font-medium text-slate-400 pt-3">GMT +5:30</div>
                    <div className="grid grid-cols-7 gap-4">
                        {weekDays.map(day => {
                            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                            const dayEvents = events.filter(e =>
                                format(e.startTime, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                            );
                            return (
                                <div key={day.toISOString()} className={cn(
                                    "text-center py-3 rounded-xl border border-transparent transition-colors",
                                    isToday ? "bg-slate-900 text-white font-bold" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                )}>
                                    <div className="text-sm">{format(day, "EEE d")}</div>
                                    {dayEvents.length > 0 && (
                                        <div className="text-xs opacity-60">{dayEvents.length} task{dayEvents.length > 1 ? 's' : ''}</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Scrollable Grid */}
                <div className="flex-1 overflow-y-auto relative px-4 pb-4">
                    <div className="grid grid-cols-[60px_1fr] min-h-[1440px]"> {/* 24 slots * 60px */}
                        {/* Time Labels */}
                        <div className="relative border-r border-slate-100 mr-4">
                            {timeSlots.map((hour, i) => (
                                <div key={hour} className="absolute w-full text-right pr-4 text-xs text-slate-400 transform -translate-y-1/2" style={{ top: `${i * 60}px` }}>
                                    {hour === 0 ? '12:00 AM' : hour === 12 ? '12:00 PM' : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                                </div>
                            ))}
                        </div>

                        {/* Grid Columns */}
                        <div className="grid grid-cols-7 gap-4 relative">
                            {/* Horizontal Grid Lines */}
                            {timeSlots.map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-full border-t border-slate-100 pointer-events-none"
                                    style={{ top: `${i * 60}px` }}
                                />
                            ))}

                            {weekDays.map(day => {
                                const dayEvents = events.filter(e =>
                                    format(e.startTime, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                                );

                                return (
                                    <div key={day.toISOString()} className="relative h-full">
                                        {dayEvents.map(event => (
                                            <CalendarEventComponent
                                                key={event.id}
                                                event={event}
                                                onEdit={event.taskId ? (updates) => updateTaskMutation.mutate({ id: event.taskId!, updates }) : undefined}
                                                onDelete={event.taskId ? () => deleteTaskMutation.mutate(event.taskId!) : undefined}
                                            />
                                        ))}

                                        {/* Create New Button Placeholder (Floating +) */}
                                        <div className="absolute inset-0 hover:bg-white/5 transition-colors rounded-lg group">
                                            {/* Plus button that appears on hover/click */}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar (Right Side) */}
            <div
                className={cn(
                    "transition-all duration-300 ease-in-out border-l border-slate-200 bg-white overflow-hidden",
                    isSidebarOpen ? "w-[300px] opacity-100" : "w-0 opacity-0 border-l-0"
                )}
            >
                <div className="w-[300px] h-full"> {/* Inner container to prevent content layout shift during transition */}
                    <CalendarSidebar
                        selectedDate={currentDate}
                        onSelectDate={setCurrentDate}
                        tasks={tasks}
                        onTaskEdit={(task) => updateTaskMutation.mutate({ id: task.id, updates: task })}
                        onTaskDelete={(taskId) => deleteTaskMutation.mutate(taskId)}
                    />
                </div>
            </div>
        </div>
    );
}
