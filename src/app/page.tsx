"use client";

import { EnergyMeter } from "@/components/dashboard/EnergyMeter";
import { StatCards } from "@/components/dashboard/StatCards";
import { ProductivityHeatmap } from "@/components/dashboard/ProductivityHeatmap";
import { SmartInput } from "@/components/tasks/SmartInput";
import { ConsistencyGraph } from "@/components/dashboard/ConsistencyGraph";
import { useFocus } from "@/context/FocusContext";
import { useState, useEffect } from "react";
import { createTask, getTasks } from "@/lib/api";
import { Task } from "@/types/task";

export default function Home() {
  const { startSession } = useFocus();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getTasks();
        setTasks(data.reverse().slice(0, 5));
      } catch (e) {
        console.error("Failed to fetch tasks", e);
      }
    };
    fetchTasks();
  }, []);

  const handleCreateTask = async (task: { title: string; date: Date | null }) => {
    try {
      const newTask = await createTask({
        title: task.title,
        energyCost: 5,
        context: "DEEP_WORK",
        deadline: task.date?.toISOString()
      });
      setTasks(prev => [newTask, ...prev].slice(0, 5));
    } catch (e) {
      console.error("Failed to create task", e);
    }
  };

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
          <EnergyMeter currentEnergy={0} maxEnergy={30} />
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

          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
            <ConsistencyGraph />
          </div>
        </div>

        {/* Right Column: Quick Capture */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm h-full flex flex-col">
            <h3 className="text-base font-bold text-slate-800 mb-4">Quick Capture</h3>
            <SmartInput onCreateTask={handleCreateTask} />

            <div className="mt-6 flex-1">
              <h4 className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-wider">Recently Added</h4>
              {tasks.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
                  <p>No tasks yet.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {tasks.map((t) => (
                    <li key={t.id} className="group flex items-start justify-between p-2.5 bg-white hover:bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-100 transition-all shadow-sm cursor-pointer">
                      <div className="min-w-0">
                        <span className="text-slate-700 text-sm font-medium block truncate group-hover:text-indigo-700">{t.title}</span>
                        {t.deadline && (
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Due {new Date(t.deadline).toLocaleDateString()}
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
      </section >
    </div >
  );
}
