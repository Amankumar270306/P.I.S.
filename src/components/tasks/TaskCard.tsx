import { Zap } from 'lucide-react';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';

interface TaskCardProps {
    task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
    const contextColors = {
        Work: "bg-blue-100 text-blue-700",
        Personal: "bg-purple-100 text-purple-700",
        Errand: "bg-orange-100 text-orange-700",
    };

    return (
        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-indigo-300 transition-colors">
            <div className="flex items-center gap-3">
                <div className={cn("size-2 rounded-full", {
                    'bg-slate-300': task.status === 'todo',
                    'bg-indigo-500': task.status === 'in-progress',
                    'bg-green-500': task.status === 'done',
                })} />
                <span className="font-medium text-slate-700">{task.title}</span>
            </div>

            <div className="flex items-center gap-3">
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", contextColors[task.context])}>
                    {task.context}
                </span>
                <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    <Zap className="size-3 text-yellow-500 filling-current" fill="currentColor" />
                    <span>{task.energyCost}</span>
                </div>
            </div>
        </div>
    );
}
