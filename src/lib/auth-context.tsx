"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
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

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            // Simulate API call - replace with actual Supabase auth later
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For demo: accept any email/password with basic validation
            if (!email.includes("@")) {
                return { success: false, error: "Invalid email format" };
            }
            if (password.length < 6) {
                return { success: false, error: "Password must be at least 6 characters" };
            }

            const newUser: User = {
                id: crypto.randomUUID(),
                email,
                name: email.split("@")[0]
            };

            setUser(newUser);
            localStorage.setItem("pis_user", JSON.stringify(newUser));
            return { success: true };
        } catch (error) {
            return { success: false, error: "Login failed. Please try again." };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            // Simulate API call - replace with actual Supabase auth later
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (!email.includes("@")) {
                return { success: false, error: "Invalid email format" };
            }
            if (password.length < 6) {
                return { success: false, error: "Password must be at least 6 characters" };
            }
            if (!name.trim()) {
                return { success: false, error: "Name is required" };
            }

            const newUser: User = {
                id: crypto.randomUUID(),
                email,
                name
            };

            setUser(newUser);
            localStorage.setItem("pis_user", JSON.stringify(newUser));
            return { success: true };
        } catch (error) {
            return { success: false, error: "Registration failed. Please try again." };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("pis_user");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
