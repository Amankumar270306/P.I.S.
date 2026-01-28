import { EnergyMeter } from "@/components/dashboard/EnergyMeter";
import { StatCards } from "@/components/dashboard/StatCards";
import { TaskList } from "@/components/tasks/TaskList";
import { Task } from "@/types/task";

const initialTasks: Task[] = [
  { id: '1', title: 'Complete Project Board', status: 'in-progress', energyCost: 5, context: 'Work' },
  { id: '2', title: 'Review PRs', status: 'todo', energyCost: 3, context: 'Work' },
  { id: '3', title: 'Buy Groceries', status: 'todo', energyCost: 2, context: 'Errand' },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-bold leading-tight text-slate-900">
          Command Center
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Welcome to your new dashboard.
        </p>
      </div>

      <div className="space-y-8">
        <EnergyMeter currentEnergy={25} />
        <StatCards />

        <div className="pt-4 border-t border-slate-200">
          <TaskList initialTasks={initialTasks} />
        </div>
      </div>
    </div>
  );
}
