export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskContext = 'Work' | 'Personal' | 'Errand' | 'Delegated' | 'DEEP_WORK' | 'ADMIN' | 'MEETING';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    energyCost: number; // 1-10
    context: string;
    priority?: TaskPriority;
    deadline?: string;
    startedAt?: string;
    endedAt?: string;
    importance?: boolean;
    isUrgent?: boolean;
}
