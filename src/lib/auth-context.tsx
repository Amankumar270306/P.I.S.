"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { loginUser, registerUser, UserLoginDTO, UserCreateDTO, UserProfile } from "@/shared/lib/api/auth";

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    age?: number;
    profession?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for stored user session
        const storedUser = localStorage.getItem("pis_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    // Save user to localStorage whenever it changes
    const updateUser = (newUser: User | null) => {
        setUser(newUser);
        if (newUser) {
            localStorage.setItem("pis_user", JSON.stringify(newUser));
        } else {
            localStorage.removeItem("pis_user");
        }
    };

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            const response = await loginUser({ email, password });

            const newUser: User = {
                id: response.user.id,
                email: response.user.email,
                firstName: response.user.first_name,
                lastName: response.user.last_name,
                phone: response.user.phone,
                age: response.user.age,
                profession: response.user.profession
            };

            updateUser(newUser);
            return { success: true };
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || "Login failed. Please try again.";
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, password: string, firstName: string, lastName: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            const response = await registerUser({
                first_name: firstName,
                last_name: lastName,
                email,
                password
            });

            const newUser: User = {
                id: response.id,
                email: response.email,
                firstName: response.first_name,
                lastName: response.last_name,
                phone: response.phone,
                age: response.age,
                profession: response.profession
            };

            updateUser(newUser);
            return { success: true };
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail || "Registration failed. Please try again.";
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        updateUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, setUser: updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
