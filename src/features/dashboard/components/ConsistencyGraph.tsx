"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getTasks } from '@/shared/lib/api/tasks';;
import { Task } from '@/shared/types/task';
import { format, subDays, startOfDay, isWithinInterval, endOfDay } from 'date-fns';
import { BarChart3 } from 'lucide-react';

interface DayReport {
    date: Date;
    label: string;
    shortLabel: string;
    completed: number;
    shifted: number;
}

export function ConsistencyGraph({ tasks }: { tasks: Task[] }) {

    // Build weekly report for last 7 days optimally using O(N) bucket mapping
    const weekData: DayReport[] = useMemo(() => {
        const today = new Date();
        const daysMap = new Map<string, DayReport>();
        const daysArr: DayReport[] = [];

        for (let i = 6; i >= 0; i--) {
            const day = subDays(today, i);
            const dayStr = format(day, 'yyyy-MM-dd');
            const dr = {
                date: day,
                label: format(day, 'EEE'),
                shortLabel: format(day, 'EEE'),
                completed: 0,
                shifted: 0,
            };
            daysMap.set(dayStr, dr);
            daysArr.push(dr);
        }
        
        const todayStartStr = format(today, 'yyyy-MM-dd');

        // O(N) single pass over all tasks
        tasks.forEach(t => {
            if (t.status_id === 3) {
                // Completed
                let actDayStr = null;
                if (t.endedAt) {
                    actDayStr = t.endedAt.split('T')[0];
                } else if (t.deadline) {
                    actDayStr = t.deadline.split('T')[0];
                }
                if (actDayStr && daysMap.has(actDayStr)) {
                    daysMap.get(actDayStr)!.completed++;
                }
            } else {
                // Shifted
                if (t.deadline) {
                    const deadlineStr = t.deadline.split('T')[0];
                    // If deadline is strictly earlier than today functionally and task is incomplete
                    if (deadlineStr < todayStartStr && daysMap.has(deadlineStr)) {
                        daysMap.get(deadlineStr)!.shifted++;
                    }
                }
            }
        });

        return daysArr;
    }, [tasks]);

    const maxValue = Math.max(1, ...weekData.map(d => Math.max(d.completed, d.shifted)));



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
