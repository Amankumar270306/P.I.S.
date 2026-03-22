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

export interface SystemState {
    current_energy: number;
    pending_tasks: number;
    overdue_tasks: number;
}

// User Types
export interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    age?: number;
    profession?: string;
    created_at: string;
    updated_at: string;
}

export interface UserCreateDTO {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    age?: number;
    profession?: string;
}

export interface UserUpdateDTO {
    first_name?: string;
    last_name?: string;
    phone?: string;
    age?: number;
    profession?: string;
}

export interface UserLoginDTO {
    email: string;
    password: string;
}

export interface UserLoginResponse {
    user: UserProfile;
    message: string;
}

// Axios Instance
const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach X-User-Id header from localStorage on every request
api.interceptors.request.use((config: any) => {
    if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('pis_user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user?.id) {
                    config.headers['X-User-Id'] = user.id;
                }
            } catch { }
        }
    }
    return config;
});

// User API Functions
export const registerUser = async (data: UserCreateDTO): Promise<UserProfile> => {
    const response = await api.post<UserProfile>('/auth/register', data);
    return response.data;
};

export const loginUser = async (data: UserLoginDTO): Promise<UserLoginResponse> => {
    const response = await api.post<UserLoginResponse>('/auth/login', data);
    return response.data;
};

export const getCurrentUser = async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/auth/me');
    return response.data;
};

export const getUserById = async (userId: string): Promise<UserProfile> => {
    const response = await api.get<UserProfile>(`/users/${userId}`);
    return response.data;
};

export const updateUser = async (userId: string, data: UserUpdateDTO): Promise<UserProfile> => {
    const response = await api.patch<UserProfile>(`/users/${userId}`, data);
    return response.data;
};

// Mappers
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

// Task List Types
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

// API Functions

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
    // Partial mapping logic
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

// Energy API
export interface EnergyStatus {
    date: string;
    capacity: number;
    used: number;
    remaining: number;
}

export const getTodayEnergy = async (): Promise<EnergyStatus> => {
    const response = await api.get<EnergyStatus>('/energy/today');
    return response.data;
};

export const resetTodayEnergy = async (): Promise<void> => {
    await api.post('/energy/reset');
};

export const getSystemState = async (): Promise<SystemState> => {
    const response = await api.get<SystemState>('/system/state');
    return response.data;
};



export default api;

// --- Consistency Graph API ---

export interface ConsistencyLog {
    id: number;
    user_id: string;
    date: string;
    energy_used: number;
    total_capacity: number;
}

export const getConsistencyLogs = async (userId: string): Promise<ConsistencyLog[]> => {
    const response = await api.get<ConsistencyLog[]>(`/consistency/logs/${userId}`);
    return response.data;
};

export const logConsistency = async (data: { user_id: string; date: string; energy_used: number; total_capacity: number }): Promise<ConsistencyLog> => {
    const response = await api.post<ConsistencyLog>('/consistency/log', data);
    return response.data;
};

// --- Document API ---
export interface Document {
    id: string;  // UUID
    title: string;
    content: any; // JSONB content (Tiptap JSON or null)
    created_at: string;
    last_edited: string;
}

export const getDocuments = async (): Promise<Document[]> => {
    const response = await api.get('/documents/');
    return response.data;
};

export const createDocument = async (title: string, content: object | null = null): Promise<Document> => {
    const response = await api.post('/documents/', { title, content });
    return response.data;
};

export const updateDocument = async (id: string, data: Partial<Document>): Promise<Document> => {
    const response = await api.put(`/documents/${id}`, data);
    return response.data;
};

export const deleteDocument = async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
};
