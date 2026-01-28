"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Make sure to include styles for handles if not global
// "reactflow/dist/style.css" needs to be imported in the parent or root

export const TaskNode = memo(({ data, selected }: NodeProps) => {
    const { title, energyCost, blocked, status } = data;

    return (
        <div
            className={cn(
                "w-[250px] bg-white rounded-lg border-2 shadow-sm transition-all duration-200 p-3",
                selected ? "border-indigo-500 shadow-indigo-100" : "border-slate-200",
                blocked ? "opacity-60" : "opacity-100"
            )}
        >
            <Handle type="target" position={Position.Top} className="!bg-slate-300 !w-3 !h-3" />

            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {blocked ? (
                            <Lock className="w-3 h-3 text-slate-500" />
                        ) : (
                            <div className={cn("w-2 h-2 rounded-full", {
                                'bg-slate-300': status === 'todo',
                                'bg-indigo-500': status === 'in-progress',
                                'bg-emerald-500': status === 'done',
                            })} />
                        )}
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {blocked ? 'Blocked' : status}
                        </span>
                    </div>
                    <h3 className="font-medium text-slate-800 text-sm leading-tight text-wrap">
                        {title}
                    </h3>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-1 rounded text-amber-700 text-xs font-medium shrink-0">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>{energyCost}</span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !w-3 !h-3" />

            {blocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/10 backdrop-blur-[1px] rounded-lg">
                    <Lock className="w-6 h-6 text-slate-400" />
                </div>
            )}
        </div>
    );
});

TaskNode.displayName = "TaskNode";
