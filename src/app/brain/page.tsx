"use client";

import { Editor } from "@/components/editor/Editor";
import { LinkedTasks } from "@/components/editor/LinkedTasks";

export default function DocsPage() {
    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* Main Editing Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-8 py-12">
                    {/* Document Title */}
                    <input
                        type="text"
                        placeholder="Untitled Document"
                        className="w-full text-4xl font-bold text-slate-900 placeholder:text-slate-300 border-none focus:ring-0 p-0 mb-8 bg-transparent"
                        defaultValue="Project Alpha Strategy"
                    />

                    {/* Tiptap Editor */}
                    <div className="min-h-[500px]">
                        <Editor />
                    </div>
                </div>
            </div>

            {/* Linked Tasks Sidebar */}
            <LinkedTasks />
        </div>
    );
}
