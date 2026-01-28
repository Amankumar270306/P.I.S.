import { useDraggable } from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";

interface DraggableTaskCardProps {
    task: Task;
    // index is no longer strictly needed for useDraggable id-based logic, 
    // but kept if we upgrade to sortable later.
    index: number;
}

export function DraggableTaskCard({ task }: DraggableTaskCardProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id,
        data: { task }
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            // Touch-action: none is crucial for mobile dnd
            className={cn(
                "mb-3 touch-none outline-none",
                isDragging ? "opacity-30" : "opacity-100"
            )}
        >
            <TaskCard task={task} />
        </div>
    );
}
