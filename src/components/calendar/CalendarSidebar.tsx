"use client";

import React from "react";
import { ChevronLeft, ChevronRight, CheckSquare, Clock, ChevronDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarSidebarProps {
    selectedDate?: Date;
    onSelectDate?: (date: Date) => void;
}

export function CalendarSidebar({ selectedDate = new Date(), onSelectDate }: CalendarSidebarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(selectedDate);

    // Update current month when selectedDate changes (optional, but good UX to jump to selected)
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
                    {days.map((day, i) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => onSelectDate?.(day)}
                                className={cn(
                                    "aspect-square flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors relative",
                                    !isCurrentMonth && "text-slate-300",
                                    isSelected && "bg-indigo-600 text-white font-bold hover:bg-indigo-700",
                                    !isSelected && isToday && "bg-slate-900 text-white font-bold hover:bg-slate-800"
                                )}
                            >
                                {format(day, "d")}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming Events */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Upcoming events today</h3>
                    <button className="text-xs text-slate-500 hover:text-slate-700">View all</button>
                </div>
                <div className="space-y-3">
                    {[
                        { title: "Project presentation", time: "08:30 - 10:30", color: "bg-emerald-500" },
                        { title: "Design review", time: "11:40 - 12:10", color: "bg-slate-600" },
                        { title: "Lunch break", time: "12:00 - 13:00", color: "bg-slate-600" },
                        { title: "Leading a workshop", time: "13:00 - 15:00", color: "bg-slate-600" },
                    ].map((event, i) => (
                        <div key={i} className="flex items-start gap-3 group cursor-pointer">
                            <div className={cn("mt-1 size-4 rounded border border-slate-200 flex items-center justify-center transition-colors", i === 0 && "bg-emerald-500 border-emerald-500")}>
                                {i === 0 && <CheckSquare className="size-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={cn("text-sm font-medium truncate transition-colors", i === 0 ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700")}>
                                    {event.title}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">{event.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Time Breakdown */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Time breakdown</h3>
                    <button className="text-xs text-slate-500 hover:text-slate-700">View all</button>
                </div>
                <div className="space-y-4">
                    {[
                        { label: "Meeting", value: 65, color: "bg-blue-500" },
                        { label: "Projects", value: 45, color: "bg-emerald-500" },
                        { label: "Events", value: 20, color: "bg-rose-500" },
                        { label: "Reviews", value: 35, color: "bg-indigo-500" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 w-16">{item.label}</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full", item.color)}
                                    style={{ width: `${item.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

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
