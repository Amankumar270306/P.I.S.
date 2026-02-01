"use client";

import { EnergyMeter } from "@/components/dashboard/EnergyMeter";
import { StatCards } from "@/components/dashboard/StatCards";
import { ProductivityHeatmap } from "@/components/dashboard/ProductivityHeatmap";
import { SmartInput } from "@/components/tasks/SmartInput";
import { ConsistencyGraph } from "@/components/dashboard/ConsistencyGraph";
import { useFocus } from "@/context/FocusContext";
import { useState, useEffect } from "react";
import { createTask, getTasks, getTodayEnergy, EnergyStatus } from "@/lib/api";
import { Task } from "@/types/task";

export default function Home() {
  const { startSession } = useFocus();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [energy, setEnergy] = useState<EnergyStatus>({ date: '', capacity: 30, used: 0, remaining: 30 });

  const fetchEnergy = async () => {
    try {
      const data = await getTodayEnergy();
      setEnergy(data);
    } catch (e) {
      console.error("Failed to fetch energy", e);
    }
  };

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
    fetchEnergy();
  }, []);

  const handleCreateTask = async (task: {
    title: string;
    date: Date | null;
    description?: string;
    startedAt?: string;
    endedAt?: string;
    energyCost: number;
    importance: boolean;
    isUrgent: boolean;
  }) => {
    try {
      // Helper to combine date and time if both exist
      const formatDateWithTime = (date: Date | null, timeStr?: string) => {
        if (!date) return undefined;
        if (!timeStr) return date.toISOString();

        const [hours, minutes] = timeStr.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours, minutes, 0, 0);
        return newDate.toISOString();
      };

      // Determine explicit deadline from parsed date + end time or just date
      // Storing just in deadline for now as 'scheduled_date' usually maps to deadline in basic view
      const finalDeadline = formatDateWithTime(task.date, task.endedAt);

      // Also construct startedAt ISO if needed. 
      // Note: startedAt/endedAt in schema are usually execution logs, but we'll map them here if user intended planning.
      // But standard `started_at` in our model is "When did I start working".
      // If user wants planned start/end, we might need new columns `planned_start`.
      // For now, let's map input `startedAt` string directly or to `scheduled_date`?
      // Re-reading user request: "Start to end time both are optional".
      // I will store them as is in the props if the backend supports strings (it expects datetime).
      // So I will parse them against the `task.date` (or today).

      const referenceDate = task.date || new Date();
      const finalStartedAt = task.startedAt ? formatDateWithTime(referenceDate, task.startedAt) : undefined;
      const finalEndedAt = task.endedAt ? formatDateWithTime(referenceDate, task.endedAt) : undefined;

      const newTask = await createTask({
        title: task.title,
        energyCost: task.energyCost,
        context: task.description || "", // Map description to context
        deadline: finalDeadline,
        startedAt: finalStartedAt,
        endedAt: finalEndedAt,
        importance: task.importance,
        isUrgent: task.isUrgent
      });
      setTasks(prev => [newTask, ...prev].slice(0, 5));
      fetchEnergy(); // Refresh energy after task creation
    } catch (e: any) {
      console.error("Failed to create task", e);
      // Show error to user if energy limit exceeded
      if (e.response?.data?.detail) {
        alert(e.response.data.detail);
      }
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
          <EnergyMeter currentEnergy={energy.used} maxEnergy={energy.capacity} />
        </div>
        <div className="md:col-span-2">
          <StatCards />
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Heatmap & Calendar */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
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
