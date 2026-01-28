"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, setHours, setMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { CalendarEvent as CalendarEventComponent } from "@/components/calendar/CalendarEvent";
import { TaskHopper } from "@/components/calendar/TaskHopper";
import { CalendarEvent } from "@/types/calendar";

// Mock Data Generation
const generateMockEvents = (): CalendarEvent[] => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

    const createEvent = (dayOffset: number, hour: number, duration: number, title: string, energy: number): CalendarEvent => {
        const date = addDays(startOfCurrentWeek, dayOffset);
        const startTime = setMinutes(setHours(date, hour), 0);
        return {
            id: Math.random().toString(36).substr(2, 9),
            title,
            startTime,
            durationMinutes: duration,
            energyCost: energy,
        };
    };

    return [
        createEvent(0, 9, 120, "Deep Work: Coding", 8), // Mon 9-11
        createEvent(0, 14, 60, "Team Sync", 4),        // Mon 2-3
        createEvent(0, 13, 60, "Lunch", -2),           // Mon 1-2
        createEvent(1, 10, 90, "Client Meeting", 6),   // Tue 10-11:30
        createEvent(2, 13, 60, "Lunch", -2),           // Wed 1-2
        createEvent(3, 15, 60, "Code Review", 5),      // Thu 3-4
        createEvent(4, 16, 60, "Weekly Wrap-up", 3),   // Fri 4-5
    ];
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

    useEffect(() => {
        setEvents(generateMockEvents());

        // Set initial current time line
        const now = new Date();
        const minutes = (now.getHours() - 6) * 60 + now.getMinutes();
        setCurrentTimeMinutes(minutes);

        const interval = setInterval(() => {
            const n = new Date();
            const m = (n.getHours() - 6) * 60 + n.getMinutes();
            setCurrentTimeMinutes(m);
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const timeSlots = Array.from({ length: 17 }).map((_, i) => i + 6); // 6 AM to 10 PM (17 slots)

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-slate-900">
                            {format(currentDate, "MMMM yyyy")}
                        </h1>
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                            <button
                                onClick={() => setCurrentDate(addDays(currentDate, -7))}
                                className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
                            >
                                <ChevronLeft className="size-4 text-slate-600" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-2 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setCurrentDate(addDays(currentDate, 7))}
                                className="p-1 hover:bg-white hover:shadow-sm rounded transition-all"
                            >
                                <ChevronRight className="size-4 text-slate-600" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs font-medium">
                        <button className="px-3 py-1 bg-white shadow-sm rounded text-slate-900">Week</button>
                        <button className="px-3 py-1 text-slate-500 hover:text-slate-900">Day</button>
                    </div>
                </div>

                {/* Scrollable Grid */}
                <div className="flex-1 overflow-y-auto flex relative">
                    {/* Time Labels */}
                    <div className="w-16 shrink-0 border-r border-slate-200 bg-white sticky left-0 z-20">
                        <div className="h-10 border-b border-slate-200" /> {/* Header spacer */}
                        {timeSlots.map(hour => (
                            <div key={hour} className="h-[60px] text-right pr-2 pt-2 text-xs text-slate-400 font-medium">
                                {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    <div className="flex-1 min-w-[800px]">
                        {/* Day Headers */}
                        <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10 h-10">
                            {weekDays.map(day => (
                                <div key={day.toISOString()} className="flex-1 text-center border-r border-slate-100 py-2">
                                    <span className="text-xs font-medium text-slate-500">{format(day, "EEE")}</span>
                                    <span className={cn("ml-1 text-sm font-bold",
                                        format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                                            ? "text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full"
                                            : "text-slate-900"
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Grid Content */}
                        <div className="flex relative">
                            {/* Current Time Line Mockup (Only visible if calculated time is within view range) */}
                            {currentTimeMinutes > 0 && currentTimeMinutes < (17 * 60) && (
                                <div
                                    className="absolute w-full border-t-2 border-red-500 z-10 pointer-events-none"
                                    style={{ top: `${currentTimeMinutes}px` }}
                                >
                                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                                </div>
                            )}

                            {weekDays.map(day => {
                                const dayEvents = events.filter(e =>
                                    format(e.startTime, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
                                ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

                                const handleDragOver = (e: React.DragEvent) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = "copy";
                                };

                                const handleDrop = (e: React.DragEvent) => {
                                    e.preventDefault();
                                    const data = e.dataTransfer.getData("application/json");
                                    if (!data) return;

                                    const task = JSON.parse(data);

                                    // Calculate time from Y coordinate
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const y = e.clientY - rect.top + e.currentTarget.scrollTop;
                                    const minutesFrom6AM = y; // Since 1px = 1min

                                    const droppedDate = new Date(day);
                                    droppedDate.setHours(6, 0, 0, 0); // Start at 6 AM
                                    const startTime = new Date(droppedDate.getTime() + minutesFrom6AM * 60000);

                                    // Snap to nearest 15 min
                                    const remainder = startTime.getMinutes() % 15;
                                    startTime.setMinutes(startTime.getMinutes() - remainder);

                                    // Gap Calculation ("Liquid" fill)
                                    // Find next event that starts AFTER this new start time
                                    const nextEvent = dayEvents.find(ev => ev.startTime.getTime() > startTime.getTime());

                                    let duration = 60; // Default 1 hour
                                    if (nextEvent) {
                                        const gapMinutes = (nextEvent.startTime.getTime() - startTime.getTime()) / 60000;
                                        if (gapMinutes > 15 && gapMinutes < 180) { // Auto-fill if gap is reasonable (15m to 3h)
                                            duration = gapMinutes;
                                        }
                                    }

                                    const newEvent: CalendarEvent = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        title: task.title,
                                        startTime,
                                        durationMinutes: duration,
                                        energyCost: task.energy,
                                    };

                                    setEvents(prev => [...prev, newEvent]);
                                };

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className="flex-1 border-r border-slate-100 relative h-[1020px]"
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                    >
                                        {/* 17 hours * 60px = 1020px */}

                                        {/* Background grid lines */}
                                        {timeSlots.map(hour => (
                                            <div key={hour} className="h-[60px] border-b border-slate-50/50" />
                                        ))}

                                        {/* Events */}
                                        {dayEvents.map((event, index) => {
                                            // Conflict / Context Switching Detection
                                            // Check previous event
                                            const prevEvent = index > 0 ? dayEvents[index - 1] : null;
                                            let showConflict = false;

                                            if (prevEvent) {
                                                const prevEnd = new Date(prevEvent.startTime.getTime() + prevEvent.durationMinutes * 60000);
                                                // If gap is small (< 15 mins) AND both are high energy (> 7)
                                                // Actually spec says "drag... next to another". Let's assume adjacent or overlapping-ish.
                                                // Simplification: if adjacent (within 15m) and both high energy.
                                                const gap = (event.startTime.getTime() - prevEnd.getTime()) / 60000;
                                                if (gap < 15 && event.energyCost > 7 && prevEvent.energyCost > 7) {
                                                    showConflict = true;
                                                }
                                            }

                                            return (
                                                <div key={event.id}>
                                                    <CalendarEventComponent event={event} />
                                                    {showConflict && (
                                                        <div
                                                            className="absolute w-full h-2 z-20 pointer-events-none"
                                                            style={{
                                                                top: `${(event.startTime.getHours() - 6) * 60 + event.startTime.getMinutes() - 4}px`
                                                            }}
                                                        >
                                                            <div className="w-full h-full bg-red-500/50 animate-pulse skew-x-12" />
                                                            {/* "Jagged" representation simplified to skewed pulse for now */}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Sidebar */}
            <TaskHopper />
        </div>
    );
}

function cn(...inputs: (string | boolean | undefined | null)[]) {
    // simplified internal cn used if import fails, but we have import
    // just keeping it clean.
    return inputs.filter(Boolean).join(" ");
}
