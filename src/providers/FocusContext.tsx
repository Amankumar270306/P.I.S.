"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface FocusContextType {
    isFocusModeActive: boolean;
    activeTask: string | null;
    startSession: (task: string) => void;
    endSession: () => void;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: ReactNode }) {
    const [isFocusModeActive, setIsFocusModeActive] = useState(false);
    const [activeTask, setActiveTask] = useState<string | null>(null);

    const startSession = (task: string) => {
        setActiveTask(task);
        setIsFocusModeActive(true);
    };

    const endSession = () => {
        setIsFocusModeActive(false);
        setActiveTask(null);
    };

    return (
        <FocusContext.Provider value={{ isFocusModeActive, activeTask, startSession, endSession }}>
            {children}
        </FocusContext.Provider>
    );
}

export function useFocus() {
    const context = useContext(FocusContext);
    if (context === undefined) {
        throw new Error("useFocus must be used within a FocusProvider");
    }
    return context;
}
