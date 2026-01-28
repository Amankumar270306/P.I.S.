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
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Command Center</h1>
          <p className="text-slate-500">Welcome back, User. You have 45 minutes until your next scheduled break.</p>
        </div>
        <button
          onClick={() => startSession("Drafting System Architecture")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          Start Focused Session
        </button>
      </header>

      <section className="space-y-6">
        <EnergyMeter currentEnergy={12} maxEnergy={40} />
        <StatCards />
        <ProductivityHeatmap />
      </section>

      {/* Widgets Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 min-h-[300px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Capture</h3>
          <SmartInput onCreateTask={(task) => {
            const newTask = { ...task, id: Date.now().toString(), status: 'todo' };
            // Using a local state for demo purposes as requested
            setDemoTasks(prev => [newTask, ...prev]);
          }} />

          <div className="mt-6 flex-1">
            <h4 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">Recently Added</h4>
            {demoTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No tasks added yet. Try typing above!
              </div>
            ) : (
              <ul className="space-y-2">
                {demoTasks.map((t: any) => (
                  <li key={t.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-700 font-medium">{t.title}</span>
                    {t.date && (
                      <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                        Due: {new Date(t.date).toLocaleDateString()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 min-h-[300px] flex items-center justify-center text-slate-400">
          Calendar Widget
        </div>
      </section>
    </div>
  );
}
