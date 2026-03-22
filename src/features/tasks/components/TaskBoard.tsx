"use client";

import React, { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    DragEndEvent,
    DragStartEvent,
    useSensor,
    useSensors,
    PointerSensor
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { Task } from "@/shared/types/task";
import { BoardColumn } from "./BoardColumn";
import { TaskCard } from "./TaskCard";

interface TaskBoardProps {
    initialTasks: Task[];
    onTaskEdit?: (task: Task) => void;
    onTaskDelete?: (taskId: string) => void;
}

export function TaskBoard({ initialTasks, onTaskEdit, onTaskDelete }: TaskBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Sync tasks when initialTasks prop changes (e.g., after React Query refetch)
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const activeTask = tasks.find(t => t.id === activeId);

    const columns = {
        todo: tasks.filter(t => t.status === 'todo'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        done: tasks.filter(t => t.status === 'done'),
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
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
        const newStatus = over.id as Task['status'];
        const task = tasks.find(t => t.id === taskId);

        // If dropped in same column or invalid target, do nothing
        if (!task || task.status === newStatus) return;

        // Update Task Status
        const updatedTask = { ...task, status: newStatus };

        // Update Local State
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

        // Call edit callback for API update
        onTaskEdit?.(updatedTask);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px] p-4">
                <BoardColumn id="todo" title="To Do" tasks={columns.todo} onTaskEdit={onTaskEdit} onTaskDelete={onTaskDelete} />
                <BoardColumn id="in_progress" title="In Progress" tasks={columns.in_progress} onTaskEdit={onTaskEdit} onTaskDelete={onTaskDelete} />
                <BoardColumn id="done" title="Done" tasks={columns.done} onTaskEdit={onTaskEdit} onTaskDelete={onTaskDelete} />
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
