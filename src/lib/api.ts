import axios from 'axios';
import { Task, TaskContext, TaskPriority, TaskStatus } from '@/types/task';

// Backend DTOs
export enum ContextEnum {
    DEEP_WORK = "DEEP_WORK",
    ADMIN = "ADMIN",
    MEETING = "MEETING",
    ERRAND = "ERRAND"
}

export interface TaskDTO {
    id: number;
    title: string;
    energy_cost: number;
    context: ContextEnum;
    status: string;
    priority: string;
    created_at: string;
    deadline?: string;
}

export interface TaskCreateDTO {
    title: string;
    energy_cost: number;
    context: ContextEnum;
    status?: string;
    priority?: string;
    deadline?: string;
}

export interface SystemState {
    current_energy: number;
    pending_tasks: number;
    overdue_tasks: number;
}

// Axios Instance
const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Mappers
const mapToDomain = (dto: TaskDTO): Task => ({
    id: String(dto.id),
    title: dto.title,
    status: dto.status as TaskStatus,
    energyCost: dto.energy_cost,
    context: dto.context as unknown as TaskContext, // Simplified mapping, assumes enum match
    priority: dto.priority.toLowerCase() as TaskPriority,
});

const mapToDTO = (task: Partial<Task> & { title: string; energyCost: number; context: string }): TaskCreateDTO => ({
    title: task.title,
    energy_cost: task.energyCost,
    context: task.context as unknown as ContextEnum,
    status: task.status,
    priority: task.priority ? (task.priority.charAt(0).toUpperCase() + task.priority.slice(1)) : "Medium",
    // deadline: ...
});

// API Functions

export const getTasks = async (status?: string, min_energy?: number): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (min_energy) params.append('min_energy', min_energy.toString());

    const response = await api.get<TaskDTO[]>('/tasks/', { params });
    return response.data.map(mapToDomain);
};

export const createTask = async (task: { title: string; energyCost: number; context: string; priority?: string }): Promise<Task> => {
    const dto = mapToDTO(task as any);
    const response = await api.post<TaskDTO>('/tasks/', dto);
    return mapToDomain(response.data);
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
    // Partial mapping logic
    const dtoUpdates: Partial<TaskCreateDTO> = {};
    if (updates.title) dtoUpdates.title = updates.title;
    if (updates.energyCost) dtoUpdates.energy_cost = updates.energyCost;
    if (updates.status) dtoUpdates.status = updates.status;

    const response = await api.patch<TaskDTO>(`/tasks/${id}`, dtoUpdates);
    return mapToDomain(response.data);
};

export const getSystemState = async (): Promise<SystemState> => {
    const response = await api.get<SystemState>('/system/state');
    return response.data;
};

export const autoSchedule = async (): Promise<{ scheduled_count: number; backlog_count: number; message: string }> => {
    const response = await api.post('/schedule/auto-plan');
    return response.data;
};

export const chatAgent = async (message: string): Promise<{ response: string }> => {
    const response = await api.post('/agent/chat', { message });
    return response.data;
};

// --- Chat API ---

export interface ChatUser {
    id: string;
    username: string;
    avatar_url: string;
}

export interface Channel {
    id: string;
    name: string;
    is_group: boolean;
}

export interface ChatMessage {
    id: string;
    channel_id: string;
    sender_id: string;
    content: string;
    created_at: string;
}

export const getChatUsers = async (): Promise<ChatUser[]> => {
    const response = await api.get('/chat/users');
    return response.data;
};

export const createChatUser = async (username: string): Promise<ChatUser> => {
    const response = await api.post('/chat/users', { username });
    return response.data;
};

export const getChannels = async (): Promise<Channel[]> => {
    const response = await api.get('/chat/channels');
    return response.data;
};

export const createChannel = async (name: string, is_group: boolean = false): Promise<Channel> => {
    const response = await api.post('/chat/channels', { name, is_group });
    return response.data;
};

export const getChatHistory = async (channelId: string): Promise<ChatMessage[]> => {
    const response = await api.get(`/chat/history/${channelId}`);
    return response.data;
};

export default api;

// --- Document API ---

export interface Document {
    id: number;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export const getDocuments = async (): Promise<Document[]> => {
    const response = await api.get('/documents/');
    return response.data;
};

export const createDocument = async (title: string, content: string = ""): Promise<Document> => {
    const response = await api.post('/documents/', { title, content });
    return response.data;
};

export const updateDocument = async (id: number, data: Partial<Document>): Promise<Document> => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
};

export const deleteDocument = async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
};
