import { cn } from "@/lib/utils";

interface EnergyMeterProps {
    currentEnergy: number;
    maxEnergy?: number;
}

export function EnergyMeter({ currentEnergy, maxEnergy = 30 }: EnergyMeterProps) {
    const percentage = Math.min(100, Math.max(0, (currentEnergy / maxEnergy) * 100));

    let colorClass = "bg-emerald-500";
    if (percentage > 80) {
        colorClass = "bg-rose-500";
    } else if (percentage >= 50) {
        colorClass = "bg-amber-500";
    }

    return (
        <div className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-lg font-semibold text-slate-900">Personal Intelligence Scheduler</h2>
                <span className="text-sm font-medium text-slate-500">
                    {currentEnergy}/{maxEnergy} Energy Units Used
                </span>
            </div>

            <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn("h-full transition-all duration-500 ease-in-out", colorClass)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
