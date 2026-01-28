import axios from 'axios';

// Strict Type Definitions matching Pydantic Schemas

export enum ContextEnum {
    DEEP_WORK = "DEEP_WORK",
    ADMIN = "ADMIN",
    MEETING = "MEETING",
    ERRAND = "ERRAND"
}

export interface TaskCreate {
    title: string;
    energy_cost: number; // 1-10
    context: ContextEnum;
    status?: string;
    deadline?: string; // ISO Datetime string
}

export interface Task extends TaskCreate {
    id: number;
    created_at: string;
}

export interface SystemState {
    current_energy: number;
    pending_tasks: number;
    overdue_tasks: number;
}

// Axios Instance
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// API Functions

export const getTasks = async (status?: string, min_energy?: number): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (min_energy) params.append('min_energy', min_energy.toString());

    const response = await api.get('/tasks/', { params });
    return response.data;
};

export const createTask = async (task: TaskCreate): Promise<Task> => {
    const response = await api.post('/tasks/', task);
    return response.data;
};

export const updateTask = async (id: number, updates: Partial<TaskCreate>): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, updates);
    return response.data;
};

export const getSystemState = async (): Promise<SystemState> => {
    const response = await api.get('/system/state');
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
