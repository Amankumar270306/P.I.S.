"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const publicRoutes = ["/login", "/register"];

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isPublicRoute = publicRoutes.includes(pathname);

    useEffect(() => {
        if (isLoading) return;

        if (!user && !isPublicRoute) {
            // Not logged in and trying to access protected route
            router.push("/login");
        } else if (user && isPublicRoute) {
            // Logged in but on login/register page
            router.push("/");
        }
    }, [user, isLoading, isPublicRoute, router]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                    <span className="text-slate-500 text-sm">Loading...</span>
                </div>
            </div>
        );
    }

    // If not logged in and on protected route, don't render children (will redirect)
    if (!user && !isPublicRoute) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                    <span className="text-slate-500 text-sm">Redirecting to login...</span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
