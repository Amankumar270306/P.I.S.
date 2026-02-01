"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Command, FileText, Settings, Calendar, User, PanelLeftClose, PanelLeftOpen, ListTodo, LogOut, Network, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DailyReviewModal } from './review/DailyReviewModal';
import { useAuth } from '@/lib/auth-context';

const navItems = [
    { name: 'Command Center', href: '/', icon: Command },
    { name: 'Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Project Map', href: '/map', icon: Network },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Brain', href: '/brain', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen bg-slate-50 border-r border-slate-200 flex flex-col justify-between transition-all duration-300 ease-in-out z-50",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className="p-3">
                <div className="mb-6 flex items-center justify-between px-2 py-2">
                    {!isCollapsed && (
                        <h1 className="text-lg font-bold text-slate-900 leading-tight opacity-100 transition-opacity duration-300">
                            Personal Intelligence Scheduler
                        </h1>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors ml-auto"
                    >
                        {isCollapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
                    </button>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors overflow-hidden whitespace-nowrap",
                                    isActive
                                        ? "bg-indigo-50 text-indigo-600"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                                title={isCollapsed ? item.name : undefined}
                            >
                                <item.icon className={cn("size-6 shrink-0", isActive ? "text-indigo-600" : "text-slate-400")} />
                                <span className={cn(
                                    "transition-all duration-300",
                                    isCollapsed ? "opacity-0 w-0" : "opacity-100 w-auto"
                                )}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-3 border-t border-slate-200 space-y-3">
                <button
                    onClick={() => setIsReviewOpen(true)}
                    className={cn(
                        "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors group",
                        isCollapsed ? "justify-center" : ""
                    )}
                    title={isCollapsed ? "Daily Review" : undefined}
                >
                    <div className="flex items-center justify-center size-5 shrink-0 text-slate-400 group-hover:text-indigo-600">
                        <FileText className="size-5" />
                    </div>
                    <span className={cn(
                        "text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden",
                        isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"
                    )}>
                        End Day Review
                    </span>
                </button>

                {/* User Profile Section */}
                <div className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-lg overflow-hidden whitespace-nowrap",
                    isCollapsed ? "justify-center" : ""
                )}>
                    <div className="flex items-center justify-center size-9 shrink-0 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-600">
                        {user?.name ? (
                            <span className="text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                        ) : (
                            <User className="size-5" />
                        )}
                    </div>
                    <div className={cn(
                        "flex flex-col flex-1 min-w-0 transition-all duration-300",
                        isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"
                    )}>
                        <span className="text-sm font-semibold text-slate-900 truncate">
                            {user?.name || 'Guest'}
                        </span>
                        <span className="text-xs text-slate-500 truncate">
                            {user?.email || 'Not logged in'}
                        </span>
                    </div>
                </div>

                {/* Logout Button */}
                {user && (
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group",
                            isCollapsed ? "justify-center" : ""
                        )}
                        title={isCollapsed ? "Logout" : undefined}
                    >
                        <div className="flex items-center justify-center size-5 shrink-0 text-slate-400 group-hover:text-red-600">
                            <LogOut className="size-5" />
                        </div>
                        <span className={cn(
                            "text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden",
                            isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto"
                        )}>
                            Logout
                        </span>
                    </button>
                )}
            </div>

            <DailyReviewModal open={isReviewOpen} onOpenChange={setIsReviewOpen} />
        </aside>
    );
}
