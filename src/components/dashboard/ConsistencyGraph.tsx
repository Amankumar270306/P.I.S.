"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getTasks } from '@/lib/api';
import { Task } from '@/types/task';
import { format, subDays, startOfDay, isWithinInterval, endOfDay } from 'date-fns';
import { BarChart3 } from 'lucide-react';

interface DayReport {
    date: Date;
    label: string;
    shortLabel: string;
    completed: number;
    shifted: number;
}

export function ConsistencyGraph() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getTasks();
                setTasks(data);
            } catch (error) {
                console.error("Failed to fetch tasks:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Build weekly report for last 7 days
    const weekData: DayReport[] = useMemo(() => {
        const today = new Date();
        const days: DayReport[] = [];

        for (let i = 6; i >= 0; i--) {
            const day = subDays(today, i);
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const dayStr = format(day, 'yyyy-MM-dd');

            // Completed: tasks with status 'done' that have endedAt on this day,
            //   OR deadline on this day and status is 'done'
            const completed = tasks.filter(t => {
                if (t.status !== 'done') return false;
                // Check endedAt
                if (t.endedAt) {
                    const ended = new Date(t.endedAt);
                    return isWithinInterval(ended, { start: dayStart, end: dayEnd });
                }
                // Fallback: check deadline date
                if (t.deadline) {
                    return t.deadline.split('T')[0] === dayStr;
                }
                return false;
            }).length;

            // Shifted: tasks that were due on this day but are not done
            // (deadline passed but task is still todo or in_progress)
            const shifted = tasks.filter(t => {
                if (t.status === 'done') return false;
                if (!t.deadline) return false;
                const deadlineDate = t.deadline.split('T')[0];
                return deadlineDate === dayStr && day < today;
            }).length;

            days.push({
                date: day,
                label: format(day, 'EEE'),
                shortLabel: format(day, 'EEE'),
                completed,
                shifted,
            });
        }
        return days;
    }, [tasks]);

    const maxValue = Math.max(1, ...weekData.map(d => Math.max(d.completed, d.shifted)));

    if (loading) {
        return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Loading weekly data...</div>;
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="size-4 text-indigo-500" />
                    <h3 className="text-base font-bold text-slate-800">Weekly Report</h3>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span className="text-slate-500">Completed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                        <span className="text-slate-500">Shifted</span>
                    </div>
                </div>
            </div>

            <div className="flex items-end gap-2 h-40">
                {weekData.map((day, i) => {
                    const completedH = (day.completed / maxValue) * 100;
                    const shiftedH = (day.shifted / maxValue) * 100;
                    const isToday = i === weekData.length - 1;

                    return (
                        <div key={day.label + i} className="flex-1 flex flex-col items-center gap-1">
                            {/* Bar container */}
                            <div className="w-full flex items-end justify-center gap-1 h-32">
                                {/* Completed bar */}
                                <div className="relative group flex-1 max-w-5 flex flex-col items-center">
                                    <div
                                        className="w-full rounded-t-md bg-emerald-500 transition-all duration-500 ease-out hover:bg-emerald-600 cursor-pointer"
                                        style={{ height: `${Math.max(completedH, day.completed > 0 ? 8 : 2)}%`, minHeight: day.completed > 0 ? '8px' : '2px' }}
                                    />
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                                        {day.completed} done
                                    </div>
                                </div>
                                {/* Shifted bar */}
                                <div className="relative group flex-1 max-w-5 flex flex-col items-center">
                                    <div
                                        className="w-full rounded-t-md bg-amber-400 transition-all duration-500 ease-out hover:bg-amber-500 cursor-pointer"
                                        style={{ height: `${Math.max(shiftedH, day.shifted > 0 ? 8 : 2)}%`, minHeight: day.shifted > 0 ? '8px' : '2px' }}
                                    />
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                                        {day.shifted} shifted
                                    </div>
                                </div>
                            </div>

                            {/* Day label */}
                            <span className={`text-[10px] font-medium ${isToday ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                                {isToday ? 'Today' : day.shortLabel}
                            </span>

                            {/* Count labels */}
                            <div className="flex gap-1 text-[9px] text-slate-400">
                                {day.completed > 0 && <span className="text-emerald-600 font-medium">{day.completed}</span>}
                                {day.shifted > 0 && <span className="text-amber-600 font-medium">{day.shifted}</span>}
                                {day.completed === 0 && day.shifted === 0 && <span>—</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
