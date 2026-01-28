"use client";

import React, { createContext, useContext, useState } from "react";

interface UIContextType {
    isTaskModalOpen: boolean;
    openTaskModal: () => void;
    closeTaskModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const openTaskModal = () => setIsTaskModalOpen(true);
    const closeTaskModal = () => setIsTaskModalOpen(false);

    return (
        <UIContext.Provider value={{ isTaskModalOpen, openTaskModal, closeTaskModal }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
}
