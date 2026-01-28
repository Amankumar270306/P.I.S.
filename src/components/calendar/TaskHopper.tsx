import { GripVertical } from "lucide-react";

const backlogTasks = [
    { id: "1", title: "Review Q4 Goals", energy: 5 },
    { id: "2", title: "Call Mom", energy: 2 },
    { id: "3", title: "Update Portfolio", energy: 8 },
    { id: "4", title: "Dentist Appointment", energy: 4 },
];

export function TaskHopper() {
    return (
        <div className="w-64 border-l border-slate-200 bg-slate-50 flex flex-col h-full">
            <div className="p-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-900">Task Hopper</h2>
                <p className="text-xs text-slate-500">Drag to schedule</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {backlogTasks.map(task => (
                    <div
                        key={task.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 cursor-move hover:border-indigo-300 transition-colors"
                        draggable
                    >
                        <GripVertical className="size-4 text-slate-400" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                            <span className="text-xs text-slate-400">⚡ {task.energy} Energy</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
