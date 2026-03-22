import api from './client';
import { Task, TaskContext, TaskPriority, TaskStatus } from '@/shared/types/task';

export enum ContextEnum {
    DEEP_WORK = "DEEP_WORK",
    ADMIN = "ADMIN",
    MEETING = "MEETING",
    ERRAND = "ERRAND"
}

export interface TaskDTO {
    id: string;
    title: string;
    energy_cost: number;
    context?: string;
    status: string;
    priority: string;
    created_at: string;
    deadline?: string;
    started_at?: string;
    ended_at?: string;
    importance?: boolean;
    is_urgent?: boolean;
    list_id?: string;
}

export interface TaskCreateDTO {
    title: string;
    energy_cost: number;
    context?: string;
    status?: string;
    priority?: string;
    deadline?: string;
    started_at?: string;
    ended_at?: string;
    importance?: boolean;
    is_urgent?: boolean;
    list_id?: string;
}

export interface TaskListDTO {
    id: string;
    name: string;
    color: string;
    icon: string;
    created_at: string;
    is_permanent?: boolean;
}

export interface TaskList {
    id: string;
    name: string;
    color: string;
    icon: string;
    createdAt: string;
    is_permanent?: boolean;
}

const mapToDomain = (dto: TaskDTO): Task => ({
    id: String(dto.id),
    title: dto.title,
    status: dto.status as TaskStatus,
    energyCost: dto.energy_cost,
    context: dto.context || "",
    priority: dto.priority.toLowerCase() as TaskPriority,
    deadline: dto.deadline,
    startedAt: dto.started_at,
    endedAt: dto.ended_at,
    importance: dto.importance,
    isUrgent: dto.is_urgent,
    listId: dto.list_id,
    createdAt: dto.created_at,
});

const mapToDTO = (task: Partial<Task> & { title: string; energyCost: number; context: string; list_id?: string }): TaskCreateDTO => ({
    title: task.title,
    energy_cost: task.energyCost,
    context: task.context,
    status: task.status,
    priority: task.priority ? (task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) : "Medium",
    deadline: task.deadline,
    started_at: task.startedAt,
    ended_at: task.endedAt,
    importance: task.importance,
    is_urgent: task.isUrgent,
    list_id: task.list_id
});

export const getTaskLists = async (): Promise<TaskList[]> => {
    const response = await api.get<TaskListDTO[]>('/lists/');
    return response.data.map((dto: TaskListDTO) => ({
        id: dto.id,
        name: dto.name,
        color: dto.color,
        icon: dto.icon,
        createdAt: dto.created_at,
        is_permanent: dto.is_permanent
    }));
};

export const createTaskList = async (name: string, color?: string): Promise<TaskList> => {
    const response = await api.post<TaskListDTO>('/lists/', { name, color });
    return {
        id: response.data.id,
        name: response.data.name,
        color: response.data.color,
        icon: response.data.icon,
        createdAt: response.data.created_at
    };
};

export const deleteTaskList = async (id: string): Promise<void> => {
    await api.delete(`/lists/${id}`);
};

export const getTasks = async (listId?: string, status?: string, min_energy?: number): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (listId) params.append('list_id', listId);
    if (status) params.append('status', status);
    if (min_energy) params.append('min_energy', min_energy.toString());

    const response = await api.get<TaskDTO[]>('/tasks/', { params });
    return response.data.map(mapToDomain);
};

export const createTask = async (task: Partial<Task> & { title: string; energyCost: number; context: string }): Promise<Task> => {
    const dto = mapToDTO(task as any);
    const response = await api.post<TaskDTO>('/tasks/', dto);
    return mapToDomain(response.data);
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
    const dtoUpdates: Partial<TaskCreateDTO> = {};
    if (updates.title) dtoUpdates.title = updates.title;
    if (updates.energyCost) dtoUpdates.energy_cost = updates.energyCost;
    if (updates.status) dtoUpdates.status = updates.status;
    if (updates.priority) dtoUpdates.priority = updates.priority.charAt(0).toUpperCase() + updates.priority.slice(1);
    if (updates.context) dtoUpdates.context = updates.context as unknown as ContextEnum;

    const response = await api.patch<TaskDTO>(`/tasks/${id}`, dtoUpdates);
    return mapToDomain(response.data);
};

export const deleteTask = async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
};
