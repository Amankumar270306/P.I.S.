"use client";

import { ProjectMapWrapper } from "@/components/map/ProjectMap";

export default function MapPage() {
    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col">
            <header className="mb-4">
                <h1 className="text-3xl font-bold text-slate-900">Project Map</h1>
                <p className="text-slate-500 text-sm mt-1">Visualize dependencies and blocked tasks.</p>
            </header>

            <div className="flex-1 min-h-0 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <ProjectMapWrapper />
            </div>
        </div>
    );
}
