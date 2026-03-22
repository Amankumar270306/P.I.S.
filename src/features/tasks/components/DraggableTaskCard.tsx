import { useDraggable } from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import { Task } from "@/shared/types/task";
import { cn } from "@/shared/lib/utils";

interface DraggableTaskCardProps {
    task: Task;
    index: number;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
}

export function DraggableTaskCard({ task, onEdit, onDelete }: DraggableTaskCardProps) {
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
            <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
        </div>
    );
}
