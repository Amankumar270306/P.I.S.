export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskContext = 'Work' | 'Personal' | 'Errand' | 'Delegated';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    energyCost: number; // 1-10
    context: TaskContext;
    priority?: TaskPriority;
}
