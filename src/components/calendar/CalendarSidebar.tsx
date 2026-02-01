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
                    {/* No upcoming events placeholder */}
                    <div className="text-sm text-slate-500 italic">No upcoming events</div>
                </div>
            </div>

            {/* Time Breakdown */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">Time breakdown</h3>
                    <button className="text-xs text-slate-500 hover:text-slate-700">View all</button>
                </div>
                <div className="space-y-4">
                    <div className="text-sm text-slate-500 italic">No data available</div>
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
