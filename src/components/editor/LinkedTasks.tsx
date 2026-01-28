import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const linkedTasks = [
    { id: "1", title: "Definite project scope", status: "done" },
    { id: "2", title: "Create moodboard", status: "in-progress" },
    { id: "3", title: "Draft initial content", status: "todo" },
];

export function LinkedTasks() {
    return (
        <div className="w-80 border-l border-slate-200 bg-slate-50 p-6 hidden xl:block h-full overflow-y-auto">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                    Linked Tasks
                </h3>

                <div className="space-y-3">
                    {linkedTasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm"
                        >
                            <div className={cn("mt-0.5",
                                task.status === "done" ? "text-green-500" :
                                    task.status === "in-progress" ? "text-indigo-500" : "text-slate-300"
                            )}>
                                {task.status === "done" ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
                            </div>
                            <div>
                                <p className={cn("text-sm font-medium", task.status === "done" ? "text-slate-500 line-through" : "text-slate-700")}>
                                    {task.title}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <button className="w-full py-2 text-sm text-indigo-600 font-medium border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors">
                + Link Task
            </button>
        </div>
    );
}
