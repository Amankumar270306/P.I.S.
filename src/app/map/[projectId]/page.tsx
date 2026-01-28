"use client";

import { ProjectMapWrapper } from "@/components/map/ProjectMap";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ProjectDetail() {
    const router = useRouter();

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-4 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    title="Back to Projects"
                >
                    <ArrowLeft className="size-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Project Map</h1>
                    <p className="text-slate-500 text-sm mt-1">Visualize dependencies and blocked tasks.</p>
                </div>
            </header>

            <div className="flex-1 min-h-0 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <ProjectMapWrapper />
            </div>
        </div>
    );
}
