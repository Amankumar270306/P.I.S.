"use client";

import React, { useMemo, useState } from "react";
import { format, subDays, eachDayOfInterval, endOfMonth, startOfMonth, isSameMonth, isWithinInterval, startOfDay, endOfDay, setYear, setMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { getConsistencyLogs } from "@/lib/api";

interface DayData {
    date: Date;
    energySpent: number;
    limit: number;
}

const TRIMESTERS = [
    { label: "Jan - Apr", startMonth: 0, endMonth: 3 },
    { label: "May - Aug", startMonth: 4, endMonth: 7 },
    { label: "Sep - Dec", startMonth: 8, endMonth: 11 },
];

const START_YEAR = 2024;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - START_YEAR + 2 }, (_, i) => START_YEAR + i);

export function ProductivityHeatmap() {
    const [loading, setLoading] = useState(true);
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [logs, setLogs] = useState<Map<string, number>>(new Map());

    // Filter States
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
    const [selectedTrimesterIndex, setSelectedTrimesterIndex] = useState(() => {
        const month = new Date().getMonth();
        if (month <= 3) return 0;
        if (month <= 7) return 1;
        return 2;
    });
    const [highlightMonth, setHighlightMonth] = useState<number | "all">("all");

    const userId = "00000000-0000-0000-0000-000000000000"; // Placeholder

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const fetchedLogs = await getConsistencyLogs(userId);
                const logMap = new Map<string, number>();
                fetchedLogs.forEach(l => logMap.set(l.date.split('T')[0], l.energy_used)); // Store as YYYY-MM-DD
                setLogs(logMap);
            } catch (error) {
                console.error("Failed to load heatmap", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derived Data based on filters
    const { weeks, trimesterMonths } = useMemo(() => {
        const trimester = TRIMESTERS[selectedTrimesterIndex];
        const startDate = startOfMonth(setMonth(setYear(new Date(), selectedYear), trimester.startMonth));
        const endDate = endOfMonth(setMonth(setYear(new Date(), selectedYear), trimester.endMonth));

        const interval = { start: startDate, end: endDate };
        const daysInInterval = eachDayOfInterval(interval);

        const trimesterMonthOptions = [
            { value: "all", label: "All Months" },
            ...Array.from({ length: 4 }, (_, i) => {
                const m = trimester.startMonth + i;
                return { value: m, label: format(setMonth(new Date(), m), "MMMM") };
            })
        ];

        // Transform into DayData
        const dayDataList = daysInInterval.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            return {
                date,
                energySpent: logs.get(dateStr) || 0,
                limit: 30 // Now 30 based on recent changes
            };
        });

        // Group by weeks
        const weeks: DayData[][] = [];
        let currentWeek: DayData[] = [];

        dayDataList.forEach((day) => {
            // If it's Monday and we have a previous week, push it
            if (day.date.getDay() === 1 && currentWeek.length > 0) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            currentWeek.push(day);
        });
        if (currentWeek.length > 0) weeks.push(currentWeek);

        return { weeks, trimesterMonths: trimesterMonthOptions };
    }, [selectedYear, selectedTrimesterIndex, logs]);

    // Dimensions
    const boxSize = 10;
    const gap = 2;
    const width = weeks.length * (boxSize + gap);
    const height = 7 * (boxSize + gap);

    const getColor = (energy: number, date: Date) => {
        // Dimming logic if specific month is highlighted
        const isDimmed = highlightMonth !== "all" && date.getMonth() !== highlightMonth;

        if (energy === 0) return isDimmed ? "fill-slate-50" : "fill-slate-100";

        let baseColor = "fill-emerald-300";
        if (energy > 20) baseColor = "fill-emerald-600";
        if (energy > 30) baseColor = "fill-rose-500"; // Updated thresholds for limit 30

        return isDimmed ? "fill-slate-200" : baseColor; // Placeholder for dimmed color logic, effectively graying out
    };

    // Better color logic for dimmed state using opacity or specific colors
    const getClassName = (energy: number, date: Date) => {
        const isDimmed = highlightMonth !== "all" && date.getMonth() !== highlightMonth;

        let colorClass = "bg-slate-100";
        if (energy > 0) colorClass = "bg-emerald-300";
        if (energy > 15) colorClass = "bg-emerald-500";
        if (energy > 25) colorClass = "bg-rose-500";

        if (energy === 0) colorClass = "bg-slate-100";

        return cn("rounded-[2px] transition-all duration-200", colorClass, isDimmed && "opacity-20");
    };


    return (
        <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                <h3 className="text-sm font-bold text-slate-800">Productivity Pulse</h3>

                {/* Filters */}
                <div className="flex items-center gap-1.5">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="text-[10px] bg-slate-50 border-slate-200 rounded text-slate-600 py-0.5 pl-1.5 pr-4 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                    >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    <select
                        value={selectedTrimesterIndex}
                        onChange={(e) => {
                            setSelectedTrimesterIndex(Number(e.target.value));
                            setHighlightMonth("all");
                        }}
                        className="text-[10px] bg-slate-50 border-slate-200 rounded text-slate-600 py-0.5 pl-1.5 pr-4 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                    >
                        {TRIMESTERS.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
                    </select>

                    <select
                        value={highlightMonth}
                        onChange={(e) => setHighlightMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
                        className="text-[10px] bg-slate-50 border-slate-200 rounded text-slate-600 py-0.5 pl-1.5 pr-4 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                    >
                        {trimesterMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="relative overflow-x-auto pb-1 min-h-[80px]">
                {loading ? (
                    <div className="flex items-center justify-center h-[80px] text-slate-400 text-xs">Loading activity...</div>
                ) : (
                    <div className="flex gap-[2px]">
                        {weeks.map((week, wIndex) => (
                            <div key={wIndex} className="flex flex-col gap-[2px]">
                                {week.map((day) => {
                                    return (
                                        <div
                                            key={day.date.toISOString()}
                                            className={cn("w-2 h-2", getClassName(day.energySpent, day.date))}
                                            onMouseEnter={(e) => {
                                                setHoveredDay(day);
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                                            }}
                                            onMouseLeave={() => setHoveredDay(null)}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
                {/* Floating Tooltip */}
                {hoveredDay && (
                    <div
                        className="fixed z-50 pointer-events-none bg-slate-900 text-white text-xs px-2 py-1.5 rounded-lg shadow-xl border border-slate-700 whitespace-nowrap -translate-x-1/2 -translate-y-full mt-[-6px]"
                        style={{
                            left: tooltipPos.x,
                            top: tooltipPos.y
                        }}
                    >
                        <div className="font-semibold">{format(hoveredDay.date, "EEEE, MMM d, yyyy")}</div>
                        <div className="text-[10px] text-slate-300">
                            {hoveredDay.energySpent} / {hoveredDay.limit} Energy
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 justify-end">
                <span>Less</span>
                <div className="flex gap-0.5">
                    <div className="w-2 h-2 rounded-[1px] bg-slate-100" />
                    <div className="w-2 h-2 rounded-[1px] bg-emerald-300" />
                    <div className="w-2 h-2 rounded-[1px] bg-emerald-500" />
                    <div className="w-2 h-2 rounded-[1px] bg-rose-500" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
}
