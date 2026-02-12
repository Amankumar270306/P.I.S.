"use client";

import { EnergyMeter } from "@/components/dashboard/EnergyMeter";

import { ProductivityHeatmap } from "@/components/dashboard/ProductivityHeatmap";
import { ConsistencyGraph } from "@/components/dashboard/ConsistencyGraph";
import { useFocus } from "@/context/FocusContext";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { createTask, getTasks, getTodayEnergy, EnergyStatus } from "@/lib/api";
import { Task } from "@/types/task";
import { Circle, CheckCircle2, Clock, CalendarOff, Play, ArrowRight } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";

export default function Home() {
  const { startSession } = useFocus();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [energy, setEnergy] = useState<EnergyStatus>({ date: '', capacity: 90, used: 0, remaining: 90 });

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
        setTasks(data);
      } catch (e) {
        console.error("Failed to fetch tasks", e);
      }
    };
    fetchTasks();
    fetchEnergy();
  }, []);

  // Compute Daily Energy Stats
  const today = new Date();
  const dailyStats = tasks.reduce((acc, task) => {
    // Determine if task is relevant for "Today"
    const deadline = task.deadline ? parseISO(task.deadline) : null;
    const started = task.startedAt ? parseISO(task.startedAt) : null;
    const ended = task.endedAt ? parseISO(task.endedAt) : null;

    const isDeadlineToday = deadline && isSameDay(deadline, today);
    const isStartedToday = started && isSameDay(started, today);
    const isEndedToday = ended && isSameDay(ended, today);

    let isRelevant = false;
    if (task.status === 'done') {
      isRelevant = !!isEndedToday;
    } else {
      isRelevant = !!(isDeadlineToday || isStartedToday || task.status === 'in_progress');
    }

    if (isRelevant) {
      acc.planned += task.energyCost;
      if (task.status === 'done') {
        acc.completed += task.energyCost;
      }
    }
    return acc;
  }, { planned: 0, completed: 0 });

  // Filter: tasks due today with no start time (not on calendar)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayUnscheduled = tasks.filter(t => {
    if (t.status === 'done') return false;
    if (!t.deadline) return false;
    const deadlineDate = t.deadline.split('T')[0];
    const isToday = deadlineDate === todayStr;
    const hasNoTime = !t.startedAt;
    return isToday && hasNoTime;
  });

  // In-progress tasks
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

  // Next scheduled task today (has startedAt time, not done, deadline today, sorted by startedAt ascending)
  const now = new Date();
  const nextScheduledTask = tasks
    .filter(t => {
      if (t.status === 'done') return false;
      if (t.status === 'in_progress') return false;
      if (!t.startedAt) return false;
      const taskDate = t.deadline?.split('T')[0] || t.startedAt.split('T')[0];
      return taskDate === todayStr && new Date(t.startedAt) > now;
    })
    .sort((a, b) => new Date(a.startedAt!).getTime() - new Date(b.startedAt!).getTime())[0] || null;


  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 px-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200/60 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Command Center</h1>
          <p className="text-slate-500 text-sm">Welcome back, {user?.firstName || "User"}.</p>
        </div>
        <button
          onClick={() => startSession("Focus Session")}
          className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm shadow-indigo-200 hover:shadow-indigo-300 flex items-center justify-center gap-2"
        >
          <span>Start Focus Session</span>
        </button>
      </header>

      {/* Stats Row: Energy Bar | Current Tasks | Productivity Pulse */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <EnergyMeter plannedEnergy={dailyStats.planned} completedEnergy={dailyStats.completed} maxEnergy={energy.capacity} />
        </div>
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-1.5 mb-2">
              <Play className="size-3.5 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800">Current Tasks</h3>
            </div>

            {inProgressTasks.length === 0 && !nextScheduledTask ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[10px] text-slate-400 text-center">No active tasks</p>
              </div>
            ) : (
              <div className="space-y-1.5 flex-1">
                {inProgressTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 p-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-xs font-medium text-emerald-800 truncate">{t.title}</span>
                  </div>
                ))}

                {nextScheduledTask && (
                  <>
                    <div className="flex items-center gap-1 py-0.5">
                      <ArrowRight className="size-2.5 text-slate-300" />
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Up next</span>
                    </div>
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                      <Clock className="size-3 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-slate-700 truncate block">{nextScheduledTask.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(nextScheduledTask.startedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden h-full">
            <ProductivityHeatmap />
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Consistency Graph */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
            <ConsistencyGraph />
          </div>
        </div>

        {/* Right Column: Today's Unscheduled Tasks */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <CalendarOff className="size-4 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-800">Today&apos;s Tasks</h3>
              <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {todayUnscheduled.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-wider font-bold">Not on calendar — no time set</p>

            <div className="flex-1 overflow-y-auto">
              {todayUnscheduled.length === 0 ? (
                <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
                  <Clock className="size-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">All clear!</p>
                  <p className="mt-1">No unscheduled tasks for today.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {todayUnscheduled.map((t) => (
                    <li key={t.id} className="group flex items-start gap-3 p-3 bg-white hover:bg-indigo-50/50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-all shadow-sm cursor-pointer">
                      <div className="mt-0.5 text-slate-300 group-hover:text-indigo-400 transition-colors">
                        {t.status === 'in_progress' ? <CheckCircle2 className="size-4 text-indigo-500" /> : <Circle className="size-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-700 text-sm font-medium block truncate group-hover:text-indigo-700">{t.title}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {t.energyCost} pts ({t.energyCost * 10} min)
                          </span>
                          {t.importance && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Important</span>
                          )}
                          {t.isUrgent && (
                            <span className="text-[10px] font-medium text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Urgent</span>
                          )}
                        </div>
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
