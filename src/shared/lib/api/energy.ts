import api from './client';

export interface SystemState {
    current_energy: number;
    pending_tasks: number;
    overdue_tasks: number;
}

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
