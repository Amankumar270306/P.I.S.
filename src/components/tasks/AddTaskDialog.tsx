"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Check } from "lucide-react";
import { SmartTaskInput } from "@/components/inbox/SmartTaskInput";

export function AddTaskDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit?: (task: any) => void }) {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-2xl">
                    <div className="flex flex-col gap-1.5 text-center sm:text-left">
                        <Dialog.Title className="text-xl font-semibold leading-none tracking-tight text-slate-900">
                            New Task
                        </Dialog.Title>
                        <Dialog.Description className="text-slate-500 text-sm">
                            Capture what needs to be done.
                        </Dialog.Description>
                    </div>

                    <div className="py-4">
                        <SmartTaskInput onSubmit={(task) => {
                            onSubmit?.(task);
                            onOpenChange(false);
                        }} />
                    </div>

                    <Dialog.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-slate-100 text-slate-500 hover:text-slate-900">
                        <X className="w-4 h-4" />
                        <span className="sr-only">Close</span>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
