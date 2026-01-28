"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Task } from "@/types/task";
import { DraggableTaskCard } from "./DraggableTaskCard";
import { cn } from "@/lib/utils";

interface BoardColumnProps {
    id: string;
    title: string;
    tasks: Task[];
}

export function BoardColumn({ id, title, tasks }: BoardColumnProps) {
    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200/60 overflow-hidden">
            <div className="p-4 border-b border-slate-200/60 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                <h3 className="font-semibold text-slate-700">{title}</h3>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {tasks.length}
                </span>
            </div>

            <Droppable droppableId={id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                            "flex-1 p-3 transition-colors duration-200 overflow-y-auto min-h-[150px]",
                            snapshot.isDraggingOver ? "bg-indigo-50/50" : ""
                        )}
                    >
                        {tasks.map((task, index) => (
                            <DraggableTaskCard key={task.id} task={task} index={index} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
