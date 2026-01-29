"use client";

import React, { useMemo, useState } from "react";
import { format, subDays, eachDayOfInterval, endOfWeek, startOfWeek, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";

interface DayData {
    date: Date;
    energySpent: number;
    limit: number;
}

// Reusing ConsistencyLog API for heatmap
import { getConsistencyLogs, ConsistencyLog } from "@/lib/api";

export function ProductivityHeatmap() {
    const [data, setData] = useState<DayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const userId = "00000000-0000-0000-0000-000000000000"; // Placeholder

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const logs = await getConsistencyLogs(userId);

                // Map logs to DayData
                // We want to show at least the current year or recent history?
                // Let's mimic GitHub style: last 365 days or just 2024?
                // For simplicity, let's map existing logs and fill missing days with 0?
                // Actually, let's just render the logs we have for now, or build a grid of the last 3 months?

                // Better approach: Generate 'empty' grid for last 3 months, fill with log data.
                const today = new Date();
                const startDate = subDays(today, 90); // Last 90 days for cleaner view? Or 365?

                // Create Map needed for O(1) lookup
                const logMap = new Map<string, number>();
                logs.forEach(l => logMap.set(l.date, l.energy_used));

                const heatmapData = eachDayOfInterval({ start: startDate, end: today }).map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return {
                        date,
                        energySpent: logMap.get(dateStr) || 0,
                        limit: 40
                    };
                });

                setData(heatmapData);
            } catch (error) {
                console.error("Failed to load heatmap", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Transform data into weeks for grid rendering
    // We want columns of weeks (Sunday to Saturday or Monday to Sunday). 
    // Let's assume Monday start for consistency with Calendar.

    // We need to group by week.
    // First, find the start of the week for the first date.
    const weeks: DayData[][] = [];
    let currentWeek: DayData[] = [];

    data.forEach((day, index) => {
        if (day.date.getDay() === 1 && currentWeek.length > 0) { // New week starts on Monday
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(day);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Color Scale Logic
    const getColor = (energy: number) => {
        if (energy === 0) return "fill-slate-100";
        if (energy <= 20) return "fill-emerald-300";
        if (energy <= 35) return "fill-emerald-600";
        return "fill-rose-500";
    };

    const getIntensityLabel = (energy: number) => {
        if (energy === 0) return "Rest";
        if (energy <= 20) return "Light";
        if (energy <= 35) return "Optimal";
        return "Overworked";
    };

    // Rect dimensions
    const boxSize = 10;
    const gap = 2;
    const width = weeks.length * (boxSize + gap);
    const height = 7 * (boxSize + gap);

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Consistency Graph</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-slate-100" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-300" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-600" />
                        <div className="w-3 h-3 rounded-sm bg-rose-500" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="relative overflow-x-auto pb-2">
                <svg width={width} height={height} className="max-w-full">
                    {weeks.map((week, weekIndex) => (
                        <g key={weekIndex} transform={`translate(${weekIndex * (boxSize + gap)}, 0)`}>
                            {week.map((day, dayIndex) => {
                                // Maps 0 (Sun) -> 6, 1 (Mon) -> 0, ... 6 (Sat) -> 5 if Monday start?
                                // Let's just default to standard day index for now: Sun=0, Sat=6.
                                // If we want Mon=0, we adjust y.
                                // data-fns `getDay`: 0=Sun. 
                                // Let's simplify: y = day.date.getDay() * (boxSize + gap).
                                // Ideally we align visually so Mon is top? 
                                // If Mon is top (0), then (day - 1 + 7) % 7.
                                const yIndex = (day.date.getDay() - 1 + 7) % 7;

                                return (
                                    <rect
                                        key={day.date.toISOString()}
                                        width={boxSize}
                                        height={boxSize}
                                        y={yIndex * (boxSize + gap)}
                                        className={cn("transition-colors duration-200 cursor-pointer hover:opacity-80", getColor(day.energySpent))}
                                        rx={2}
                                        onMouseEnter={(e) => {
                                            setHoveredDay(day);
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setTooltipPos({
                                                x: rect.left + rect.width / 2,
                                                y: rect.top
                                            });
                                        }}
                                        onMouseLeave={() => setHoveredDay(null)}
                                        onClick={() => console.log("Filter by date:", day.date)}
                                    />
                                );
                            })}
                        </g>
                    ))}
                </svg>

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
                            {hoveredDay.energySpent} Energy ({getIntensityLabel(hoveredDay.energySpent)})
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-slate-400 mt-2">
                You've had <span className="text-emerald-600 font-medium">142 Optimal Days</span> this year.
            </p>
        </div>
    );
}
