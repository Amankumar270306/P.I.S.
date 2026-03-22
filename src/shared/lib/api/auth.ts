import api from './client';

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
