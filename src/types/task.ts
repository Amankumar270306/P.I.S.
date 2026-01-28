export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskContext = 'Work' | 'Personal' | 'Errand';

export interface Task {
    id: string;
    title: string;
    status: TaskStatus;
    energyCost: number; // 1-10
    context: TaskContext;
}
