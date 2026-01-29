"use client";

import React, { useEffect, useState } from 'react';
import { getConsistencyLogs, ConsistencyLog } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for classnames

export function ConsistencyGraph() {
    const [logs, setLogs] = useState<ConsistencyLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock User ID for now (In real app, get from Context/Auth)
    const userId = "00000000-0000-0000-0000-000000000000"; // Placeholder UUID

    useEffect(() => {
        const fetchData = async () => {
            try {
                // For demo purposes, if no logs exist, we might want to show empty state or mock data?
                // Let's implement silent fetch first.
                // In a real scenario, we might fallback to mock data if the backend returns empty for a demo.
                const data = await getConsistencyLogs(userId);
                setLogs(data);
            } catch (error) {
                console.error("Failed to fetch consistency logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="h-64 flex items-center justify-center text-slate-400">Loading Consistency Data...</div>;
    }

    if (logs.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg">
                <p>No consistency data yet.</p>
                <p className="text-xs mt-1">Complete tasks to see your progress.</p>
            </div>
        );
    }

    // --- Chart Logic ---
    const height = 200;
    const width = 600; // ViewBox width
    const padding = 20;

    const maxEnergy = Math.max(...logs.map(l => l.energy_used), 40); // Default to at least 40 (capacity)
    const minEnergy = 0;

    const getY = (value: number) => {
        return height - padding - ((value - minEnergy) / (maxEnergy - minEnergy)) * (height - 2 * padding);
    };

    const getX = (index: number) => {
        if (logs.length <= 1) return padding + (width - 2 * padding) / 2;
        return padding + (index / (logs.length - 1)) * (width - 2 * padding);
    };

    // Generate Path
    const pathD = logs.map((log, i) => {
        const x = getX(i);
        const y = getY(log.energy_used);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Generate Area (for fill)
    const areaD = `${pathD} L ${getX(logs.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

    return (
        <div className="w-full">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800">Consistency Graph</h3>
                <p className="text-sm text-slate-500">Energy used vs Daily Capacity</p>
            </div>

            <div className="w-full aspect-[3/1] bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                        const y = getY(tick * maxEnergy);
                        return (
                            <line
                                key={tick}
                                x1={padding}
                                y1={y}
                                x2={width - padding}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Capacity Line (Mock at 40 or from log data if variable) */}
                    <line
                        x1={padding}
                        y1={getY(40)}
                        x2={width - padding}
                        y2={getY(40)}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                    <text x={width - padding + 5} y={getY(40)} className="text-[8px] fill-slate-400" alignmentBaseline="middle">Max</text>

                    {/* Gradient Defs */}
                    <defs>
                        <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <path d={areaD} fill="url(#energyGradient)" />

                    {/* Line Path */}
                    <path
                        d={pathD}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Data Points */}
                    {logs.map((log, i) => (
                        <circle
                            key={log.id}
                            cx={getX(i)}
                            cy={getY(log.energy_used)}
                            r="3"
                            className="fill-white stroke-indigo-600 stroke-2 hover:r-4 transition-all cursor-pointer"
                        >
                            <title>{`${log.date}: ${log.energy_used} Energy`}</title>
                        </circle>
                    ))}

                    {/* X Axis Labels */}
                    {logs.map((log, i) => {
                        // Show max 5 labels to avoid clutter
                        if (logs.length > 5 && i % Math.ceil(logs.length / 5) !== 0) return null;
                        return (
                            <text
                                key={log.id}
                                x={getX(i)}
                                y={height}
                                textAnchor="middle"
                                className="text-[10px] fill-slate-400 font-medium"
                            >
                                {format(parseISO(log.date), 'MMM d')}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
