"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/shared/components/Sidebar";
import { CommandPalette } from "@/shared/components/CommandPalette";
import { AuthGuard } from "@/shared/components/AuthGuard";
import { cn } from "@/shared/lib/utils";
import { Plus } from "lucide-react";
import { useUI } from "@/providers/UIContext";
import { useAuth } from "@/lib/auth-context";

const publicRoutes = ["/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { openTaskModal } = useUI();
    const { user } = useAuth();
    const pathname = usePathname();

    const isPublicRoute = publicRoutes.includes(pathname);

    // For public routes (login/register), render without sidebar
    if (isPublicRoute) {
        return (
            <AuthGuard>
                <div className="min-h-screen bg-white">
                    {children}
                </div>
            </AuthGuard>
        );
    }

    // For protected routes, render with full app shell
    return (
        <AuthGuard>
            <div className="min-h-screen bg-white relative">
                <CommandPalette />
                <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

                <main
                    className={cn(
                        "transition-all duration-300 ease-in-out min-h-screen",
                        isSidebarCollapsed ? "ml-20" : "ml-64"
                    )}
                >
                    {children}
                </main>

                {/* Global FAB */}
                <button
                    onClick={openTaskModal}
                    className="fixed bottom-8 right-8 z-40 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
                    aria-label="Add Task"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </AuthGuard>
    );
}
