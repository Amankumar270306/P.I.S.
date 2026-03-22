"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import {
    Calendar,
    FileText,
    Inbox,
    LayoutDashboard,
    Plus,
    Zap,
    Timer,
    Moon,
    Laptop
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useUI } from "@/providers/UIContext";

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const { openTaskModal } = useUI();

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Menu"
            className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
        >
            <Dialog.Title className="sr-only">Global Command Menu</Dialog.Title>

            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
                <Command.Input
                    placeholder="What do you want to do?"
                    className="w-full px-4 py-4 text-lg border-b border-slate-100 focus:outline-none placeholder:text-slate-400 text-slate-800"
                />

                <Command.List className="max-h-[300px] overflow-y-auto p-2">
                    <Command.Empty className="py-6 text-center text-sm text-slate-500">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Navigation" className="text-xs font-medium text-slate-400 px-2 py-1.5 mb-1">
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/"))}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer"
                        >
                            <LayoutDashboard className="size-4" />
                            <span>Go to Command Center</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/inbox"))}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer"
                        >
                            <Inbox className="size-4" />
                            <span>Go to Inbox</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/calendar"))}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer"
                        >
                            <Calendar className="size-4" />
                            <span>Go to Calendar</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => router.push("/brain"))}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer"
                        >
                            <FileText className="size-4" />
                            <span>Go to Brain</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="Actions" className="text-xs font-medium text-slate-400 px-2 py-1.5 mb-1 mt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => openTaskModal())}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Create New Task</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => console.log("Log Energy Spike"))}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer"
                        >
                            <Zap className="size-4" />
                            <span>Log Energy Spike</span>
                        </Command.Item>
                        <Command.Item
                            onSelect={() => runCommand(() => console.log("Start Focus Session"))}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer"
                        >
                            <Timer className="size-4" />
                            <span>Start Focus Session</span>
                        </Command.Item>
                    </Command.Group>

                    <Command.Group heading="System" className="text-xs font-medium text-slate-400 px-2 py-1.5 mb-1 mt-2">
                        <Command.Item
                            onSelect={() => runCommand(() => console.log("Toggle Dark Mode"))}
                            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-700 rounded-lg aria-selected:bg-indigo-50 aria-selected:text-indigo-700 cursor-pointer"
                        >
                            <Moon className="size-4" />
                            <span>Toggle Dark Mode</span>
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </div>
        </Command.Dialog>
    );
}
