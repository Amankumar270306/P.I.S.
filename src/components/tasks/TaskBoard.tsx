"use client";

import React, { useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { Task } from "@/types/task";
import { BoardColumn } from "./BoardColumn";

interface TaskBoardProps {
    initialTasks: Task[];
}

export function TaskBoard({ initialTasks }: TaskBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    const columns = {
        todo: tasks.filter(t => t.status === 'todo'),
        'in-progress': tasks.filter(t => t.status === 'in-progress'),
        done: tasks.filter(t => t.status === 'done'),
    };

    const handleDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Logic to update local state
        // Since we are filtering derived state from a flat 'tasks' array, we just need to update the status of the moved task.
        // NOTE: Real-world apps might need reordering logic within the column as well.
        // For this MVP, we will just update the status, and basic array reordering.

        const newTasks = Array.from(tasks);
        const movedTaskIndex = newTasks.findIndex(t => t.id === draggableId);
        if (movedTaskIndex === -1) return;

        const movedTask = { ...newTasks[movedTaskIndex] };

        // Update status if moved to a different column
        if (source.droppableId !== destination.droppableId) {
            movedTask.status = destination.droppableId as Task['status'];
        }

        // Simple state update for now (reordering within same column for persistence is more complex with this flat structure)
        // We will just update the task in the array.
        newTasks[movedTaskIndex] = movedTask;
        setTasks(newTasks);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
                <BoardColumn id="todo" title="To Do" tasks={columns.todo} />
                <BoardColumn id="in-progress" title="In Progress" tasks={columns['in-progress']} />
                <BoardColumn id="done" title="Done" tasks={columns.done} />
            </div>
        </DragDropContext>
    );
}
