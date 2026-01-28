"use client";

import { Draggable } from "@hello-pangea/dnd";
import { TaskCard } from "./TaskCard";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

interface DraggableTaskCardProps {
    task: Task;
    index: number;
}

export function DraggableTaskCard({ task, index }: DraggableTaskCardProps) {
    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "mb-3 transition-transform duration-200",
                        snapshot.isDragging && "rotate-[3deg] scale-105 shadow-xl z-50"
                    )}
                    style={provided.draggableProps.style}
                >
                    <TaskCard task={task} />
                </div>
            )}
        </Draggable>
    );
}
