"use client";

import React, { useState } from "react";
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    DragEndEvent,
    DragStartEvent,
    useSensor,
    useSensors,
    PointerSensor
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import { Flame, Calendar, Users, Ban } from "lucide-react";
import { TaskCard } from "./TaskCard";

// --- Types & Config ---

type QuadrantId = 'do_first' | 'schedule' | 'delegate' | 'eliminate';

const quadrants: {
    id: QuadrantId;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    borderColor: string;
    bgAccent: string;
    filter: (t: Task) => boolean;
}[] = [
        {
            id: 'do_first',
            title: 'Do First',
            subtitle: 'Urgent & Important',
            icon: Flame,
            color: 'text-rose-500',
            borderColor: 'border-rose-200',
            bgAccent: 'bg-rose-50',
            filter: (t: Task) => t.priority === 'high'
        },
        {
            id: 'schedule',
            title: 'Schedule',
            subtitle: 'Not Urgent & Important',
            icon: Calendar,
            color: 'text-blue-500',
            borderColor: 'border-blue-200',
            bgAccent: 'bg-blue-50',
            filter: (t: Task) => t.priority === 'medium' && t.status !== 'done'
        },
        {
            id: 'delegate',
            title: 'Delegate',
            subtitle: 'Urgent & Not Important',
            icon: Users,
            color: 'text-amber-500',
            borderColor: 'border-amber-200',
            bgAccent: 'bg-amber-50',
            filter: (t: Task) => t.priority === 'low' && t.context === 'Delegated'
        },
        {
            id: 'eliminate',
            title: 'Eliminate',
            subtitle: 'Not Urgent & Not Important',
            icon: Ban,
            color: 'text-slate-400',
            borderColor: 'border-slate-200',
            bgAccent: 'bg-slate-50',
            filter: (t: Task) => !['high', 'medium'].includes(t.priority || '') && t.context !== 'Delegated'
        }
    ];

// --- Sub-components ---

function DraggableTask({ task }: { task: Task }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { task }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={cn(
                "cursor-grab active:cursor-grabbing touch-none", // explicit touch-none for touch devices
                isDragging ? "opacity-30" : "opacity-100"
            )}
        >
            <TaskCard task={task} />
        </div>
    );
}

function QuadrantContainer({
    quadrant,
    tasks
}: {
    quadrant: typeof quadrants[0],
    tasks: Task[]
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: quadrant.id
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "relative flex flex-col p-4 rounded-xl border-2 transition-colors h-full bg-white/50 backdrop-blur-sm",
                quadrant.borderColor,
                isOver ? quadrant.bgAccent : "bg-white"
            )}
        >
            {/* Background Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <quadrant.icon className="w-48 h-48" />
            </div>

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                    <h3 className={cn("text-lg font-bold", quadrant.color)}>{quadrant.title}</h3>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{quadrant.subtitle}</p>
                </div>
                <div className={cn("p-2 rounded-full bg-white shadow-sm border", quadrant.borderColor)}>
                    <quadrant.icon className={cn("size-5", quadrant.color)} />
                </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto min-h-0 relative z-10 pr-2">
                {tasks.map(task => (
                    <DraggableTask key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
}

// --- Main Component ---

interface MatrixViewProps {
    tasks: Task[];
    onTaskUpdate: (updatedTask: Task) => void;
}

export function MatrixView({ tasks, onTaskUpdate }: MatrixViewProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const activeTask = tasks.find(t => t.id === activeId);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require slight movement to prevent accidental drags on clicks
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const taskId = active.id as string;
        const quadrantId = over.id as QuadrantId;
        const task = tasks.find(t => t.id === taskId);

        if (!task) return;

        // Apply Logic based on Quadrant
        const updatedTask = { ...task };

        // Check if we actually changed quadrants (this simple logic accepts drops in same quad too, which is fine)
        // Ideally we check if `quadrants.find(q => q.id === quadrantId).filter(task)` is false before updating?
        // But re-applying state is harmless.

        switch (quadrantId) {
            case 'do_first':
                if (updatedTask.priority !== 'high') {
                    updatedTask.priority = 'high';
                }
                break;
            case 'schedule':
                if (updatedTask.priority !== 'medium') {
                    updatedTask.priority = 'medium';
                }
                break;
            case 'delegate':
                updatedTask.priority = 'low';
                updatedTask.context = 'Delegated';
                break;
            case 'eliminate':
                updatedTask.priority = 'low';
                // If moving to eliminate, maybe we set status or just context?
                // Let's stick to priority logic primarily or clear context
                if (updatedTask.context === 'Delegated') updatedTask.context = 'Work'; // Reset delegate context
                break;
        }

        onTaskUpdate(updatedTask);
    };

    // Render Portal for overlay to escape Grid/Z-Index hell
    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 grid-rows-2 gap-4 h-full min-h-[600px]">
                {quadrants.map(quad => (
                    <QuadrantContainer
                        key={quad.id}
                        quadrant={quad}
                        tasks={tasks.filter(quad.filter)}
                    />
                ))}
            </div>

            {typeof document !== 'undefined' && createPortal(
                <DragOverlay>
                    {activeTask ? (
                        <div className="rotate-2 scale-105 shadow-2xl cursor-grabbing">
                            <TaskCard task={activeTask} />
                        </div>
                    ) : null}
                </DragOverlay>,
                document.body
            )}
        </DndContext>
    );
}
