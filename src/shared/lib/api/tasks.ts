import api from './client';
import { Task, TaskPriorityId, TaskStatusId } from '@/shared/types/task';

export enum ContextEnum {
    DEEP_WORK = "DEEP_WORK",
    ADMIN = "ADMIN",
    MEETING = "MEETING",
    ERRAND = "ERRAND"
}

export interface TaskScheduleDTO {
    scheduled_date?: string;
    deadline?: string;
}

export interface TaskExecutionDTO {
    energy_cost?: number;
    started_at?: string;
    ended_at?: string;
}

export interface TaskDTO {
    id: string;
    title: string;
    context?: string;
    status_id: number;
    priority_id: number;
    created_at: string;
    importance?: boolean;
    is_urgent?: boolean;
    list_id?: string;
    schedule?: TaskScheduleDTO;
    execution?: TaskExecutionDTO;
}

export interface TaskCreateDTO {
    title: string;
    context?: string;
    status_id?: number;
    priority_id?: number;
    importance?: boolean;
    is_urgent?: boolean;
    list_id?: string;
    schedule?: TaskScheduleDTO;
    execution?: TaskExecutionDTO;
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
    status_id: (dto.status_id as TaskStatusId) || 1,
    energyCost: dto.execution?.energy_cost || 1,
    context: dto.context || "",
    priority_id: (dto.priority_id as TaskPriorityId) || 2,
    deadline: dto.schedule?.deadline,
    scheduledDate: dto.schedule?.scheduled_date,
    startedAt: dto.execution?.started_at,
    endedAt: dto.execution?.ended_at,
    importance: dto.importance,
    isUrgent: dto.is_urgent,
    listId: dto.list_id,
    createdAt: dto.created_at,
});

const mapToDTO = (task: Partial<Task> & { title: string; energyCost: number; context: string; list_id?: string }): TaskCreateDTO => ({
    title: task.title,
    context: task.context,
    status_id: task.status_id,
    priority_id: task.priority_id,
    importance: task.importance,
    is_urgent: task.isUrgent,
    list_id: task.list_id || task.listId,
    schedule: {
        deadline: task.deadline,
        scheduled_date: task.scheduledDate,
    },
    execution: {
        energy_cost: task.energyCost || 1,
        started_at: task.startedAt,
        ended_at: task.endedAt,
    }
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

export const getTasks = async (listId?: string, status_id?: number, min_energy?: number): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (listId) params.append('list_id', listId);
    if (status_id) params.append('status_id', status_id.toString());
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
    if (updates.title !== undefined) dtoUpdates.title = updates.title;
    if (updates.status_id !== undefined) dtoUpdates.status_id = updates.status_id;
    if (updates.priority_id !== undefined) dtoUpdates.priority_id = updates.priority_id;
    if (updates.context !== undefined) dtoUpdates.context = updates.context;
    
    // Nested Updates logic wrapper (merging if existing keys passed)
    if (updates.deadline !== undefined || updates.scheduledDate !== undefined) {
        dtoUpdates.schedule = {
            deadline: updates.deadline,
            scheduled_date: updates.scheduledDate
        };
    }
    
    if (updates.energyCost !== undefined || updates.startedAt !== undefined || updates.endedAt !== undefined) {
        dtoUpdates.execution = {
            energy_cost: updates.energyCost,
            started_at: updates.startedAt,
            ended_at: updates.endedAt
        };
    }

    const response = await api.patch<TaskDTO>(`/tasks/${id}`, dtoUpdates);
    return mapToDomain(response.data);
};

export const deleteTask = async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
};
