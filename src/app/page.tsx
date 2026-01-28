"use client";

import { EnergyMeter } from "@/components/dashboard/EnergyMeter";
import { StatCards } from "@/components/dashboard/StatCards";
import { ProductivityHeatmap } from "@/components/dashboard/ProductivityHeatmap";
import { SmartInput } from "@/components/tasks/SmartInput";
import { useFocus } from "@/context/FocusContext";
import { useState } from "react";

export default function Home() {
  const { startSession } = useFocus();
  const [demoTasks, setDemoTasks] = useState<any[]>([]);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 px-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200/60 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Command Center</h1>
          <p className="text-slate-500 text-sm">Welcome back, User.</p>
        </div>
        <button
          onClick={() => startSession("Focus Session")}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shadow-indigo-200 hover:shadow-indigo-300 flex items-center justify-center gap-2"
        >
          <span>Start Focus Session</span>
        </button>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-1">
          <EnergyMeter currentEnergy={12} maxEnergy={40} />
        </div>
        <div className="md:col-span-2">
          <StatCards />
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Heatmap & Calendar */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Productivity Pulse</h3>
              <select className="text-xs bg-slate-50 border-none rounded-md text-slate-500 py-1 px-2 focus:ring-0">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>
            <ProductivityHeatmap />
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm min-h-[200px] flex items-center justify-center text-slate-400 bg-slate-50/30">
            <p className="text-sm">Calendar Integration Loading...</p>
          </div>
        </div>

        {/* Right Column: Quick Capture */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm h-full flex flex-col">
            <h3 className="text-base font-bold text-slate-800 mb-4">Quick Capture</h3>
            <SmartInput onCreateTask={(task) => {
              const newTask = { ...task, id: Date.now().toString(), status: 'todo' };
              setDemoTasks(prev => [newTask, ...prev]);
            }} />

            <div className="mt-6 flex-1">
              <h4 className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Recently Added</h4>
              {demoTasks.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
                  <p>No tasks yet.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {demoTasks.map((t: any) => (
                    <li key={t.id} className="group flex items-start justify-between p-2.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-100 transition-all shadow-sm cursor-pointer">
                      <div className="min-w-0">
                        <span className="text-slate-700 text-sm font-medium block truncate group-hover:text-indigo-700">{t.title}</span>
                        {t.date && (
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Due {new Date(t.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
