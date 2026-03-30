export type TaskStatusId = 1 | 2 | 3 | 4; // 1: todo, 2: in_progress, 3: done, 4: backlog
export type TaskPriorityId = 1 | 2 | 3; // 1: low, 2: medium, 3: high

export interface Task {
    id: string;
    title: string;
    status_id: TaskStatusId;
    energyCost: number; // 1-10
    context: string;
    priority_id?: TaskPriorityId;
    deadline?: string;
    scheduledDate?: string;
    startedAt?: string;
    endedAt?: string;
    importance?: boolean;
    isUrgent?: boolean;
    listId?: string;
    createdAt?: string;
}
