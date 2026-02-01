"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, setHours, setMinutes } from "date-fns";
import { ChevronLeft, ChevronRight, PanelRightOpen, PanelRightClose } from "lucide-react";
import { CalendarEvent as CalendarEventComponent } from "@/components/calendar/CalendarEvent";
import { CalendarSidebar } from "@/components/calendar/CalendarSidebar";
import { CalendarEvent } from "@/types/calendar";
import { cn } from "@/lib/utils";

const generateMockEvents = (): CalendarEvent[] => {
    return [];
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        setEvents(generateMockEvents());
    }, []);

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    const timeSlots = Array.from({ length: 24 }).map((_, i) => i); // 0 to 23 (24 slots)

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
                    <div className="text-xs font-medium text-slate-400 pt-3">GMT +4</div>
                    <div className="grid grid-cols-7 gap-4">
                        {weekDays.map(day => {
                            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                            return (
                                <div key={day.toISOString()} className={cn(
                                    "text-center py-3 rounded-xl border border-transparent transition-colors",
                                    isToday ? "bg-slate-900 text-white font-bold" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                )}>
                                    <div className="text-sm">{format(day, "EEE d")}</div>
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
                                        {dayEvents.map(event => {
                                            // Calculate Top offset based on 00:00 start (Midnight)
                                            // 00:00 = 0px
                                            const startHour = event.startTime.getHours();
                                            const startMinute = event.startTime.getMinutes();
                                            // No offset subtraction needed as we start at 0
                                            const minutesFromMidnight = startHour * 60 + startMinute;

                                            return (
                                                <CalendarEventComponent key={event.id} event={event} />
                                            );
                                        })}

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
                    <CalendarSidebar selectedDate={currentDate} onSelectDate={setCurrentDate} />
                </div>
            </div>
        </div>
    );
}
