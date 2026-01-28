"use client";

import Link from "next/link";
import { Folder, Network, ArrowRight, MoreVertical } from "lucide-react";

const projects = [
    { id: 'system-architecture', name: 'System Architecture', nodes: 12, status: 'Active', updatedAt: '2h ago' },
    { id: 'marketing-campaign', name: 'Q1 Marketing Campaign', nodes: 8, status: 'Planning', updatedAt: '1d ago' },
    { id: 'home-renovation', name: 'Home Renovation', nodes: 24, status: 'On Hold', updatedAt: '3d ago' },
];

export default function MapPage() {
    return (
        <div className="max-w-5xl mx-auto py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
                <p className="text-slate-500 mt-2">Select a project to visualize its dependency map.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        href={`/map/${project.id}`}
                        className="group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Network className="size-6" />
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">
                                <MoreVertical className="size-5" />
                            </button>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{project.name}</h3>
                        <p className="text-sm text-slate-500 mb-4">{project.nodes} Tasks • {project.status}</p>

                        <div className="mt-auto flex items-center justify-between text-sm pt-4 border-t border-slate-50">
                            <span className="text-slate-400">Updated {project.updatedAt}</span>
                            <span className="flex items-center gap-1 text-indigo-600 font-medium group-hover:gap-2 transition-all">
                                View Map <ArrowRight className="size-4" />
                            </span>
                        </div>
                    </Link>
                ))}

                {/* Create New Project Placeholder */}
                <button className="group border-2 border-dashed border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors h-[220px]">
                    <div className="p-4 rounded-full bg-slate-50 mb-3 group-hover:bg-indigo-50 transition-colors">
                        <Folder className="size-8" />
                    </div>
                    <span className="font-medium">Create New Project</span>
                </button>
            </div>
        </div>
    );
}
